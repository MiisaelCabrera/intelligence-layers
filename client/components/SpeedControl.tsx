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

    socket.onopen = () => console.log("Speed control subscribed to tamping websocket");
    socket.onerror = (error) => console.error("Speed control websocket error", error);
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
        body: JSON.stringify({ mode: speeds.autoMode ? "manual" : "auto", analysisSpeedKmh: analysisValue }),
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
    <section className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-700 bg-slate-800/70 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Velocity Control</h2>
          <p className="text-sm text-slate-400">
            Adjust the simulated analysis/tamping speed or let the AI recommend it.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAutoMode}
          disabled={!speeds || pending}
          className={`px-3 py-1 text-xs font-semibold rounded border ${
            speeds?.autoMode
              ? "bg-emerald-600/80 border-emerald-500 text-emerald-50"
              : "bg-slate-800 border-slate-600 text-slate-200"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {speeds?.autoMode ? "AI Control On" : "Enable AI Control"}
        </button>
      </header>

      <div className="p-6 flex flex-col gap-5 text-sm text-slate-300">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
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
              onMouseUp={(event) => submitManualSpeed(Number(event.currentTarget.value))}
              onTouchEnd={(event) => submitManualSpeed(Number((event.target as HTMLInputElement).value))}
              disabled={sliderDisabled}
              className="flex-1 accent-emerald-500"
            />
            <span className="w-24 text-right font-semibold">
              {formatSpeed(analysisValue)}
            </span>
          </div>
          {suggested && (
            <p className="mt-2 text-xs text-slate-500">
              AI suggestion:{" "}
              <span className="text-emerald-300 font-medium">
                {formatSpeed(suggested)}
              </span>
              {speeds?.autoMode ? " (auto adjusting)" : " (tap slider to apply)"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 border border-slate-800 rounded p-3">
          <div>
            <span className="block text-slate-500 uppercase tracking-widest mb-1">
              Current analysis speed
            </span>
            <span className="text-slate-200 text-lg font-semibold">
              {speeds ? formatSpeed(speeds.analysisSpeedKmh) : "—"}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 uppercase tracking-widest mb-1">
              Current tamping speed
            </span>
            <span className="text-slate-200 text-lg font-semibold">
              {speeds ? formatSpeed(speeds.tampingSpeedKmh) : "—"}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          When AI control is enabled, the model adjusts the speed continuously based on the ratio of
          successful proceed decisions. You can switch back to manual control at any time.
        </p>
      </div>
    </section>
  );
}

