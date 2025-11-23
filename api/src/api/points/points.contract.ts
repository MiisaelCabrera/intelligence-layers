import { Router } from "express";
import {
  listPointsHandler,
  getPointHandler,
  createPointHandler,
  updatePointHandler,
} from "./points.handler";

export const pointsRouter = Router();

pointsRouter.get("/", listPointsHandler);
pointsRouter.get("/:id", getPointHandler);
pointsRouter.post("/", createPointHandler);
pointsRouter.put("/:id", updatePointHandler);

export default pointsRouter;