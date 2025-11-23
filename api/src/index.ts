// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pointsRouter from "./api/points/points.contract";
import usersRouter from "./api/users/users.contract";
import configRouter from "./api/config/config.contract";
import { seed } from "./lib/seed";
import getPointHandler from "./api/points/points.contract";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const allowedOrigins = [FRONTEND_URL, "localhost:3000"];

const bootstrap = async () => {
  if (process.env.NODE_ENV !== "production") {
    await seed();
  }
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

    wss.on("connection", (ws) => {
      console.log("New WebSocket client connected");

      const interval = setInterval(async () => {
        const data = {
          timestamp: new Date(),
          message: "Datos enviados desde backend",
        };
        ws.send(JSON.stringify(data));
      }, 1000);

      ws.on("close", () => {
        console.log("Client disconnected");
        clearInterval(interval);
      });
    });
  })

  .catch((error) => {
    console.error("Failed to bootstrap application", error);
    process.exit(1);
  });
