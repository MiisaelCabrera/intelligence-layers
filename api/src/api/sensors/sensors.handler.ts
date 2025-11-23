import { NextFunction, Request, Response } from "express";
import { SensorsService } from "./sensors.service";

const sensorsService = new SensorsService();

export const listSensorsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sensors = await sensorsService.list();
    res.json(sensors);
  } catch (error) {
    next(error);
  }
};