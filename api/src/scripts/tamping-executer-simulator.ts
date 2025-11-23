import { broadcastTampingInfo } from "../lib/websocket";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const INTERVAL_MS = Number(process.env.TAMPING_DATA_FETCHER_INTERVAL_MS ?? "2000");

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
      const responseConfig = await fetch(`${API_URL}/api/configs/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Read each body only once (fetch Response bodies are single-use).
      const textPoints = await response.text();
      const textConfig = await responseConfig.text();
      console.log(`[tamping-sim] Tamping Information and Metrics: ${textConfig}`);

      // Broadcast the combined info to connected tamping websocket clients
      try {
        broadcastTampingInfo({ pt, textPoints, textConfig });
      } catch (err) {
        console.error("[tamping-sim] broadcast error", err);
      }

      if (!response.ok) {
        // response body already read into textPoints
        console.error(
          `[tamping-sim] decision request failed (${response.status}): ${textPoints}`
        );
      } else {
        let payload: any = null;
        try {
          payload = JSON.parse(textPoints);
        } catch (err) {
          console.error("[tamping-sim] failed to parse decision JSON", err, textPoints);
        }

        if (payload) {
          console.log(
            `[tamping-sim] decision for pt=${pt}: ${payload.decision} (score=${payload.score?.toFixed?.(2) ?? payload.score})`
          );
        }
      }
    } catch (error) {
      console.error("[tamping-sim] request error", error);
    } finally {
      counter += 1;
      setTimeout(loop, INTERVAL_MS);
    }
  };

  const INITIAL_DELAY_SEC = Number(process.env.TAMPING_INITIAL_DELAY_SEC ?? "2");
  setTimeout(loop, INITIAL_DELAY_SEC * 1000);
}
