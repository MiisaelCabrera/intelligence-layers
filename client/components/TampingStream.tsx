"use client";

import { useEffect, useRef, useState } from "react";

type DecisionLabel = "PROCEED" | "IGNORE";

interface TampingEvent {
  type: string;
  pt: number;
  decision: DecisionLabel;
  score: number;
  fallback?: boolean;
  timestamp: string;
}

interface TampingEntry extends TampingEvent {
  clientId: string;
}

const MAX_EVENTS = 50;

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

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export default function TampingStream() {
  const [events, setEvents] = useState<TampingEntry[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(buildWebsocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TampingEvent;
        if (data.type !== "tamping-decision") return;

        const entry: TampingEntry = {
          ...data,
          clientId: createClientId(),
        };

        setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS));
      } catch (error) {
        console.error("Failed to process tamping payload", error);
      }
    };

    socket.onopen = () => console.log("Connected to tamping websocket");
    socket.onerror = (error) => console.error("Tamping WebSocket error", error);
    socket.onclose = () => console.log("Tamping websocket closed");

    return () => {
      socket.close();
    };
  }, []);

  const stylingForDecision = (decision: DecisionLabel) => {
    if (decision === "IGNORE") {
      return {
        container: "bg-red-950/60 border-red-500/40",
        badge: "bg-red-700 text-red-100",
        text: "text-red-200",
      };
    }
    return {
      container: "bg-emerald-950/40 border-emerald-500/30",
      badge: "bg-emerald-700 text-emerald-100",
      text: "text-emerald-200",
    };
  };

  return (
    <section className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-700 bg-slate-800/70">
        <h2 className="text-lg font-semibold">Tamping Decisions</h2>
        <p className="text-sm text-slate-400">
          Streaming tamping proceed/ignore decisions from the backend service.
        </p>
      </header>
      <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-800">
        {events.length === 0 ? (
          <div className="px-4 py-6 text-slate-500 text-sm text-center">
            Waiting for tamping decisions…
          </div>
        ) : (
          events.map((event) => {
            const styles = stylingForDecision(event.decision);

            return (
              <article
                key={event.clientId}
                className={`px-4 py-4 flex flex-col gap-3 border-b border-slate-800/40 ${styles.container} transition-colors`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs tracking-wide uppercase text-slate-500">
                  <span className="font-mono text-sky-300">
                    pt: {event.pt.toFixed(1)}
                  </span>
                  <time className="text-slate-500" dateTime={event.timestamp}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </time>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${styles.text}`}>
                    {event.decision}
                  </span>
                  <span className="text-slate-400">
                    confidence {event.score.toFixed(2)}
                  </span>
                </div>

                {event.fallback && (
                  <span className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest rounded ${styles.badge}`}>
                    rule fallback
                  </span>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

