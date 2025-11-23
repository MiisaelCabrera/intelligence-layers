import { Router } from "express";
import {
  listConfigsHandler,
  getConfigHandler,
  createConfigHandler,
  upsertConfigHandler,
  updateConfigHandler,
  deleteConfigHandler,
} from "./config.handler";

export const configRouter = Router();

configRouter.get("/", listConfigsHandler);
configRouter.get("/:id", getConfigHandler);
configRouter.post("/", createConfigHandler);
configRouter.put("/:id", updateConfigHandler);
configRouter.post("/upsert", upsertConfigHandler);
configRouter.delete("/:id", deleteConfigHandler);

export default configRouter;
