import { Router } from "express";
import { listPointsHandler } from "./points.handler";

export const pointsRouter = Router();

pointsRouter.get("/", listPointsHandler);

export default pointsRouter;