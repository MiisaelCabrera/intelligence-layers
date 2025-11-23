import { Router } from "express";
import {
  listPointsHandler,
  getPointHandler,
  createPointHandler,
  updatePointHandler,
  appendAlertHandler,
  appendInstructionHandler,
} from "./points.handler";

export const pointsRouter = Router();

pointsRouter.get("/", listPointsHandler);
pointsRouter.get("/:id", getPointHandler);
pointsRouter.post("/", createPointHandler);
pointsRouter.put("/:id", updatePointHandler);
pointsRouter.post("/:id/alerts", appendAlertHandler);
pointsRouter.post("/:id/instructions", appendInstructionHandler);

export default pointsRouter;