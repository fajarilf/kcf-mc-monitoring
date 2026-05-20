"use client";

import Link from "next/link";
import { MachineCard } from "@/components/monitoring/MachineCard";
import { machines } from "@/lib/mock-data";
import { useMqttJson, useMqttStatus } from "@/hooks/use-mqtt";
import { useEffect } from "react";
import { MqttResponses } from "@/types/mqtt-responses";

export default function MonitoringPage() {
  const mqttStatus = useMqttStatus();
  
  useEffect(() => {
    console.log(`mqtt_connection: ${mqttStatus}`)
  }, [mqttStatus])
  
  useMqttJson<MqttResponses>("machines/#", (data) => {
    console.log(data)
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {machines.map((m) => (
        <Link
          key={m.id}
          href={`/monitoring/${m.id}`}
          aria-label={`View details for ${m.name}`}
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MachineCard machine={m} />
        </Link>
      ))}
    </div>
  );
}