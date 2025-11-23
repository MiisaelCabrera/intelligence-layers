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
        container: "bg-red-50 border border-red-100",
        badge: "bg-red-100 text-red-700",
        text: "text-red-700",
      };
    }
    return {
      container: "bg-emerald-50 border border-emerald-100",
      badge: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-700",
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
    <section className="w-full max-w-2xl mx-auto bg-white text-[#111827] rounded-3xl border border-[#e5e7eb] shadow-[0_18px_40px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Header */}
      <header className="px-5 md:px-6 py-4 border-b border-[#f3f4f6] bg-gradient-to-r from-white via-white to-[#f9fafb]">
        <h2 className="text-base md:text-lg font-semibold">
          Tamping Decisions
        </h2>
        <p className="text-xs md:text-sm text-[#6b7280]">
          Live proceed/ignore decisions streamed from the backend service.
        </p>
      </header>

      {/* Stream list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[32rem] overflow-y-auto bg-white px-4 py-4 space-y-3"
      >
        {events.length === 0 ? (
          <div className="px-2 py-6 text-[#9ca3af] text-sm text-center">
            Waiting for tamping decisions…
          </div>
        ) : (
          events.map((event) => {
            const styles = stylingForDecision(event.decision);

            return (
              <article
                key={event.clientId}
                className={`px-4 py-3 flex flex-col gap-3 rounded-2xl ${styles.container} shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-colors`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] tracking-wide uppercase text-[#9ca3af]">
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

                {/* Decision + confidence */}
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${styles.text}`}>
                    {event.decision}
                  </span>
                  <span className="text-[#6b7280]">
                    confidence {event.score.toFixed(2)}
                  </span>
                </div>

                {/* Suggested speed */}
                {typeof event.suggestedSpeedKmh === "number" && (
                  <div className="text-xs text-[#6b7280]">
                    AI suggested speed:{" "}
                    <span className="text-emerald-700 font-semibold">
                      {event.suggestedSpeedKmh.toFixed(2)} km/h
                    </span>
                  </div>
                )}

                {/* Badges + details */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {event.fallback && (
                    <span
                      className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-[0.18em] rounded-full ${styles.badge}`}
                    >
                      rule fallback
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(event)}
                    className="px-2 py-1 text-xs rounded-full border border-[#d1d5db] text-[#4b5563] hover:bg-[#f3f4f6] transition-colors"
                  >
                    View details
                  </button>
                </div>

                {/* Feedback buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendFeedback(event, "PROCEED")}
                    disabled={
                      event.feedbackStatus === "submitting" ||
                      event.feedbackStatus === "submitted"
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
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
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-white text-[#111827] border border-[#d1d5db] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f3f4f6] transition-colors"
                  >
                    Mark Ignore
                  </button>
                  {event.feedbackStatus === "submitted" &&
                    event.feedbackLabel && (
                      <span className="text-xs text-emerald-600">
                        Feedback saved ({event.feedbackLabel})
                      </span>
                    )}
                  {event.feedbackStatus === "error" && (
                    <span className="text-xs text-red-500">
                      Feedback failed
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal de detalles */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#e5e7eb] rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111827]">
                Tamping decision details
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-[#6b7280] hover:text-[#111827] text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-sm text-[#374151]">
              <div className="flex flex-wrap gap-3 text-xs text-[#6b7280]">
                <span>
                  sample:{" "}
                  <span className="font-mono text-[#111827]">
                    {selected.sampleId}
                  </span>
                </span>
                <span>
                  pt:{" "}
                  <span className="font-mono text-[#111827]">
                    {selected.pt.toFixed(1)}
                  </span>
                </span>
                <span>
                  confidence:{" "}
                  <span className="font-mono text-[#111827]">
                    {selected.score.toFixed(3)}
                  </span>
                </span>
              </div>

              <div>
                <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#9ca3af] mb-1">
                  Snapshot
                </h4>
                <pre className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3 max-h-60 overflow-y-auto text-xs text-[#374151]">
                  {JSON.stringify(parseSnapshot(selected.snapshot), null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#9ca3af] mb-1">
                  Embedding (first 24 dims)
                </h4>
                <pre className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3 max-h-60 overflow-y-auto text-xs text-[#374151]">
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
