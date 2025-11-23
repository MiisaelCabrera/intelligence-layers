const API_URL = process.env.API_URL ?? "http://localhost:4000";
const INTERVAL_MS = Number(process.env.LIDAR_INTERVAL_MS ?? "1000");

const randomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export async function startLidarSimulator() {
  let counter = 1;

  const loop = async () => {
    const pt = Number((counter / 10).toFixed(1));
    const payload = {
      pt,
      instruction: {
        label: "lidarDepth",
        value: Number(randomFloat(-3, 3).toFixed(3)),
      },
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
          `LIDAR simulator request failed (${response.status}): ${text}`
        );
      }
    } catch (error) {
      console.error("LIDAR simulator request error", error);
    } finally {
      counter += 1;
      setTimeout(loop, INTERVAL_MS);
    }
  };

  loop();
}
