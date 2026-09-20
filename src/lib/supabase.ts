import {
  createClient,
} from "@supabase/supabase-js";


/*
 * ==========================================================
 * SUPABASE CONFIGURATION
 * ==========================================================
 */

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;


const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;


/*
 * ==========================================================
 * VALIDATION
 * ==========================================================
 */

if (!supabaseUrl) {

  throw new Error(
    "Missing VITE_SUPABASE_URL in .env.local",
  );

}


if (!supabasePublishableKey) {

  throw new Error(
    "Missing VITE_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );

}


/*
 * ==========================================================
 * CLIENT
 * ==========================================================
 */

export const supabase =
  createClient(
    supabaseUrl,
    supabasePublishableKey,
  );