const API_URL = process.env.API_URL ?? "http://localhost:4000";

const randomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export async function startConfigSetterSimulator() {
  let confidenceThreshold = 89;
  let urgentThreshold = 45;
  
    console.log(`Setting confidence and urgent Threshold to ${confidenceThreshold} and ${urgentThreshold}`);

    const payload = {
        id: 1,
        confidenceThreshold,
        urgentThreshold,
    };

    try {
        // POST to the upsert endpoint to ensure id=1 exists or is updated
        const response = await fetch(`${API_URL}/api/configs/upsert`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Config Setter simulator request failed (${response.status}): ${text}`);
        } else {
            const data = await response.json();
            console.log("Config upserted:", data);
        }
    } catch (error) {
        console.error("Config Setter simulator request error", error);
    }
}
