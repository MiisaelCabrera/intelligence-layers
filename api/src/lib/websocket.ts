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
  sampleId: string;
  pt: number;
  decision: "PROCEED" | "IGNORE";
  score: number;
  fallback?: boolean;
  vector?: number[];
  snapshot?: string;
  timestamp?: string;
}

export const broadcastTampingDecision = ({
  sampleId,
  pt,
  decision,
  score,
  fallback = false,
  vector = [],
  snapshot,
  timestamp = new Date().toISOString(),
}: TampingBroadcastPayload) => {
  if (!tampingServer) return;

  const snapshotPayload = JSON.stringify({
    type: "tamping-decision",
    sampleId,
    pt,
    decision,
    score,
    fallback,
    vector,
    snapshot,
    timestamp,
  });

  tampingServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(snapshotPayload);
    }
  });
};

interface TampingInfoPayload {
  pt: number;
  textPoints: string;
  textConfig: string;
  timestamp?: string;
}

export const broadcastTampingInfo = ({
  pt,
  textPoints,
  textConfig,
  timestamp = new Date().toISOString(),
}: TampingInfoPayload) => {
  if (!tampingServer) return;

  const payload = JSON.stringify({
    type: "tamping-info",
    pt,
    textPoints,
    textConfig,
    timestamp,
  });

  tampingServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
};

