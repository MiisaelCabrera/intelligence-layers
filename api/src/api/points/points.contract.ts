import { Router } from "express";
import { listPointsHandler, getPointHandler } from "./points.handler";

export const pointsRouter = Router();

pointsRouter.get("/", listPointsHandler);
pointsRouter.get("/:id", getPointHandler);

export default pointsRouter;