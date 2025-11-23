"use client";
import { useEffect, useState } from "react";

export default function RealtimeData() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Cambia ws://localhost:4000 por la URL de tu backend en producción
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_API_URL ?? "ws://localhost:4000"
    );

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setData((prev) => [...prev, parsed]);
    };

    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (err) => console.error("WebSocket error", err);

    return () => ws.close();
  }, []);

  return (
    <div>
      <h1>Datos en tiempo real</h1>
      <ul>
        {data.map((d, i) => (
          <li key={i}>
            {d.timestamp} - {d.message}
            {d.users && (
              <ul>
                {d.users.map((user: any) => (
                  <li key={user.email}>
                    {user.name} ({user.email})
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
