/*
 * ==========================================================
 * SUPABASE CLIENT COMPATIBILITY EXPORT
 * ==========================================================
 *
 * Keep a single Supabase client for the application.
 *
 * The canonical client lives in:
 *
 *     src/lib/supabase.ts
 *
 * That client injects the current Firebase ID token through
 * Supabase's accessToken callback, so Firebase remains the
 * authentication system while Supabase handles application
 * data.
 */

export { supabase } from "../lib/supabase";