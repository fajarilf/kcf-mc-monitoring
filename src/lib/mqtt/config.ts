/**
 * Browser-side MQTT connection config.
 *
 * Every value is read from a `NEXT_PUBLIC_*` env var so it survives into the
 * browser bundle. Copy `.env.example` to `.env.local` and fill in real broker
 * details.
 *
 * NOTE: the URL MUST use a WebSocket scheme (`ws://` or `wss://`) — browsers
 * cannot open raw MQTT TCP sockets. Most brokers expose a separate WS port
 * (e.g. EMQX/Mosquitto default `8083` for `ws` and `8084` for `wss`).
 */
export interface MqttConfig {
  /** Broker WebSocket URL, e.g. `wss://broker.example.com:8084/mqtt`. */
  url: string;
  username?: string;
  password?: string;
  /** A random suffix is appended so every tab gets a unique client id. */
  clientIdPrefix: string;
  reconnectPeriodMs: number;
  connectTimeoutMs: number;
  keepaliveSeconds: number;
}

export const mqttConfig: MqttConfig = {
  url: process.env.NEXT_PUBLIC_MQTT_URL ?? "ws://localhost:8083/mqtt",
  username: process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined,
  password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined,
  clientIdPrefix: process.env.NEXT_PUBLIC_MQTT_CLIENT_ID ?? "kcf-mc-web",
  reconnectPeriodMs: Number(process.env.NEXT_PUBLIC_MQTT_RECONNECT_MS ?? 4000),
  connectTimeoutMs: 8000,
  keepaliveSeconds: 30,
};
