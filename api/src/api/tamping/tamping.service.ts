import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

const HALT_SERVICE_URL =
  process.env.HALT_SERVICE_URL && process.env.HALT_SERVICE_URL.trim().length > 0
    ? process.env.HALT_SERVICE_URL
    : "http://localhost:8000";

interface DecisionResponse {
  sample_id: string;
  decision: "PROCEED" | "IGNORE";
  score: number;
  fallback?: boolean;
}

interface TampingDecisionResult extends DecisionResponse {
  pt: number;
}

export class TampingService {
  async decide(pt: number): Promise<TampingDecisionResult> {
    const point = await prisma.points.findFirst({
      where: { pt },
      orderBy: { id: "desc" },
    });

    const alerts = (point?.alerts as Prisma.JsonArray | null) ?? [];
    const instructions = (point?.instructions as Prisma.JsonArray | null) ?? [];

    const snapshot = JSON.stringify({
      alerts,
      instructions,
    });

    const decision = await this.requestDecision(pt, snapshot);

    await this.logDecision(point?.id ?? null, pt, instructions, decision);

    return { ...decision, pt };
  }

  private async requestDecision(
    pt: number,
    snapshot: string
  ): Promise<DecisionResponse> {
    const response = await fetch(`${HALT_SERVICE_URL}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alert: {
          type: "tamping-decision",
          pt,
          alert: {
            label: snapshot,
            value: pt,
          },
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Tamping decision request failed: ${response.status} ${text}`
      );
    }

    const payload = (await response.json()) as DecisionResponse;
    return payload;
  }

  private async logDecision(
    pointId: number | null,
    pt: number,
    existingInstructions: Prisma.JsonArray,
    decision: DecisionResponse
  ) {
    const logEntry = {
      label: "tampingDecision",
      value: decision.decision === "PROCEED" ? 1 : 0,
      decision: decision.decision,
      score: decision.score,
      fallback: decision.fallback ?? false,
      pt,
      timestamp: new Date().toISOString(),
    };

    const instructions = Array.isArray(existingInstructions)
      ? [...existingInstructions, logEntry]
      : [logEntry];

    if (pointId) {
      await prisma.points.update({
        where: { id: pointId },
        data: { instructions },
      });
    } else {
      await prisma.points.create({
        data: {
          pt,
          alerts: [],
          instructions,
          status: "PROCEED",
        },
      });
    }
  }
}

