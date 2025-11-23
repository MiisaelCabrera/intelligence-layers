import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pointsRouter from "./api/points/points.contract";
import usersRouter from "./api/users/users.contract";
import configRouter from "./api/config/config.contract";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const allowedOrigins = [FRONTEND_URL, "localhost:3000"];

const bootstrap = async () => {
  if (process.env.NODE_ENV !== "production") {
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

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
  })
);

app.use(express.json());

app.use("/api/points", pointsRouter);
app.use("/api/users", usersRouter);
app.use("/api/configs", configRouter);

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({
    message: "Hello from Express + TypeScript + Render!",
  });
});

bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to bootstrap application", error);
    process.exit(1);
  });
