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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const SCROLL_THRESHOLD = 40;

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

        setEvents((prev) => [...prev, entry].slice(-MAX_EVENTS));
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
      // Urgentes: rojo suave
      return {
        container: "bg-red-50 border border-red-100",
        label: "text-red-700",
        value: "text-red-600",
      };
    }

    // No urgentes: amber suave
    return {
      container: "bg-amber-50 border border-amber-100",
      label: "text-amber-800",
      value: "text-amber-700",
    };
  };

  const filteredEvents = events.filter((event) => {
    if (!config) return true;
    return event.alert.value <= config.urgentThreshold;
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !autoScrollRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [filteredEvents]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, clientHeight, scrollHeight } = container;
    const atBottom =
      scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;
    autoScrollRef.current = atBottom;
  };

  return (
    <section className="w-full max-w-2xl mx-auto bg-white text-[#111827] rounded-3xl border border-[#e5e7eb] shadow-[0_18px_40px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Header */}
      <header className="px-5 md:px-6 py-4 border-b border-[#f3f4f6] bg-gradient-to-r from-white via-white to-[#f9fafb]">
        <h2 className="text-base md:text-lg font-semibold">
          Live Alerts Stream
        </h2>
        <p className="text-xs md:text-sm text-[#6b7280] flex flex-wrap items-center gap-2">
          Streaming alert events from the backend websocket.
          {config && (
            <span className="inline-flex gap-3 text-[11px] text-[#9ca3af]">
              <span>
                urgent ≤{" "}
                <span className="font-semibold text-red-600">
                  {config.urgentThreshold}
                </span>
              </span>
              <span>
                caution ≤{" "}
                <span className="font-semibold text-amber-600">
                  {config.confidenceThreshold}
                </span>
              </span>
            </span>
          )}
        </p>
      </header>

      {/* Stream list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[18rem] overflow-y-auto bg-white px-4 py-4 space-y-3"
      >
        {filteredEvents.length === 0 ? (
          <div className="px-2 py-6 text-[#9ca3af] text-sm text-center">
            Waiting for alerts…
          </div>
        ) : (
          filteredEvents.map((event) => {
            const styles = variantClasses(event, config);

            return (
              <article
                key={event.clientId}
                className={`px-4 py-3 flex flex-col gap-3 rounded-2xl ${styles.container} shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-colors`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] tracking-[0.14em] uppercase text-[#9ca3af]">
                  <span className="font-mono text-sky-600">
                    pt: {event.pt.toFixed(1)}
                  </span>
                  <time
                    className="text-[#9ca3af]"
                    dateTime={event.timestamp}
                  >
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </time>
                </div>

                {/* Label + value */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${styles.label}`}>
                    {event.alert.label}
                  </span>
                  <span className={`text-lg font-semibold tabular-nums ${styles.value}`}>
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
