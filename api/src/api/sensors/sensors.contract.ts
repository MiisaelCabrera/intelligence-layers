import { Router } from "express";
import { listSensorsHandler } from "./sensors.handler";

export const sensorsRouter = Router();

sensorsRouter.get("/", listSensorsHandler);

export default sensorsRouter;