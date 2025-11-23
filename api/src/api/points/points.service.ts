import { supabase } from "../../lib/supabase";

export interface PointAlert {
  label: string;
  value: number;
}

export interface PointInstruction {
  label: string;
  value: number;
}

export type PointStatus = "IGNORE" | "PROCEED";

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

const toJsonValue = <T>(value?: T[]): unknown => {
  return value ?? [];
};

const jsonArray = (value: unknown | null): unknown[] => {
  return Array.isArray(value) ? (value as unknown[]) : [];
};

export interface PointRecord {
  id: number;
  pt: number;
  alerts: unknown[];
  instructions: unknown[];
  status: PointStatus;
}

interface AppendResult {
  record: PointRecord | null;
  created: boolean;
}

export class PointsService {
  async list() {
    const { data, error } = await supabase.from("Points").select("*");
    if (error) throw error;
    return data;
  }

  async get(id: number) {
    const { data, error } = await supabase.from("Points").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: CreatePointInput) {
    const { data, error } = await supabase
      .from("Points")
      .insert([
        {
          pt: input.pt,
          alerts: toJsonValue(input.alerts),
          instructions: toJsonValue(input.instructions),
          status: input.status ?? "IGNORE",
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async update(id: number, input: UpdatePointInput) {
    const updateData: any = {
      ...(input.pt !== undefined ? { pt: input.pt } : {}),
      ...(input.alerts !== undefined ? { alerts: toJsonValue(input.alerts) } : {}),
      ...(input.instructions !== undefined
        ? { instructions: toJsonValue(input.instructions) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };

    const { data, error } = await supabase
      .from("Points")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async appendAlert(id: number, pt: number, alerts: PointAlert[]): Promise<AppendResult> {
    const { data: point, error } = await supabase.from("Points").select("*").eq("id", id).maybeSingle();
    if (error) throw error;

    if (!point) {
      const { data, error: insError } = await supabase
        .from("Points")
        .insert([
          {
            id,
            pt,
            alerts: toJsonValue(alerts),
            instructions: toJsonValue([] as PointInstruction[]),
            status: "IGNORE",
          },
        ])
        .select()
        .maybeSingle();

      if (insError) throw insError;
      return { record: data, created: true } as AppendResult;
    }

    const currentAlerts = jsonArray(point.alerts) as unknown as PointAlert[];
    const mergedAlerts = [...currentAlerts, ...alerts];

    const { data: record, error: upError } = await supabase
      .from("Points")
      .update({ pt, alerts: toJsonValue(mergedAlerts) })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (upError) throw upError;
    return { record, created: false } as AppendResult;
  }

  async appendInstruction(
    id: number,
    pt: number,
    instructions: PointInstruction[]
  ): Promise<AppendResult> {
    const { data: point, error } = await supabase.from("Points").select("*").eq("id", id).maybeSingle();
    if (error) throw error;

    if (!point) {
      const { data, error: insError } = await supabase
        .from("Points")
        .insert([
          {
            id,
            pt,
            alerts: toJsonValue([] as PointAlert[]),
            instructions: toJsonValue(instructions),
            status: "IGNORE",
          },
        ])
        .select()
        .maybeSingle();

      if (insError) throw insError;
      return { record: data, created: true } as AppendResult;
    }

    const currentInstructions = jsonArray(point.instructions) as unknown as PointInstruction[];
    const mergedInstructions = [...currentInstructions, ...instructions];

    const { data: record, error: upError } = await supabase
      .from("Points")
      .update({ pt, instructions: toJsonValue(mergedInstructions) })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (upError) throw upError;
    return { record, created: false } as AppendResult;
  }
}