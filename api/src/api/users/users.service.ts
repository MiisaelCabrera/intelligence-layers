import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
}

export class UsersService {
  async list() {
    return prisma.users.findMany();
  }

  async get(email: string) {
    return prisma.users.findUnique({ where: { email } });
  }

  async create(input: CreateUserInput) {
    return prisma.users.create({
      data: {
        email: input.email,
        name: input.name,
        password: input.password,
      },
    });
  }

  async upsert(input: CreateUserInput) {
    return prisma.users.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        password: input.password,
      },
      create: {
        email: input.email,
        name: input.name,
        password: input.password,
      },
    });
  }

  async update(email: string, input: UpdateUserInput) {
    try {
      return await prisma.users.update({
        where: { email },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.password !== undefined ? { password: input.password } : {}),
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

  async delete(email: string) {
    try {
      return await prisma.users.delete({ where: { email } });
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
