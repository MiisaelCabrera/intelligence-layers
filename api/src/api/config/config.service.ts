import { supabase } from "../../lib/supabase";

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
    const { data, error } = await supabase.from("Config").select("*");
    if (error) throw error;
    return data;
  }

  async get(id: number) {
    const { data, error } = await supabase.from("Config").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: CreateConfigInput) {
    const { data, error } = await supabase
      .from("Config")
      .insert([
        {
          confidenceThreshold: input.confidenceThreshold,
          urgentThreshold: input.urgentThreshold,
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async upsert(input: CreateConfigInput) {
    const { data, error } = await supabase
      .from("Config")
      .upsert([
        { id: 1, confidenceThreshold: input.confidenceThreshold, urgentThreshold: input.urgentThreshold },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async update(id: number, input: UpdateConfigInput) {
    const updateData: any = {
      ...(input.confidenceThreshold !== undefined
        ? { confidenceThreshold: input.confidenceThreshold }
        : {}),
      ...(input.urgentThreshold !== undefined
        ? { urgentThreshold: input.urgentThreshold }
        : {}),
    };

    const { data, error } = await supabase
      .from("Config")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async delete(id: number) {
    const { data, error } = await supabase.from("Config").delete().eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
}
