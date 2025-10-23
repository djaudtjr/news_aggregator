import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.VITE_SUPABASE_URL || ""
const supabaseSecretKey = process.env.VITE_SUPABASE_SECRET_KEY || ""

if (!supabaseUrl || !supabaseSecretKey) {
  console.warn("[v0] Supabase credentials not found in environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey)
