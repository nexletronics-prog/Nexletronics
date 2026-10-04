import {
  createClient,
} from "@supabase/supabase-js";

import {
  auth,
} from "../firebase/config";

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
 * SUPABASE CLIENT
 * ==========================================================
 *
 * Firebase Authentication remains the authentication system.
 *
 * The Firebase ID token is passed to Supabase so Supabase
 * can authorize database operations using the authenticated
 * Firebase user.
 */

export const supabase =
  createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      accessToken:
        async () => {
          const currentUser =
            auth.currentUser;

          if (!currentUser) {
            return null;
          }

          return (
            await currentUser.getIdToken(
              false,
            )
          ) ?? null;
        },
    },
  );