import { Router } from "express";
import {
  listPointsHandler,
  getPointHandler,
  createPointHandler,
  updatePointHandler,
  appendAlertHandler,
  appendInstructionHandler,
  appendGprHandler,
} from "./points.handler";

export const pointsRouter = Router();

pointsRouter.get("/", listPointsHandler);
pointsRouter.get("/:id", getPointHandler);
pointsRouter.post("/", createPointHandler);
pointsRouter.put("/:id", updatePointHandler);
pointsRouter.post("/alerts", appendAlertHandler);
pointsRouter.post("/instructions", appendInstructionHandler);
pointsRouter.post("/gpr", appendGprHandler);

export default pointsRouter;