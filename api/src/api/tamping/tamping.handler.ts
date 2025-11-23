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

