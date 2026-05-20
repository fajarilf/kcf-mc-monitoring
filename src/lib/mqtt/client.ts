"use client";

import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import { mqttConfig } from "./config";

export type MqttStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "error";

export interface MqttMessage {
  /** Concrete topic the message arrived on (never contains wildcards). */
  topic: string;
  /** Raw binary payload. */
  payload: Uint8Array;
  /** UTF-8 decoded payload. */
  text: string;
}

export type MqttMessageHandler = (message: MqttMessage) => void;
export type MqttStatusListener = (status: MqttStatus) => void;

export interface MqttPublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

/**
 * Tests an MQTT topic *filter* (which may contain `+` and `#` wildcards)
 * against a concrete *topic*.
 *
 * - `+` matches exactly one level.
 * - `#` matches the rest of the topic and must be the last segment.
 */
export function topicMatches(filter: string, topic: string): boolean {
  if (filter === topic) return true;
  const f = filter.split("/");
  const t = topic.split("/");
  for (let i = 0; i < f.length; i++) {
    const seg = f[i];
    if (seg === "#") return true;
    if (t[i] === undefined) return false;
    if (seg !== "+" && seg !== t[i]) return false;
  }
  return f.length === t.length;
}

/**
 * A single, shared MQTT connection for the whole browser tab.
 *
 * The bus is connection-pooled and ref-counted: many components can subscribe
 * to the same (or overlapping) topic filters, but only one WebSocket is opened
 * and each filter is `SUBSCRIBE`d on the broker exactly once. Filters are
 * `UNSUBSCRIBE`d again once their last local handler is removed.
 *
 * It is SSR-safe — constructing the singleton on the server is harmless; no
 * socket is opened until {@link MqttBus.connect} runs in the browser.
 */
class MqttBus {
  private client: MqttClient | null = null;
  private status: MqttStatus = "idle";
  private readonly handlers = new Map<string, Set<MqttMessageHandler>>();
  private readonly statusListeners = new Set<MqttStatusListener>();
  private readonly decoder =
    typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

  getStatus(): MqttStatus {
    return this.status;
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe function. */
  onStatus(listener: MqttStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(next: MqttStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const listener of this.statusListeners) listener(next);
  }

  /** Open the shared connection. Idempotent; a no-op during SSR. */
  connect(): void {
    if (typeof window === "undefined" || this.client) return;

    const clientId = `${mqttConfig.clientIdPrefix}-${Math.random()
      .toString(16)
      .slice(2, 10)}`;

    const options: IClientOptions = {
      clientId,
      username: mqttConfig.username,
      password: mqttConfig.password,
      clean: true,
      keepalive: mqttConfig.keepaliveSeconds,
      reconnectPeriod: mqttConfig.reconnectPeriodMs,
      connectTimeout: mqttConfig.connectTimeoutMs,
    };

    this.setStatus("connecting");
    const client = mqtt.connect(mqttConfig.url, options);
    this.client = client;

    client.on("connect", () => {
      this.setStatus("connected");
      // (Re)subscribe every active filter — also covers reconnects.
      const filters = [...this.handlers.keys()];
      if (filters.length > 0) client.subscribe(filters);
    });
    client.on("reconnect", () => this.setStatus("reconnecting"));
    client.on("close", () => this.setStatus("offline"));
    client.on("offline", () => this.setStatus("offline"));
    client.on("error", (err) => {
      console.error("[mqtt] connection error:", err.message);
      this.setStatus("error");
    });
    client.on("message", (topic, payload) => this.dispatch(topic, payload));
  }

  private dispatch(topic: string, payload: Uint8Array): void {
    let message: MqttMessage | null = null;
    for (const [filter, set] of this.handlers) {
      if (!topicMatches(filter, topic)) continue;
      // Decode lazily — and only once even if several filters match.
      message ??= {
        topic,
        payload,
        text: this.decoder ? this.decoder.decode(payload) : "",
      };
      for (const handler of set) {
        try {
          handler(message);
        } catch (err) {
          console.error(`[mqtt] handler threw for "${topic}":`, err);
        }
      }
    }
  }

  /**
   * Register `handler` for a topic filter (`+` / `#` wildcards allowed).
   * Connects the bus on first use. Returns an unsubscribe function — always
   * call it on cleanup.
   */
  subscribe(filter: string, handler: MqttMessageHandler): () => void {
    if (typeof window === "undefined") return () => {};

    this.connect();

    let set = this.handlers.get(filter);
    if (!set) {
      set = new Set();
      this.handlers.set(filter, set);
      // First local handler for this filter — tell the broker. If we are not
      // connected yet, the "connect" event will subscribe it for us.
      if (this.client?.connected) this.client.subscribe(filter);
    }
    set.add(handler);

    return () => {
      const current = this.handlers.get(filter);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.handlers.delete(filter);
        this.client?.unsubscribe(filter);
      }
    };
  }

  /** Publish a message. Connects the bus on first use; a no-op during SSR. */
  publish(
    topic: string,
    payload: string | Uint8Array,
    options: MqttPublishOptions = {},
  ): void {
    if (typeof window === "undefined") return;
    this.connect();
    this.client?.publish(topic, payload as string | Buffer, {
      qos: options.qos ?? 0,
      retain: options.retain ?? false,
    });
  }

  /** Close the connection and drop every handler. Rarely needed in an SPA. */
  disconnect(): void {
    this.client?.end(true);
    this.client = null;
    this.handlers.clear();
    this.setStatus("idle");
  }
}

/** The shared MQTT bus singleton. Prefer the hooks in `@/hooks/use-mqtt`. */
export const mqttClient = new MqttBus();
