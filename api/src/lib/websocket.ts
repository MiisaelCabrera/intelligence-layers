import { WebSocketServer } from "ws";
import type { PointAlert } from "../api/points/points.service";

let alertServer: WebSocketServer | null = null;
let tampingServer: WebSocketServer | null = null;

export const setAlertServer = (server: WebSocketServer) => {
  alertServer = server;
};

export const setTampingServer = (server: WebSocketServer) => {
  tampingServer = server;
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
  if (!alertServer) return;

  const snapshot = JSON.stringify({
    type: "alert",
    pt,
    alert,
    timestamp,
  });

  alertServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(snapshot);
    }
  });
};

interface TampingBroadcastPayload {
  pt: number;
  decision: "PROCEED" | "IGNORE";
  score: number;
  fallback?: boolean;
  timestamp?: string;
}

export const broadcastTampingDecision = ({
  pt,
  decision,
  score,
  fallback = false,
  timestamp = new Date().toISOString(),
}: TampingBroadcastPayload) => {
  if (!tampingServer) return;

  const snapshot = JSON.stringify({
    type: "tamping-decision",
    pt,
    decision,
    score,
    fallback,
    timestamp,
  });

  tampingServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(snapshot);
    }
  });
};

