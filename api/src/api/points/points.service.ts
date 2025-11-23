import { Prisma, Status } from "@prisma/client";
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
}