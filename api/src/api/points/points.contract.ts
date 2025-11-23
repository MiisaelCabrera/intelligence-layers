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
pointsRouter.get("/fetch/:pt", getPointHandler);
pointsRouter.post("/", createPointHandler);
pointsRouter.put("/:id", updatePointHandler);
pointsRouter.post("/alerts", appendAlertHandler);
pointsRouter.post("/instructions", appendInstructionHandler);

export default pointsRouter;