import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL || ""
const supabaseServiceRoleKey = process.env.NEXT_SUPABASE_SECRET_KEY || ""

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for server client")
}

// Server-side client with service role key (bypasses RLS)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
