const API_URL = process.env.API_URL ?? "http://localhost:4000";
const INTERVAL_MS = Number(process.env.TAMPING_DATA_FETCHER_INTERVAL_MS ?? "1800");

export async function startTampingSimulator() {
  let counter = 1;

  const loop = async () => {
    const pt = Number((counter / 10).toFixed(1));
    console.log(`[tamping-sim] requesting decision for pt=${pt}`);

    try {
      const response = await fetch(`${API_URL}/api/tamping/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pt }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `[tamping-sim] decision request failed (${response.status}): ${text}`
        );
      } else {
        const payload = await response.json();
        console.log(
          `[tamping-sim] decision for pt=${pt}: ${payload.decision} (score=${payload.score?.toFixed?.(2) ?? payload.score})`
        );
      }
    } catch (error) {
      console.error("[tamping-sim] request error", error);
    } finally {
      counter += 1;
      setTimeout(loop, INTERVAL_MS);
    }
  };

  loop();
}
