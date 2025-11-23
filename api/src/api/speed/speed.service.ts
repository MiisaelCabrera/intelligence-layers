import {
  getSpeeds,
  setAutoMode,
  setManualSpeeds,
} from "../../scripts/simulation-speed";

export interface SpeedState {
  analysisSpeedKmh: number;
  tampingSpeedKmh: number;
  autoMode: boolean;
}

export class SpeedService {
  getState(): SpeedState {
    return getSpeeds();
  }

  setManual(analysisSpeedKmh: number, tampingSpeedKmh?: number) {
    setManualSpeeds(analysisSpeedKmh, tampingSpeedKmh);
  }

  setAuto(enabled: boolean) {
    setAutoMode(enabled);
  }
}

