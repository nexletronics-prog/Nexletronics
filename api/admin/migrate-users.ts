import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { adminAuth, adminDb } from "../_lib/firebase-admin.mjs";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL.");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isAdminUid(uid: string): boolean {
  return (process.env.NEXLETRONICS_ADMIN_UIDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(uid);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Firebase authentication required." });
    }

    const decodedToken = await adminAuth.verifyIdToken(
      authorization.slice(7).trim(),
    );

    if (!isAdminUid(decodedToken.uid)) {
      return res.status(403).json({ success: false, error: "Admin access required." });
    }

    const snapshot = await adminDb.collection("users").get();
    let profilesMigrated = 0;
    let consentsMigrated = 0;

    for (const document of snapshot.docs) {
      const data = document.data() as Record<string, unknown>;
      const uid = document.id;
      const admin = data.role === "admin" || isAdminUid(uid);

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            firebase_uid: uid,
            name: typeof data.name === "string" ? data.name : "Customer",
            email: typeof data.email === "string" ? data.email.toLowerCase() : "",
            phone: typeof data.phone === "string" ? data.phone : "",
            photo_url: typeof data.photoURL === "string" ? data.photoURL : "",
            provider: typeof data.provider === "string" ? data.provider : "password",
            role: admin ? "admin" : "customer",
          },
          { onConflict: "firebase_uid" },
        );

      if (profileError) throw profileError;
      profilesMigrated += 1;

      const legal =
        data.legal && typeof data.legal === "object"
          ? (data.legal as Record<string, unknown>)
          : null;

      if (legal) {
        const acceptedAtValue = legal.acceptedAt;
        let acceptedAt = new Date().toISOString();

        if (acceptedAtValue && typeof acceptedAtValue === "object") {
          const candidate = acceptedAtValue as { toDate?: unknown };
          if (typeof candidate.toDate === "function") {
            const date = (candidate.toDate as () => unknown)();
            if (date instanceof Date) acceptedAt = date.toISOString();
          }
        } else if (typeof acceptedAtValue === "string") {
          acceptedAt = acceptedAtValue;
        }

        const { error: consentError } = await supabaseAdmin
          .from("legal_consents")
          .upsert(
            {
              firebase_uid: uid,
              terms_accepted: legal.termsAccepted === true,
              privacy_policy_accepted: legal.privacyPolicyAccepted === true,
              necessary_data_consent: legal.necessaryDataConsent === true,
              marketing_consent: legal.marketingConsent === true,
              terms_version: typeof legal.termsVersion === "string" ? legal.termsVersion : "",
              privacy_policy_version:
                typeof legal.privacyPolicyVersion === "string"
                  ? legal.privacyPolicyVersion
                  : "",
              accepted_at: acceptedAt,
              consent_source:
                typeof legal.consentSource === "string"
                  ? legal.consentSource
                  : "registration",
            },
            { onConflict: "firebase_uid" },
          );

        if (consentError) throw consentError;
        consentsMigrated += 1;
      }

      const userRecord = await adminAuth.getUser(uid);
      const existingClaims = userRecord.customClaims ?? {};
      await adminAuth.setCustomUserClaims(uid, {
        ...existingClaims,
        role: "authenticated",
        is_admin: admin,
      });
    }

    return res.status(200).json({
      success: true,
      firestoreUsers: snapshot.size,
      profilesMigrated,
      consentsMigrated,
    });
  } catch (error) {
    console.error("User migration failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "User migration failed.",
    });
  }
}
