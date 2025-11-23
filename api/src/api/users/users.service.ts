import { supabase } from "../../lib/supabase";

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
    const { data, error } = await supabase.from("Users").select("*");
    if (error) throw error;
    return data;
  }

  async get(email: string) {
    const { data, error } = await supabase.from("Users").select("*").eq("email", email).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: CreateUserInput) {
    const { data, error } = await supabase
      .from("Users")
      .insert([
        { email: input.email, name: input.name, password: input.password },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async upsert(input: CreateUserInput) {
    const { data, error } = await supabase
      .from("Users")
      .upsert([
        { email: input.email, name: input.name, password: input.password },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async update(email: string, input: UpdateUserInput) {
    const updateData: any = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.password !== undefined ? { password: input.password } : {}),
    };

    const { data, error } = await supabase
      .from("Users")
      .update(updateData)
      .eq("email", email)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async delete(email: string) {
    const { data, error } = await supabase.from("Users").delete().eq("email", email).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
}
