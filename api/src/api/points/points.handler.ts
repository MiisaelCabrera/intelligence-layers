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

export const getPointHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    if (!id) return res.status(400).json({ error: "Missing point id" });

    const point = await pointsService.get(id);
    if (!point) return res.status(404).json({ error: "Point not found" });

    return res.json(point);
  } catch (error) {
    next(error);
  }
};