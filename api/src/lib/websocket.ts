import { WebSocketServer } from "ws";
import type { PointAlert } from "../api/points/points.service";

let websocketServer: WebSocketServer | null = null;

export const setWebSocketServer = (server: WebSocketServer) => {
  websocketServer = server;
};

interface AlertBroadcastPayload {
  pt: number;
  alert: PointAlert;
  timestamp?: string;
}

export const broadcastAlert = ({
  pt,
  alert,
  timestamp = new Date().toISOString(),
}: AlertBroadcastPayload) => {
  if (!websocketServer) return;

  const snapshot = JSON.stringify({
    type: "alert",
    pt,
    alert,
    timestamp,
  });

  websocketServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(snapshot);
    }
  });
};

