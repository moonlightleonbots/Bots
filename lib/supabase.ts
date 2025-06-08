import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cubmcmzhmskcrfvrlmcc.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Ym1jbXpobXNrY3JmdnJsbWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDEzNDIsImV4cCI6MjA2NDg3NzM0Mn0.2eBgMujDLJ-Wf0QekVg3SFO-c9bnEZuu5aYDNtcNUO4"

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
