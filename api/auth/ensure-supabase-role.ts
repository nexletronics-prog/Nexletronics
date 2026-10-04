import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { adminAuth } from "../_lib/firebase-admin.mjs";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function configuredAdminUids(): Set<string> {
  return new Set(
    (process.env.NEXLETRONICS_ADMIN_UIDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Firebase authentication required.",
      });
    }

    const idToken = authorization.slice(7).trim();

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "Missing Firebase ID token.",
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const existingClaims = userRecord.customClaims ?? {};
    const isAdmin = configuredAdminUids().has(decodedToken.uid);

    const nextClaims = {
      ...existingClaims,
      role: "authenticated",
      is_admin: isAdmin,
    };

    const claimsChanged =
      existingClaims.role !== nextClaims.role ||
      existingClaims.is_admin !== nextClaims.is_admin;

    if (claimsChanged) {
      await adminAuth.setCustomUserClaims(
        decodedToken.uid,
        nextClaims,
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          firebase_uid: decodedToken.uid,
          name: userRecord.displayName?.trim() || "Customer",
          email: (userRecord.email ?? "").trim().toLowerCase(),
          role: isAdmin ? "admin" : "customer",
          provider:
            userRecord.providerData[0]?.providerId ===
            "google.com"
              ? "google"
              : "password",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "firebase_uid" },
      );

    if (profileError) {
      throw new Error(
        `Supabase profile setup failed: ${profileError.message}`,
      );
    }

    return res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      role: "authenticated",
      is_admin: isAdmin,
      claimsUpdated: claimsChanged,
    });
  } catch (error) {
    console.error("[AUTH/SUPABASE BRIDGE] Failed:", error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to configure Supabase authentication.",
    });
  }
}
