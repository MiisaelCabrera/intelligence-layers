import { NextFunction, Request, Response } from "express";
import {
  ConfigService,
  CreateConfigInput,
  UpdateConfigInput,
} from "./config.service";

const configService = new ConfigService();

const parseId = (value: string | undefined): number | null => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

const parseThreshold = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseCreateBody = (body: unknown): CreateConfigInput | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { confidenceThreshold, urgentThreshold } = body as Record<string, unknown>;
  const confidence = parseThreshold(confidenceThreshold);
  const urgent = parseThreshold(urgentThreshold);

  if (confidence === null || urgent === null) {
    return null;
  }

  return { confidenceThreshold: confidence, urgentThreshold: urgent };
};

const parseUpdateBody = (body: unknown): UpdateConfigInput | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { confidenceThreshold, urgentThreshold } = body as Record<string, unknown>;
  const payload: UpdateConfigInput = {};

  if (confidenceThreshold !== undefined) {
    const confidence = parseThreshold(confidenceThreshold);
    if (confidence === null) {
      return null;
    }
    payload.confidenceThreshold = confidence;
  }

  if (urgentThreshold !== undefined) {
    const urgent = parseThreshold(urgentThreshold);
    if (urgent === null) {
      return null;
    }
    payload.urgentThreshold = urgent;
  }

  return Object.keys(payload).length === 0 ? null : payload;
};

export const listConfigsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await configService.list();
    res.json(configs);
  } catch (error) {
    next(error);
  }
};

export const getConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Invalid config id" });
    }

    const config = await configService.get(id);
    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
};

export const createConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = parseCreateBody(req.body);
    if (!payload) {
      return res
        .status(400)
        .json({ error: "confidenceThreshold and urgentThreshold required" });
    }

    const created = await configService.create(payload);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const upsertConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = parseCreateBody(req.body);
    if (!payload) {
      return res
        .status(400)
        .json({ error: "confidenceThreshold and urgentThreshold required" });
    }

    const saved = await configService.upsert(payload);
    res.json(saved);
  } catch (error) {
    next(error);
  }
};

export const updateConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Invalid config id" });
    }

    const payload = parseUpdateBody(req.body);
    if (!payload) {
      return res.status(400).json({ error: "Provide threshold fields to update" });
    }

    const updated = await configService.update(id, payload);
    if (!updated) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Invalid config id" });
    }

    const deleted = await configService.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
