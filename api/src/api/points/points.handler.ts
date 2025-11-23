import { NextFunction, Request, Response } from "express";
import {
  CreatePointInput,
  PointAlert,
  PointInstruction,
  PointStatus,
  PointsService,
  VALID_POINT_STATUSES,
  UpdatePointInput,
} from "./points.service";

const pointsService = new PointsService();

const isPointAlert = (value: unknown): value is PointAlert => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PointAlert).label === "string" &&
    typeof (value as PointAlert).value === "number"
  );
};

const isPointInstruction = (value: unknown): value is PointInstruction => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PointInstruction).label === "string" &&
    typeof (value as PointInstruction).value === "number"
  );
};

const normalizeStatus = (value: unknown): PointStatus | undefined => {
  if (value === undefined || value === null) return undefined;

  const candidate = String(value).toUpperCase() as PointStatus;
  return VALID_POINT_STATUSES.includes(candidate) ? candidate : undefined;
};

const parseAlerts = (value: unknown, allowUndefined = false) => {
  if (value === undefined) return allowUndefined ? undefined : [];
  if (!Array.isArray(value)) return null;

  const parsed = value.filter(isPointAlert);
  return parsed.length === value.length ? parsed : null;
};

const parseInstructions = (value: unknown, allowUndefined = false) => {
  if (value === undefined) return allowUndefined ? undefined : [];
  if (!Array.isArray(value)) return null;

  const parsed = value.filter(isPointInstruction);
  return parsed.length === value.length ? parsed : null;
};

const parseIdParam = (param: string | undefined) => {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

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
    const id = parseIdParam(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Invalid point id" });
    }

    const point = await pointsService.get(id);
    if (!point) {
      return res.status(404).json({ error: "Point not found" });
    }

    return res.json(point);
  } catch (error) {
    next(error);
  }
};

export const createPointHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pt, alerts, instructions, status } = req.body;

    const numericPt = Number(pt);
    if (!Number.isFinite(numericPt)) {
      return res.status(400).json({ error: "pt must be a number" });
    }

    const parsedAlerts = parseAlerts(alerts);
    if (!parsedAlerts) {
      return res
        .status(400)
        .json({ error: "alerts must be an array of {label, value}" });
    }

    const parsedInstructions = parseInstructions(instructions);
    if (!parsedInstructions) {
      return res
        .status(400)
        .json({ error: "instructions must be an array of {label, value}" });
    }

    const normalizedStatus = normalizeStatus(status);
    if (status !== undefined && normalizedStatus === undefined) {
      return res
        .status(400)
        .json({ error: "status must be either IGNORE or PROCEED" });
    }

    const payload: CreatePointInput = {
      pt: numericPt,
      alerts: parsedAlerts,
      instructions: parsedInstructions,
      status: normalizedStatus,
    };

    const created = await pointsService.create(payload);
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updatePointHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Invalid point id" });
    }

    const { pt, alerts, instructions, status } = req.body;

    if (
      pt === undefined &&
      alerts === undefined &&
      instructions === undefined &&
      status === undefined
    ) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const payload: UpdatePointInput = {};

    if (pt !== undefined) {
      const numericPt = Number(pt);
      if (!Number.isFinite(numericPt)) {
        return res.status(400).json({ error: "pt must be a number" });
      }
      payload.pt = numericPt;
    }

    if (alerts !== undefined) {
      const parsedAlerts = parseAlerts(alerts, true);
      if (!parsedAlerts) {
        return res
          .status(400)
          .json({ error: "alerts must be an array of {label, value}" });
      }
      payload.alerts = parsedAlerts;
    }

    if (instructions !== undefined) {
      const parsedInstructions = parseInstructions(instructions, true);
      if (!parsedInstructions) {
        return res
          .status(400)
          .json({ error: "instructions must be an array of {label, value}" });
      }
      payload.instructions = parsedInstructions;
    }

    if (status !== undefined) {
      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        return res
          .status(400)
          .json({ error: "status must be either IGNORE or PROCEED" });
      }
      payload.status = normalizedStatus;
    }

    const updated = await pointsService.update(id, payload);
    if (!updated) {
      return res.status(404).json({ error: "Point not found" });
    }

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};