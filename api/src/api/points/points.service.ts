export interface PointAlert {
  label: string;
  value: number;
}

export interface PointInstruction {
  label: string;
  value: number;
}

export type PointStatus = "IGNORE" | "PROCEED";

export interface Point {
  id: string;
  pt: number;
  alerts: PointAlert[];
  instructions: PointInstruction[];
  status: PointStatus;
}

const MOCK_POINTS: Point[] = [
  {
    id: "point-1",
    pt: 0.42,
    alerts: [
      { label: "voltage-spike", value: 2 },
      { label: "temp-drift", value: 1 },
    ],
    instructions: [
      { label: "calibrate", value: 1 },
      { label: "notify-supervisor", value: 2 },
    ],
    status: "PROCEED",
  },
  {
    id: "point-2",
    pt: -0.13,
    alerts: [{ label: "signal-loss", value: 3 }],
    instructions: [{ label: "run-diagnostics", value: 1 }],
    status: "IGNORE",
  },
];

export class PointsService {
  async list(): Promise<Point[]> {
    return MOCK_POINTS;
  }
}