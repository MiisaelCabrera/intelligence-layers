"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TampingEvent {
  type: string;
  pt: number;
  timestamp: string;
}

const MAX_SAMPLES = 50;
const DISTANCE_PER_POINT_METERS = Number(
  process.env.NEXT_PUBLIC_POINT_DISTANCE_METERS ?? "0.6"
);

const buildWebsocketUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";
  try {
    const url = new URL(base);
    if (!url.pathname.endsWith("/ws/tamping")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/ws/tamping`;
    }
    return url.toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_WS_URL for tamping stream", error);
    return "ws://localhost:4000/ws/tamping";
  }
};

export default function TampingSpeed() {
  const [events, setEvents] = useState<TampingEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(buildWebsocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TampingEvent;
        if (data.type !== "tamping-decision") return;

        setEvents((prev) =>
          [
            { pt: data.pt, timestamp: data.timestamp, type: data.type },
            ...prev,
          ].slice(0, MAX_SAMPLES)
        );
      } catch (error) {
        console.error("Failed to process tamping payload", error);
      }
    };

    socket.onopen = () =>
      console.log("Connected to tamping websocket (speed)");
    socket.onerror = (error) =>
      console.error("Tamping speed WS error", error);
    socket.onclose = () => console.log("Tamping speed websocket closed");

    return () => {
      socket.close();
    };
  }, []);

  const speedInfo = useMemo(() => {
    if (events.length < 2) {
      return {
        kmh: 0,
        pointDelta: 0,
        timeDeltaSec: 0,
      };
    }

    const newest = events[0];
    const oldest = events[events.length - 1];

    const pointDelta = events.length - 1;
    const metersTravelled = pointDelta * DISTANCE_PER_POINT_METERS;

    const newestTime = new Date(newest.timestamp).getTime();
    const oldestTime = new Date(oldest.timestamp).getTime();
    const timeDeltaMs = Math.max(1, newestTime - oldestTime);
    const timeDeltaSec = timeDeltaMs / 1000;

    const metersPerSecond = metersTravelled / timeDeltaSec;
    const kmPerHour = metersPerSecond * 3.6;

    return {
      kmh: kmPerHour,
      pointDelta,
      timeDeltaSec,
    };
  }, [events]);

  return (
    <section className="w-full max-w-2xl mx-auto bg-white text-[#111827] rounded-3xl border border-[#e5e7eb] shadow-[0_14px_32px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Header */}
      <header className="px-5 md:px-6 py-3 border-b border-[#f3f4f6] bg-gradient-to-r from-white via-white to-[#f9fafb]">
        <h2 className="text-base font-semibold">Tamping Speed</h2>
        <p className="text-xs text-[#6b7280]">
          Estimated movement speed based on tamping decision frequency.
        </p>
      </header>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4 text-xs text-[#4b5563]">
        {/* Speed headline */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">
            Estimated speed
          </span>
          <span className="text-2xl font-bold text-emerald-600 tabular-nums">
            {Number.isFinite(speedInfo.kmh)
              ? `${speedInfo.kmh.toFixed(2)} km/h`
              : "n/a"}
          </span>
        </div>

        {/* Small stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3">
            <span className="block text-[11px] text-[#9ca3af] uppercase tracking-[0.18em] mb-1">
              Points traversed
            </span>
            <span className="text-[#111827] font-semibold">
              {speedInfo.pointDelta}
            </span>
            <span className="text-[#6b7280] block">
              ({(speedInfo.pointDelta * DISTANCE_PER_POINT_METERS).toFixed(2)} m)
            </span>
          </div>

          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3">
            <span className="block text-[11px] text-[#9ca3af] uppercase tracking-[0.18em] mb-1">
              Time interval
            </span>
            <span className="text-[#111827] font-semibold">
              {speedInfo.timeDeltaSec.toFixed(2)} s
            </span>
            <span className="text-[#6b7280] block">
              ({(speedInfo.timeDeltaSec / 60).toFixed(2)} min)
            </span>
          </div>
        </div>

        {/* Latest samples log (compact) */}
        {events.length > 0 && (
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3 text-[11px]">
            <span className="block text-[11px] text-[#9ca3af] uppercase tracking-[0.18em] mb-1">
              Latest samples ({events.length})
            </span>
            <pre className="text-[#6b7280] max-h-24 overflow-y-auto leading-relaxed">
              {events
                .map(
                  (event) =>
                    `pt=${event.pt.toFixed(1)} @ ${new Date(
                      event.timestamp
                    ).toLocaleTimeString()}`
                )
                .join("\n")}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
