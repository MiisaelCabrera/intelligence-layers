import { Router } from "express";
import {
  decideTampingHandler,
  feedbackTampingHandler,
} from "./tamping.handler";

const tampingRouter = Router();

tampingRouter.post("/decision", decideTampingHandler);
tampingRouter.post("/feedback", feedbackTampingHandler);

export default tampingRouter;

