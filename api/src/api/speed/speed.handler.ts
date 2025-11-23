import { NextFunction, Request, Response } from "express";
import { SpeedService } from "./speed.service";

const speedService = new SpeedService();

export const getSpeedState = (_req: Request, res: Response) => {
  return res.json(speedService.getState());
};

export const updateSpeedState = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mode, analysisSpeedKmh, tampingSpeedKmh } = req.body ?? {};

    if (mode === "auto") {
      speedService.setAuto(true);
      return res.json(speedService.getState());
    }

    if (mode === "manual") {
      const analysis = Number(analysisSpeedKmh);
      const tamping =
        tampingSpeedKmh !== undefined ? Number(tampingSpeedKmh) : undefined;

      if (!Number.isFinite(analysis)) {
        return res.status(400).json({
          error: "analysisSpeedKmh must be provided as a number",
        });
      }

      speedService.setManual(analysis, tamping);
      speedService.setAuto(false);
      return res.json(speedService.getState());
    }

    return res.status(400).json({
      error: "mode must be either 'auto' or 'manual'",
    });
  } catch (error) {
    next(error);
  }
};

