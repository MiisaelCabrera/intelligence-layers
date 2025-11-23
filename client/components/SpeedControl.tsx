"use client";

import { useEffect, useRef, useState } from "react";

interface SpeedState {
  analysisSpeedKmh: number;
  tampingSpeedKmh: number;
  autoMode: boolean;
}

interface TampingSuggestionEvent {
  type: string;
  suggestedSpeedKmh?: number;
}

const MIN_SPEED = Number(process.env.NEXT_PUBLIC_MIN_SPEED_KMH ?? "0.5");
const MAX_SPEED = Number(process.env.NEXT_PUBLIC_MAX_SPEED_KMH ?? "6");

const buildApiUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    return new URL(path, base).toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_API_URL", error);
    return `http://localhost:4000${path}`;
  }
};

const buildSocketUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";
  try {
    const url = new URL(base);
    if (!url.pathname.endsWith("/ws/tamping")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/ws/tamping`;
    }
    return url.toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_WS_URL", error);
    return "ws://localhost:4000/ws/tamping";
  }
};

const formatSpeed = (value: number) => `${value.toFixed(2)} km/h`;

export default function SpeedControl() {
  const [speeds, setSpeeds] = useState<SpeedState | null>(null);
  const [analysisValue, setAnalysisValue] = useState(2);
  const [suggested, setSuggested] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/speed"));
        if (!response.ok) throw new Error("Failed to load speed state");
        const data = (await response.json()) as SpeedState;
        setSpeeds(data);
        setAnalysisValue(data.analysisSpeedKmh);
      } catch (error) {
        console.error("Unable to fetch speed state", error);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(buildSocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TampingSuggestionEvent;
        if (data.type !== "tamping-decision") return;
        if (typeof data.suggestedSpeedKmh === "number") {
          setSuggested(data.suggestedSpeedKmh);
          if (speeds?.autoMode) {
            setAnalysisValue(data.suggestedSpeedKmh);
          }
        }
      } catch (error) {
        console.error("Failed to process tamping suggestion event", error);
      }
    };

    socket.onopen = () =>
      console.log("Speed control subscribed to tamping websocket");
    socket.onerror = (error) =>
      console.error("Speed control websocket error", error);
    socket.onclose = () => console.log("Speed control websocket closed");

    return () => {
      socket.close();
    };
  }, [speeds?.autoMode]);

  const submitManualSpeed = async (value: number) => {
    setPending(true);
    try {
      const response = await fetch(buildApiUrl("/api/speed"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          analysisSpeedKmh: value,
        }),
      });
      if (!response.ok) throw new Error(`Speed update failed (${response.status})`);
      const data = (await response.json()) as SpeedState;
      setSpeeds(data);
      setAnalysisValue(data.analysisSpeedKmh);
    } catch (error) {
      console.error("Unable to update speed", error);
    } finally {
      setPending(false);
    }
  };

  const toggleAutoMode = async () => {
    if (!speeds) return;
    setPending(true);
    try {
      const response = await fetch(buildApiUrl("/api/speed"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: speeds.autoMode ? "manual" : "auto",
          analysisSpeedKmh: analysisValue,
        }),
      });
      if (!response.ok) throw new Error(`Auto toggle failed (${response.status})`);
      const data = (await response.json()) as SpeedState;
      setSpeeds(data);
      setAnalysisValue(data.analysisSpeedKmh);
    } catch (error) {
      console.error("Unable to toggle auto mode", error);
    } finally {
      setPending(false);
    }
  };

  const sliderDisabled = speeds?.autoMode || pending || !speeds;

  return (
    <section className="w-full h-80 max-w-2xl mx-auto bg-white text-[#111827] rounded-3xl border border-[#e5e7eb] shadow-[0_18px_40px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Header */}
      <header className="px-5 md:px-6 py-4 border-b border-[#f3f4f6] bg-gradient-to-r from-white via-white to-[#f9fafb] flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-semibold">
            Speed Control
          </h2>
          <p className="text-xs md:text-sm text-[#6b7280]">
            Adjust the analysis speed or let the AI adapt it in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAutoMode}
          disabled={!speeds || pending}
          className={`
            inline-flex items-center justify-center rounded-full px-3 py-1.5
            text-[11px] font-semibold border transition-all duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
            ${
              speeds?.autoMode
                ? "bg-emerald-500 text-white border-transparent shadow-sm"
                : "bg-white text-[#111827] border-[#d1d5db] hover:bg-[#f3f4f6]"
            }
          `}
        >
          {speeds?.autoMode ? "AI Control On" : "Enable AI Control"}
        </button>
      </header>

      {/* Body */}
      <div className="p-5 md:p-6 flex flex-col gap-5 text-sm text-[#374151]">
        {/* Slider */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#9ca3af] mb-2">
            Analysis speed
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.1}
              value={analysisValue}
              onChange={(event) => setAnalysisValue(Number(event.target.value))}
              onMouseUp={(event) =>
                submitManualSpeed(Number(event.currentTarget.value))
              }
              onTouchEnd={(event) =>
                submitManualSpeed(
                  Number((event.target as HTMLInputElement).value)
                )
              }
              disabled={sliderDisabled}
              className="flex-1 accent-emerald-500 cursor-pointer"
            />
            <span className="w-24 text-right font-semibold tabular-nums">
              {formatSpeed(analysisValue)}
            </span>
          </div>

          {suggested && (
            <p className="mt-2 text-xs text-[#6b7280]">
              AI suggestion:{" "}
              <span className="text-emerald-600 font-medium">
                {formatSpeed(suggested)}
              </span>
              {speeds?.autoMode
                ? " (auto adjusting)"
                : " (use the slider to apply)"}
            </p>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3">
            <span className="block text-[11px] text-[#9ca3af] uppercase tracking-[0.18em] mb-1">
              Current analysis speed
            </span>
            <span className="text-[#111827] text-lg font-semibold tabular-nums">
              {speeds ? formatSpeed(speeds.analysisSpeedKmh) : "—"}
            </span>
          </div>

          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-3">
            <span className="block text-[11px] text-[#9ca3af] uppercase tracking-[0.18em] mb-1">
              Current tamping speed
            </span>
            <span className="text-[#111827] text-lg font-semibold tabular-nums">
              {speeds ? formatSpeed(speeds.tampingSpeedKmh) : "—"}
            </span>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs text-[#9ca3af] leading-relaxed">
          When AI control is enabled, the system adjusts the analysis speed
          based on tamping decisions and confidence. You can switch back to
          manual control at any time to override the suggested value.
        </p>
      </div>
    </section>
  );
}
