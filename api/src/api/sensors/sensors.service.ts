export interface Sensor {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const MOCK_SENSORS: Sensor[] = [
  {
    id: "sensor-1",
    name: "Primary LIDAR",
    description: "Front-mounted lidar array",
    createdAt: new Date("2024-10-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-15T00:00:00.000Z"),
  },
  {
    id: "sensor-2",
    name: "Thermal Camera",
    description: "Wide-angle thermal imaging",
    createdAt: new Date("2024-11-20T00:00:00.000Z"),
    updatedAt: new Date("2025-02-10T00:00:00.000Z"),
  },
];

export class SensorsService {
  async list(): Promise<Sensor[]> {
    return MOCK_SENSORS;
  }
}