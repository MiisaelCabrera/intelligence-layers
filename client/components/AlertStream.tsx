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

const buildApiUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const url = new URL(path, base);
    return url.toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_API_URL", error);
    return `http://localhost:4000${path}`;
  }
};

export default function AlertStream() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/configs"));
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
        if (data.type === "alert") {
          setEvents((prev) => [
            { ...data },
            ...prev.slice(0, 49),
          ]);
        }
      } catch (error) {
        console.error("Failed to parse alert payload", error);
      }
    };

    socket.onopen = () => console.log("Connected to alerts websocket");
    socket.onerror = (error) => console.error("WebSocket error", error);
    socket.onclose = () => console.log("Alerts websocket closed");

    return () => {
      socket.close();
    };
  }, []);

  const resolveAlertVariant = (alert: AlertEvent["alert"]) => {
    if (!config) return "default" as const;

    if (alert.value <= config.urgentThreshold) {
      return "urgent" as const;
    }

    if (alert.value <= config.confidenceThreshold) {
      return "warning" as const;
    }

    return "default" as const;
  };

  const variantClasses = (variant: "urgent" | "warning" | "default") => {
    switch (variant) {
      case "urgent":
        return {
          container: "bg-red-950/40 border-red-600/40",
          label: "text-red-200",
          value: "text-red-300",
        };
      case "warning":
        return {
          container: "bg-amber-900/30 border-amber-500/30",
          label: "text-amber-200",
          value: "text-amber-300",
        };
      default:
        return {
          container: "bg-slate-800/30 border-slate-700/40",
          label: "text-slate-300",
          value: "text-emerald-300",
        };
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-700 bg-slate-800/70">
        <h2 className="text-lg font-semibold">Live Alerts Stream</h2>
        <p className="text-sm text-slate-400 flex items-center gap-2">
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
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-800">
        {events.length === 0 ? (
          <div className="px-4 py-6 text-slate-500 text-sm text-center">
            Waiting for alerts…
          </div>
        ) : (
          events.map((event, index) => {
            const variant = resolveAlertVariant(event.alert);
            const styles = variantClasses(variant);

            return (
              <article
                key={`${event.timestamp}-${index}`}
                className={`px-4 py-3 flex flex-col gap-1 border-b border-slate-800/40 ${styles.container} hover:bg-slate-800/60 transition-colors`}
              >
                <div className="flex items-center justify-between text-xs tracking-wide uppercase text-slate-500">
                  <span className="font-mono text-sky-300">
                    pt: {event.pt.toFixed(1)}
                  </span>
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

