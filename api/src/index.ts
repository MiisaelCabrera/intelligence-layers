// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pointsRouter from "./api/points/points.contract";
import usersRouter from "./api/users/users.contract";
import configRouter from "./api/config/config.contract";
import { seed } from "./lib/seed";
import { WebSocketServer } from "ws";
import { startLidarSimulator } from "./scripts/lidar-simulator";
import { startGprSimulator } from "./scripts/gpr-simulator";
import { setWebSocketServer } from "./lib/websocket";
import { startFrontCameraSimulator } from "./scripts/front-camera-simulator";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const allowedOrigins = [FRONTEND_URL, "localhost:3000"];

const bootstrap = async () => {
  await seed();
  startLidarSimulator();
  startGprSimulator();
  startFrontCameraSimulator();
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed for this origin"));
      }
    },
  })
);

app.use(express.json());
app.use("/api/points", pointsRouter);
app.use("/api/users", usersRouter);
app.use("/api/configs", configRouter);

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from Express + TypeScript + Render!" });
});

bootstrap()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(` Backend running on port ${PORT}`);
    });
    const wss = new WebSocketServer({ server });
    setWebSocketServer(wss);

    wss.on("connection", (ws) => {
      console.log("New WebSocket client connected");
      ws.send(
        JSON.stringify({
          type: "connected",
          timestamp: new Date().toISOString(),
          message: "Subscribed to alert stream",
        })
      );

      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });
  })

  .catch((error) => {
    console.error("Failed to bootstrap application", error);
    process.exit(1);
  });
