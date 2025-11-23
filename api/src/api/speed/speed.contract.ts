import { Router } from "express";
import { getSpeedState, updateSpeedState } from "./speed.handler";

export const speedRouter = Router();

speedRouter.get("/", getSpeedState);
speedRouter.post("/", updateSpeedState);

export default speedRouter;

