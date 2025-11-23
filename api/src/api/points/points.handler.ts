import { NextFunction, Request, Response } from "express";
import { PointsService } from "./points.service";

const pointsService = new PointsService();

export const listPointsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const points = await pointsService.list();
    res.json(points);
  } catch (error) {
    next(error);
  }
};