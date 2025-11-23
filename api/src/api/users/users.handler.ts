import { NextFunction, Request, Response } from "express";
import {
  CreateUserInput,
  UpdateUserInput,
  UsersService,
} from "./users.service";

const usersService = new UsersService();

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const normalizeEmail = (value: unknown): string | null => {
  if (!isNonEmptyString(value)) return null;

  const email = value.trim().toLowerCase();
  if (!/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(email)) {
    return null;
  }

  return email;
};

const parseUpdateBody = (body: unknown): UpdateUserInput | null => {
  if (body === null || typeof body !== "object") {
    return null;
  }

  const { name, password } = body as Record<string, unknown>;

  const payload: UpdateUserInput = {};

  if (name !== undefined) {
    if (!isNonEmptyString(name)) return null;
    payload.name = String(name).trim();
  }

  if (password !== undefined) {
    if (!isNonEmptyString(password)) return null;
    payload.password = String(password);
  }

  return Object.keys(payload).length === 0 ? null : payload;
};

export const listUsersHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await usersService.list();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = normalizeEmail(req.params.email);
    if (!email) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const user = await usersService.get(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const name = isNonEmptyString(req.body?.name)
      ? String(req.body.name).trim()
      : null;
    const password = isNonEmptyString(req.body?.password)
      ? String(req.body.password)
      : null;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "email, name and password are required" });
    }

    const payload: CreateUserInput = { email, name, password };

    try {
      const created = await usersService.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        return res.status(409).json({ error: "User already exists" });
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const upsertUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = normalizeEmail(req.body?.email ?? req.params?.email);
    const name = isNonEmptyString(req.body?.name)
      ? String(req.body.name).trim()
      : null;
    const password = isNonEmptyString(req.body?.password)
      ? String(req.body.password)
      : null;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "email, name and password are required" });
    }

    const payload: CreateUserInput = { email, name, password };
    const saved = await usersService.upsert(payload);

    return res.status(200).json(saved);
  } catch (error) {
    next(error);
  }
};

export const updateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = normalizeEmail(req.params.email);
    if (!email) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const payload = parseUpdateBody(req.body);
    if (!payload) {
      return res.status(400).json({ error: "Provide name or password to update" });
    }

    const updated = await usersService.update(email, payload);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = normalizeEmail(req.params.email);
    if (!email) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const deleted = await usersService.delete(email);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
