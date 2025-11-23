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

        setEvents((prev) => [
          { pt: data.pt, timestamp: data.timestamp, type: data.type },
          ...prev,
        ].slice(0, MAX_SAMPLES));
      } catch (error) {
        console.error("Failed to process tamping payload", error);
      }
    };

    socket.onopen = () => console.log("Connected to tamping websocket (speed)");
    socket.onerror = (error) => console.error("Tamping speed WS error", error);
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
    <section className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-700 bg-slate-800/70">
        <h2 className="text-lg font-semibold">Tamping Speed</h2>
        <p className="text-sm text-slate-400">
          Estimated movement speed based on tamping decision frequency.
        </p>
      </header>

      <div className="p-6 flex flex-col gap-4 text-sm text-slate-300">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-500">
            Estimated speed
          </span>
          <span className="text-3xl font-bold text-emerald-300">
            {Number.isFinite(speedInfo.kmh)
              ? `${speedInfo.kmh.toFixed(2)} km/h`
              : "n/a"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/40 border border-slate-800 rounded p-3">
            <span className="block text-slate-500 uppercase tracking-widest">
              Points traversed
            </span>
            <span className="text-slate-200 font-semibold">
              {speedInfo.pointDelta}
            </span>
            <span className="text-slate-500 block">
              ({(speedInfo.pointDelta * DISTANCE_PER_POINT_METERS).toFixed(2)} m)
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded p-3">
            <span className="block text-slate-500 uppercase tracking-widest">
              Time interval
            </span>
            <span className="text-slate-200 font-semibold">
              {speedInfo.timeDeltaSec.toFixed(2)} s
            </span>
            <span className="text-slate-500 block">
              ({(speedInfo.timeDeltaSec / 60).toFixed(2)} min)
            </span>
          </div>
        </div>

        {events.length > 0 && (
          <div className="bg-slate-950/40 border border-slate-800 rounded p-3 text-xs">
            <span className="block text-slate-500 uppercase tracking-widest mb-1">
              latest samples ({events.length})
            </span>
            <pre className="text-slate-400 max-h-40 overflow-y-auto">
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

