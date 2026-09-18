import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://ivbkgfwyocmazhrqibqn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_wKsT7-WtmJgxBVSxV1rDCg_CNCgWBP8";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);