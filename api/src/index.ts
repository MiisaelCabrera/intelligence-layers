import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
  })
);

app.use(express.json());

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({
    message: "Hello from Express + TypeScript + Render!",
  });
});

app.listen(PORT, () => {
  console.log(` Backend running on port ${PORT}`);
});
