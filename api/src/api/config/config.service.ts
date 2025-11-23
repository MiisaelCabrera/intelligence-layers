import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface CreateConfigInput {
  confidenceThreshold: number;
  urgentThreshold: number;
}

export interface UpdateConfigInput {
  confidenceThreshold?: number;
  urgentThreshold?: number;
}

export class ConfigService {
  async list() {
    return prisma.config.findMany();
  }

  async get(id: number) {
    return prisma.config.findUnique({ where: { id } });
  }

  async create(input: CreateConfigInput) {
    return prisma.config.create({
      data: {
        confidenceThreshold: input.confidenceThreshold,
        urgentThreshold: input.urgentThreshold,
      },
    });
  }

  async upsert(input: CreateConfigInput) {
    return prisma.config.upsert({
      where: { id: 1 },
      update: {
        confidenceThreshold: input.confidenceThreshold,
        urgentThreshold: input.urgentThreshold,
      },
      create: {
        confidenceThreshold: input.confidenceThreshold,
        urgentThreshold: input.urgentThreshold,
      },
    });
  }

  async update(id: number, input: UpdateConfigInput) {
    try {
      return await prisma.config.update({
        where: { id },
        data: {
          ...(input.confidenceThreshold !== undefined
            ? { confidenceThreshold: input.confidenceThreshold }
            : {}),
          ...(input.urgentThreshold !== undefined
            ? { urgentThreshold: input.urgentThreshold }
            : {}),
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

  async delete(id: number) {
    try {
      return await prisma.config.delete({ where: { id } });
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
