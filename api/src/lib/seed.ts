import { prisma } from "./prisma";

export async function seed() {
  console.log("🔄 Resetting database…");

  await prisma.$transaction([
    prisma.points.deleteMany(),
    prisma.config.deleteMany(),
    prisma.users.deleteMany(),
  ]);

  console.log("✅ Tables truncated");

  await prisma.config.create({
    data: {
      confidenceThreshold: 95,
      urgentThreshold: 70,
    },
  });

  await prisma.users.create({
    data: {
      email: "sample.user@example.com",
      name: "Sample User",
      password: "changeme",
    },
  });

  console.log("🌱 Seed data inserted");
}
