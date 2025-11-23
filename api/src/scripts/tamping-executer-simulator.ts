const API_URL = process.env.API_URL ?? "http://localhost:4000";
const INTERVAL_MS = Number(process.env.TAMPING_DATA_FETCHER_INTERVAL_MS ?? "1800");

const randomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export async function startTampingSimulator() {
  let counter = 1;

  const loop = async () => {
    console.log(`DecidePerformTamping ${counter / 10}...`);
    const pt = Number((counter / 10).toFixed(1));

    try {
      const response = await fetch(`${API_URL}/api/points/fetch/${pt}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `Tamping Information request failed (${response.status}): ${text}`
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
