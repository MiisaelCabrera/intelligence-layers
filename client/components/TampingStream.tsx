"use client";

import { useEffect, useRef, useState } from "react";

type DecisionLabel = "PROCEED" | "IGNORE";

interface TampingEvent {
  type: string;
  sampleId: string;
  pt: number;
  decision: DecisionLabel;
  score: number;
  fallback?: boolean;
  vector?: number[];
  snapshot?: string;
  suggestedSpeedKmh?: number;
  timestamp: string;
}

interface TampingEntry extends TampingEvent {
  clientId: string;
  feedbackStatus?: "idle" | "submitting" | "submitted" | "error";
  feedbackLabel?: DecisionLabel;
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

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const parseSnapshot = (snapshot?: string) => {
  if (!snapshot) return null;
  try {
    return JSON.parse(snapshot);
  } catch {
    return snapshot;
  }
};

export default function TampingStream() {
  const [events, setEvents] = useState<TampingEntry[]>([]);
  const [selected, setSelected] = useState<TampingEntry | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const SCROLL_THRESHOLD = 40;

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
          feedbackStatus: "idle",
        };

        setEvents((prev) => [...prev, entry].slice(-MAX_EVENTS));
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

  const sendFeedback = async (entry: TampingEntry, label: DecisionLabel) => {
    setEvents((prev) =>
      prev.map((item) =>
        item.clientId === entry.clientId
          ? { ...item, feedbackStatus: "submitting" }
          : item
      )
    );

    try {
      const response = await fetch(buildApiUrl("/api/tamping/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId: entry.sampleId, label }),
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
      console.error("Unable to submit tamping feedback", error);
      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === entry.clientId
            ? { ...item, feedbackStatus: "error" }
            : item
        )
      );
    }
  };

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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !autoScrollRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [events]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, clientHeight, scrollHeight } = container;
    const atBottom =
      scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;
    autoScrollRef.current = atBottom;
  };

  return (
    <section className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-700 bg-slate-800/70">
        <h2 className="text-lg font-semibold">Tamping Decisions</h2>
        <p className="text-sm text-slate-400">
          Streaming tamping proceed/ignore decisions from the backend service.
        </p>
      </header>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[32rem] overflow-y-auto divide-y divide-slate-800"
      >
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

                {typeof event.suggestedSpeedKmh === "number" && (
                  <div className="text-xs text-slate-400">
                    AI suggested speed:{" "}
                    <span className="text-emerald-300 font-semibold">
                      {event.suggestedSpeedKmh.toFixed(2)} km/h
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {event.fallback && (
                    <span
                      className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest rounded ${styles.badge}`}
                    >
                      rule fallback
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(event)}
                    className="px-2 py-1 text-xs rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    View details
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendFeedback(event, "PROCEED")}
                    disabled={
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
                      event.feedbackStatus === "submitting" ||
                      event.feedbackStatus === "submitted"
                    }
                    className="px-3 py-1 text-xs font-medium rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Mark Ignore
                  </button>
                  {event.feedbackStatus === "submitted" &&
                    event.feedbackLabel && (
                      <span className="text-xs text-emerald-400">
                        Feedback saved ({event.feedbackLabel})
                      </span>
                    )}
                  {event.feedbackStatus === "error" && (
                    <span className="text-xs text-red-400">
                      Feedback failed
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                Tamping decision details
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>
                  sample:{" "}
                  <span className="font-mono text-slate-200">
                    {selected.sampleId}
                  </span>
                </span>
                <span>
                  pt:{" "}
                  <span className="font-mono text-slate-200">
                    {selected.pt.toFixed(1)}
                  </span>
                </span>
                <span>
                  confidence:{" "}
                  <span className="font-mono text-slate-200">
                    {selected.score.toFixed(3)}
                  </span>
                </span>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                  Snapshot
                </h4>
                <pre className="bg-slate-950 border border-slate-800 rounded p-3 max-h-60 overflow-y-auto text-xs">
                  {JSON.stringify(parseSnapshot(selected.snapshot), null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                  Embedding (first 24 dims)
                </h4>
                <pre className="bg-slate-950 border border-slate-800 rounded p-3 max-h-60 overflow-y-auto text-xs">
                  {selected.vector && selected.vector.length
                    ? selected.vector
                        .slice(0, 24)
                        .map((v) => v.toFixed(4))
                        .join(", ") +
                      (selected.vector.length > 24 ? " ..." : "")
                    : "n/a"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
