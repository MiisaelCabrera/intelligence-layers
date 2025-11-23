// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pointsRouter from "./api/points/points.contract";
import usersRouter from "./api/users/users.contract";
import configRouter from "./api/config/config.contract";
import speedRouter from "./api/speed/speed.contract";
import { seed } from "./lib/seed";
import { WebSocketServer } from "ws";
import { startLidarSimulator } from "./scripts/lidar-simulator";
import { startGprSimulator } from "./scripts/gpr-simulator";
import { setAlertServer, setTampingServer } from "./lib/websocket";
import { startFrontCameraSimulator } from "./scripts/front-camera-simulator";
import { startGeometryPredictorSimulator } from "./scripts/geometry-predictor-simulator";
import tampingRouter from "./api/tamping/tamping.contract";
import { startTampingSimulator } from "./scripts/tamping-executer-simulator";

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
  startGeometryPredictorSimulator();
  setTimeout(() => {
    startTampingSimulator();
  }, 5000);
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
app.use("/api/speed", speedRouter);
app.use("/api/tamping", tampingRouter);

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from Express + TypeScript + Render!" });
});

bootstrap()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(` Backend running on port ${PORT}`);
    });

    const alertWss = new WebSocketServer({ noServer: true });
    setAlertServer(alertWss);

    alertWss.on("connection", (ws) => {
      console.log("New alerts WebSocket client connected");
      ws.send(
        JSON.stringify({
          type: "connected",
          channel: "alerts",
          timestamp: new Date().toISOString(),
          message: "Subscribed to alert stream",
        })
      );

      ws.on("close", () => {
        console.log("Alerts client disconnected");
      });
    });

    const tampingWss = new WebSocketServer({ noServer: true });
    setTampingServer(tampingWss);

    tampingWss.on("connection", (ws) => {
      console.log("New tamping WebSocket client connected");
      ws.send(
        JSON.stringify({
          type: "connected",
          channel: "tamping",
          timestamp: new Date().toISOString(),
          message: "Subscribed to tamping decision stream",
        })
      );

      ws.on("close", () => {
        console.log("Tamping client disconnected");
      });
    });

    server.on("upgrade", (request, socket, head) => {
      const { url } = request;

      if (url === "/ws/alerts") {
        alertWss.handleUpgrade(request, socket, head, (ws) => {
          alertWss.emit("connection", ws, request);
        });
      } else if (url === "/ws/tamping") {
        tampingWss.handleUpgrade(request, socket, head, (ws) => {
          tampingWss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    });
  })

  .catch((error) => {
    console.error("Failed to bootstrap application", error);
    process.exit(1);
});
