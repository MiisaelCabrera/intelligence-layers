import { seed } from "../src/lib/seed";
import { prisma } from "../src/lib/prisma";

seed()
  .catch((error) => {
    console.error("❌ Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
