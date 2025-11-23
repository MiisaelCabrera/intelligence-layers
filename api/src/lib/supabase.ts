import dotenv from "dotenv";
dotenv.config();

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in the environment");
}

const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClient };

export const supabase =
  globalForSupabase.supabase ?? createClient(SUPABASE_URL, SUPABASE_KEY);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

export default supabase;
