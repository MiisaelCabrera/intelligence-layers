import { Router } from "express";
import { decideTampingHandler } from "./tamping.handler";

const tampingRouter = Router();

tampingRouter.post("/decision", decideTampingHandler);

export default tampingRouter;

