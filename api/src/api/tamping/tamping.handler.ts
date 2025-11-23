import { NextFunction, Request, Response } from "express";
import { TampingService } from "./tamping.service";

const tampingService = new TampingService();

export const decideTampingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pt } = req.body ?? {};

    const numericPt = Number(pt);
    if (!Number.isFinite(numericPt)) {
      return res.status(400).json({ error: "pt must be a number" });
    }

    const decision = await tampingService.decide(numericPt);
    return res.status(200).json(decision);
  } catch (error) {
    next(error);
  }
};

export const feedbackTampingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sampleId, label } = req.body ?? {};

    if (!sampleId || typeof sampleId !== "string") {
      return res.status(400).json({ error: "sampleId is required" });
    }

    if (label !== "PROCEED" && label !== "IGNORE") {
      return res
        .status(400)
        .json({ error: "label must be PROCEED or IGNORE" });
    }

    await tampingService.submitFeedback(sampleId, label);
    return res.status(200).json({ status: "updated" });
  } catch (error) {
    next(error);
  }
};

