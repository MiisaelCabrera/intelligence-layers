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

type LabeledValue = { label: string; value: number };

const parseNumeric = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeLabeledValue = (candidate: unknown): LabeledValue | null => {
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }

  const { label, value } = candidate as Record<string, unknown>;
  if (typeof label !== "string") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return { label, value: numericValue };
};

const toLabeledValueArray = (value: unknown): LabeledValue[] | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    const parsed = value.map(normalizeLabeledValue);
    if (parsed.some((item) => item === null)) {
      return null;
    }

    return parsed as LabeledValue[];
  }

  const single = normalizeLabeledValue(value);
  return single ? [single] : null;
};

const extractAppendPayload = (
  body: unknown,
  keys: string[]
): LabeledValue[] | null => {
  if (body === undefined || body === null) {
    return null;
  }

  if (Array.isArray(body)) {
    return toLabeledValueArray(body);
  }

  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;

    for (const key of keys) {
      if (key in obj) {
        const parsed = extractAppendPayload(obj[key], keys);
        if (parsed) {
          return parsed;
        }
      }
    }

    const clone: Record<string, unknown> = { ...obj };
    delete clone.pt;
    for (const key of keys) {
      if (key in clone) {
        delete clone[key];
      }
    }

    return toLabeledValueArray(clone);
  }

  return toLabeledValueArray(body);
};

const toPointAlerts = (values: LabeledValue[]): PointAlert[] =>
  values.map(({ label, value }) => ({ label, value }));

const toPointInstructions = (values: LabeledValue[]): PointInstruction[] =>
  values.map(({ label, value }) => ({ label, value }));

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

const parsePtFromBody = (body: unknown): number | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { pt } = body as Record<string, unknown>;
  return parseNumeric(pt);
};

const parseGprRating = (body: unknown): number | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { gprRating, rating, value } = body as Record<string, unknown>;
  return (
    parseNumeric(gprRating) ?? parseNumeric(rating) ?? parseNumeric(value)
  );
};

export const appendAlertHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ptValue = parsePtFromBody(req.body);
    if (ptValue === null) {
      return res.status(400).json({ error: "pt must be provided as a number" });
    }

    const rawAlerts = extractAppendPayload(req.body, [
      "alerts",
      "alert",
      "data",
      "payload",
      "values",
    ]);

    if (!rawAlerts || rawAlerts.length === 0) {
      return res.status(400).json({ error: "Body must include alert data" });
    }

    const alerts = toPointAlerts(rawAlerts);
    const { record, created } = await pointsService.appendAlert(
      ptValue,
      alerts
    );

    return res.status(created ? 201 : 200).json(record);
  } catch (error) {
    next(error);
  }
};

export const appendInstructionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ptValue = parsePtFromBody(req.body);
    if (ptValue === null) {
      return res.status(400).json({ error: "pt must be provided as a number" });
    }

    const rawInstructions = extractAppendPayload(req.body, [
      "instructions",
      "instruction",
      "data",
      "payload",
      "values",
    ]);

    if (!rawInstructions || rawInstructions.length === 0) {
      return res
        .status(400)
        .json({ error: "Body must include instruction data" });
    }

    const instructions = toPointInstructions(rawInstructions);
    const { record, created } = await pointsService.appendInstruction(
      ptValue,
      instructions
    );

    return res.status(created ? 201 : 200).json(record);
  } catch (error) {
    next(error);
  }
};

export const appendGprHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ptValue = parsePtFromBody(req.body);
    if (ptValue === null) {
      return res.status(400).json({ error: "pt must be provided as a number" });
    }

    const rating = parseGprRating(req.body);
    if (rating === null) {
      return res
        .status(400)
        .json({ error: "Body must include gprRating as a number" });
    }

    const { record, created } = await pointsService.appendInstruction(ptValue, [
      { label: "GPRRating", value: rating },
    ]);

    return res.status(created ? 201 : 200).json(record);
  } catch (error) {
    next(error);
  }
};