import { intervalForSpeed } from "./utils";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const ANALYSIS_SPEED_KMH = Number(process.env.ANALYSIS_SPEED_KMH ?? "2");
const INTERVAL_MS = Number(
  process.env.GPR_INTERVAL_MS ?? intervalForSpeed(ANALYSIS_SPEED_KMH, 2000)
);

const randomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export async function startGprSimulator() {
  let counter = 1;

  const loop = async () => {
    const pt = Number((counter / 10).toFixed(1));
    const payload = {
      pt,
      instructions: [
        {
          label: "GPRRating",
          value: Number(randomFloat(0, 100).toFixed(2)),
        },
      ],
    };

    try {
      const response = await fetch(`${API_URL}/api/points/instructions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `GPR simulator request failed (${response.status}): ${text}`
        );
      }
    } catch (error) {
      console.error("GPR simulator request error", error);
    } finally {
      counter += 1;
      setTimeout(loop, INTERVAL_MS);
    }
  };

  loop();
}
