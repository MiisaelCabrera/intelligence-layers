-- CreateEnum
CREATE TYPE "Status" AS ENUM ('IGNORE', 'PROCEED');

-- CreateTable
CREATE TABLE "Users" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL,
    "urgentThreshold" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Points" (
    "id" SERIAL NOT NULL,
    "pt" DOUBLE PRECISION NOT NULL,
    "alerts" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'IGNORE',

    CONSTRAINT "Points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");
