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

type DecisionLabel = "PROCEED" | "IGNORE";

interface AlertEntry extends AlertEvent {
  clientId: string;
  sampleId?: string;
  decision?: DecisionLabel;
  score?: number;
  fallback?: boolean;
  feedbackStatus?: "idle" | "submitting" | "submitted" | "error";
  feedbackLabel?: DecisionLabel;
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

const buildMlUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_ML_SERVICE_URL ?? "http://localhost:8000";
  try {
    const url = new URL(path, base);
    return url.toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_ML_SERVICE_URL", error);
    return `http://localhost:8000${path}`;
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
        if (data.type !== "alert") return;

        const clientId = createClientId();
        const entry: AlertEntry = {
          ...data,
          clientId,
          feedbackStatus: "idle",
        };

        setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS));
        void requestDecision(entry);
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

  const requestDecision = async (entry: AlertEntry) => {
    try {
      const response = await fetch(buildMlUrl("/decision"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert: entry }),
      });

      if (!response.ok) {
        throw new Error(`Decision request failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        sample_id: string;
        decision: DecisionLabel;
        score: number;
        fallback?: boolean;
      };

      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === entry.clientId
            ? {
                ...item,
                sampleId: payload.sample_id,
                decision: payload.decision,
                score: payload.score,
                fallback: payload.fallback ?? false,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Unable to obtain proceed decision", error);
    }
  };

  const sendFeedback = async (entry: AlertEntry, label: DecisionLabel) => {
    if (!entry.sampleId) return;

    setEvents((prev) =>
      prev.map((item) =>
        item.clientId === entry.clientId
          ? { ...item, feedbackStatus: "submitting" }
          : item
      )
    );

    try {
      const response = await fetch(buildMlUrl("/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_id: entry.sampleId, label }),
      });

      if (!response.ok) {
        throw new Error(`Feedback request failed with ${response.status}`);
      }

      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === entry.clientId
            ? {
                ...item,
                feedbackStatus: "submitted",
                feedbackLabel: label,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Unable to submit feedback", error);
      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === entry.clientId
            ? { ...item, feedbackStatus: "error" }
            : item
        )
      );
    }
  };

  const variantClasses = (entry: AlertEntry, config: ConfigResponse | null) => {
    if (entry.decision === "IGNORE") {
      return {
        container: "bg-red-950/60 border-red-500/40",
        label: "text-red-200",
        value: "text-red-200",
        badge: "bg-red-700 text-red-100",
      };
    }

    if (entry.decision === "PROCEED") {
      return {
        container: "bg-emerald-950/40 border-emerald-500/30",
        label: "text-emerald-200",
        value: "text-emerald-300",
        badge: "bg-emerald-700 text-emerald-100",
      };
    }

    if (config) {
      if (entry.alert.value <= config.urgentThreshold) {
        return {
          container: "bg-red-950/40 border-red-600/40",
          label: "text-red-200",
          value: "text-red-300",
          badge: "bg-red-700 text-red-100",
        };
      }
      if (entry.alert.value <= config.confidenceThreshold) {
        return {
          container: "bg-amber-900/30 border-amber-500/30",
          label: "text-amber-200",
          value: "text-amber-300",
          badge: "bg-amber-600 text-amber-100",
        };
      }
    }

    return {
      container: "bg-slate-800/30 border-slate-700/40",
      label: "text-slate-300",
      value: "text-emerald-300",
      badge: "bg-slate-700 text-slate-200",
    };
  };

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
        {events.length === 0 ? (
          <div className="px-4 py-6 text-slate-500 text-sm text-center">
            Waiting for alerts…
          </div>
        ) : (
          events.map((event) => {
            const styles = variantClasses(event, config);
            const decisionText = event.decision ?? "PENDING";

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

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded ${styles.badge}`}>
                    {decisionText}
                    {event.fallback && event.decision && (
                      <span className="text-[10px] uppercase tracking-widest">
                        rule
                      </span>
                    )}
                  </span>
                  {typeof event.score === "number" && (
                    <span className="text-slate-500">
                      confidence {event.score.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendFeedback(event, "PROCEED")}
                    disabled={
                      !event.sampleId ||
                      event.feedbackStatus === "submitting" ||
                      event.feedbackStatus === "submitted"
                    }
                    className="px-3 py-1 text-xs font-medium rounded bg-emerald-700 text-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
                  >
                    Mark Proceed
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback(event, "IGNORE")}
                    disabled={
                      !event.sampleId ||
                      event.feedbackStatus === "submitting" ||
                      event.feedbackStatus === "submitted"
                    }
                    className="px-3 py-1 text-xs font-medium rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Mark Ignore
                  </button>
                  {event.feedbackStatus === "submitted" && event.feedbackLabel && (
                    <span className="text-xs text-emerald-400">
                      Feedback saved ({event.feedbackLabel})
                    </span>
                  )}
                  {event.feedbackStatus === "error" && (
                    <span className="text-xs text-red-400">Feedback failed</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

