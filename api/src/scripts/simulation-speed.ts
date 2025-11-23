import { intervalForSpeed } from "./utils";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const DEFAULT_ANALYSIS_SPEED_KMH = Number(
  process.env.ANALYSIS_SPEED_KMH ?? "2"
);

const DEFAULT_TAMPING_SPEED_KMH = Number(
  process.env.TAMPING_SPEED_KMH ?? `${DEFAULT_ANALYSIS_SPEED_KMH * 0.9}`
);

const MIN_SPEED_KMH = Number(process.env.MIN_SPEED_KMH ?? "0.5");
const MAX_SPEED_KMH = Number(process.env.MAX_SPEED_KMH ?? "6");

let analysisSpeedKmh = clamp(
  DEFAULT_ANALYSIS_SPEED_KMH,
  MIN_SPEED_KMH,
  MAX_SPEED_KMH
);

let tampingSpeedKmh = clamp(
  Math.min(DEFAULT_TAMPING_SPEED_KMH, analysisSpeedKmh),
  MIN_SPEED_KMH,
  MAX_SPEED_KMH
);

let autoMode = false;

const DEFAULT_ANALYSIS_INTERVAL_MS = intervalForSpeed(
  analysisSpeedKmh,
  2000
);

const DEFAULT_TAMPING_INTERVAL_MS = intervalForSpeed(
  tampingSpeedKmh,
  2000
);

export const getSpeeds = () => ({
  analysisSpeedKmh,
  tampingSpeedKmh,
  autoMode,
});

export const setManualSpeeds = (
  analysis: number,
  tamping?: number
) => {
  analysisSpeedKmh = clamp(analysis, MIN_SPEED_KMH, MAX_SPEED_KMH);
  tampingSpeedKmh = clamp(
    tamping !== undefined ? tamping : analysisSpeedKmh * 0.9,
    MIN_SPEED_KMH,
    MAX_SPEED_KMH
  );

  tampingSpeedKmh = Math.min(tampingSpeedKmh, analysisSpeedKmh);
  autoMode = false;
};

export const setAutoMode = (enabled: boolean) => {
  autoMode = enabled;
};

export const maybeApplySuggestedSpeed = (suggested?: number) => {
  if (!autoMode || suggested === undefined || !Number.isFinite(suggested)) {
    return;
  }

  const analysis = clamp(suggested, MIN_SPEED_KMH, MAX_SPEED_KMH);
  const tamping = clamp(analysis * 0.9, MIN_SPEED_KMH, analysis);

  analysisSpeedKmh = analysis;
  tampingSpeedKmh = tamping;
};

export const getAnalysisIntervalMs = () =>
  intervalForSpeed(analysisSpeedKmh, DEFAULT_ANALYSIS_INTERVAL_MS);

export const getTampingIntervalMs = () =>
  intervalForSpeed(tampingSpeedKmh, DEFAULT_TAMPING_INTERVAL_MS);

