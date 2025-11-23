"use client";

import { useEffect, useRef, useState } from "react";

interface AlertEvent {
  type: string;
  pt: number;
  alert: {
    label: string;
    value: number;
  };
  timestamp: string;
}

interface ConfigResponse {
  confidenceThreshold: number;
  urgentThreshold: number;
}

interface AlertEntry extends AlertEvent {
  clientId: string;
}

const MAX_EVENTS = 50;

const buildWebsocketUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";
  try {
    const url = new URL(base);
    if (!url.pathname.endsWith("/ws/alerts")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/ws/alerts`;
    }
    return url.toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_WS_URL", error);
    return "ws://localhost:4000/ws/alerts";
  }
};

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export default function AlertStream() {
  const [events, setEvents] = useState<AlertEntry[]>([]);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000") +
            "/api/configs"
        );
        if (!response.ok) throw new Error("Failed to fetch config");
        const configs = (await response.json()) as ConfigResponse[];
        if (configs.length > 0) {
          setConfig(configs[0]);
        }
      } catch (error) {
        console.error("Unable to load configuration", error);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(buildWebsocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AlertEvent;
        if (data.type !== "alert") return;

        const entry: AlertEntry = {
          ...data,
          clientId: createClientId(),
        };

        setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS));
      } catch (error) {
        console.error("Failed to process alert payload", error);
      }
    };

    socket.onopen = () => console.log("Connected to alerts websocket");
    socket.onerror = (error) => console.error("WebSocket error", error);
    socket.onclose = () => console.log("Alerts websocket closed");

    return () => {
      socket.close();
    };
  }, []);

  const variantClasses = (entry: AlertEntry, config: ConfigResponse | null) => {
    if (config && entry.alert.value <= config.urgentThreshold) {
      return {
        container: "bg-red-950/40 border-red-600/40",
        label: "text-red-200",
        value: "text-red-300",
        badge: "bg-red-700 text-red-100",
      };
    }

    return {
      container: "bg-slate-800/30 border-slate-700/40",
      label: "text-slate-300",
      value: "text-emerald-300",
      badge: "bg-slate-700 text-slate-200",
    };
  };

  const filteredEvents = events.filter((event) => {
    if (!config) return true;
    return event.alert.value <= config.urgentThreshold;
  });

  return (
    <section className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-700 bg-slate-800/70">
        <h2 className="text-lg font-semibold">Live Alerts Stream</h2>
        <p className="text-sm text-slate-400 flex flex-wrap items-center gap-2">
          Streaming alert events from the backend websocket.
          {config && (
            <span className="inline-flex gap-2 text-xs text-slate-500">
              <span>
                urgent ≤ <span className="font-semibold">{config.urgentThreshold}</span>
              </span>
              <span>
                caution ≤ <span className="font-semibold">{config.confidenceThreshold}</span>
              </span>
            </span>
          )}
        </p>
      </header>
      <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-800">
        {filteredEvents.length === 0 ? (
          <div className="px-4 py-6 text-slate-500 text-sm text-center">
            Waiting for alerts…
          </div>
        ) : (
          filteredEvents.map((event) => {
            const styles = variantClasses(event, config);

            return (
              <article
                key={event.clientId}
                className={`px-4 py-4 flex flex-col gap-3 border-b border-slate-800/40 ${styles.container} transition-colors`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs tracking-wide uppercase text-slate-500">
                  <span className="font-mono text-sky-300">pt: {event.pt.toFixed(1)}</span>
                  <time className="text-slate-500" dateTime={event.timestamp}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </time>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${styles.label}`}>
                    {event.alert.label}
                  </span>
                  <span className={`text-lg font-semibold ${styles.value}`}>
                    {event.alert.value.toFixed(2)}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

