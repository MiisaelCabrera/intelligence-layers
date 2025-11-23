const API_URL = process.env.API_URL ?? "http://localhost:4000";
const INTERVAL_MS = Number(process.env.FRONT_CAMERA_INTERVAL_MS ?? "2000");

const randomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export async function startFrontCameraSimulator() {
  let counter = 1;

  const loop = async () => {
    const pt = Number((counter / 10).toFixed(1));
    const payload = {
      pt,
      alerts: [
        {
          label: "frontFacingCamera",
          value: Number(randomFloat(70, 98).toFixed(2)),
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
          `Front camera simulator request failed (${response.status}): ${text}`
        );
      }
    } catch (error) {
      console.error("Front camera simulator request error", error);
    } finally {
      counter += 1;
      setTimeout(loop, INTERVAL_MS);
    }
  };

  loop();
}
