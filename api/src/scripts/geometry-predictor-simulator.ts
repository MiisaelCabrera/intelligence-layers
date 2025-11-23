const API_URL = process.env.API_URL ?? "http://localhost:4000";
const INTERVAL_MS = Number(process.env.GEOMETRY_PREDICTOR_INTERVAL_MS ?? "2500");

const randomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const labels = [
  "geometryPredictor",
  "trajectoryDeviation",
  "structureConfidence",
  "shapeVariance",
];

export async function startGeometryPredictorSimulator() {
  let counter = 1;

  const loop = async () => {
    const pt = Number((counter / 10).toFixed(1));
    const payload = {
      pt,
      alerts: [
        {
          label: labels[counter % labels.length],
          value: Number(randomFloat(5, 90).toFixed(2)),
        },
      ],
    };

    try {
      const response = await fetch(`${API_URL}/api/points/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `Geometry predictor simulator request failed (${response.status}): ${text}`
        );
      }
    } catch (error) {
      console.error("Geometry predictor simulator request error", error);
    } finally {
      counter += 1;
      setTimeout(loop, INTERVAL_MS);
    }
  };

  loop();
}
