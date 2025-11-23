import { Points, Prisma, Status } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface PointAlert {
  label: string;
  value: number;
}

export interface PointInstruction {
  label: string;
  value: number;
}

export type PointStatus = Status;

export const VALID_POINT_STATUSES: PointStatus[] = ["IGNORE", "PROCEED"];

export interface CreatePointInput {
  pt: number;
  alerts?: PointAlert[];
  instructions?: PointInstruction[];
  status?: PointStatus;
}

export interface UpdatePointInput {
  pt?: number;
  alerts?: PointAlert[];
  instructions?: PointInstruction[];
  status?: PointStatus;
}

const toJsonValue = <T>(value?: T[]): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value ?? [])) as Prisma.InputJsonValue;
};

const jsonArray = (value: Prisma.JsonValue | null): Prisma.JsonArray => {
  return Array.isArray(value) ? (value as Prisma.JsonArray) : [];
};

interface AppendResult {
  record: Points;
  created: boolean;
}

export class PointsService {
  async list() {
    return prisma.points.findMany();
  }

  async get(id: number) {
    return prisma.points.findUnique({ where: { id } });
  }

  async create(input: CreatePointInput) {
    return prisma.points.create({
      data: {
        pt: input.pt,
        alerts: toJsonValue(input.alerts),
        instructions: toJsonValue(input.instructions),
        status: input.status ?? Status.IGNORE,
      },
    });
  }

  async update(id: number, input: UpdatePointInput) {
    try {
      return await prisma.points.update({
        where: { id },
        data: {
          ...(input.pt !== undefined ? { pt: input.pt } : {}),
          ...(input.alerts !== undefined
            ? { alerts: toJsonValue(input.alerts) }
            : {}),
          ...(input.instructions !== undefined
            ? { instructions: toJsonValue(input.instructions) }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    }
  }

  async appendAlert(id: number, pt: number, alerts: PointAlert[]): Promise<AppendResult> {
    return prisma.$transaction(async (tx) => {
      const point = await tx.points.findUnique({ where: { id } });

      if (!point) {
        const record = await tx.points.create({
          data: {
            id,
            pt,
            alerts: toJsonValue(alerts),
            instructions: toJsonValue([] as PointInstruction[]),
            status: Status.IGNORE,
          },
        });

        return { record, created: true };
      }

      const currentAlerts = jsonArray(point.alerts) as unknown as PointAlert[];
      const mergedAlerts = [...currentAlerts, ...alerts];

      const record = await tx.points.update({
        where: { id },
        data: {
          pt,
          alerts: toJsonValue(mergedAlerts),
        },
      });

      return { record, created: false };
    });
  }

  async appendInstruction(
    id: number,
    pt: number,
    instructions: PointInstruction[]
  ): Promise<AppendResult> {
    return prisma.$transaction(async (tx) => {
      const point = await tx.points.findUnique({ where: { id } });

      if (!point) {
        const record = await tx.points.create({
          data: {
            id,
            pt,
            alerts: toJsonValue([] as PointAlert[]),
            instructions: toJsonValue(instructions),
            status: Status.IGNORE,
          },
        });

        return { record, created: true };
      }

      const currentInstructions = jsonArray(point.instructions) as unknown as PointInstruction[];
      const mergedInstructions = [...currentInstructions, ...instructions];

      const record = await tx.points.update({
        where: { id },
        data: {
          pt,
          instructions: toJsonValue(mergedInstructions),
        },
      });

      return { record, created: false };
    });
  }
}