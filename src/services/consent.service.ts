import { auth } from "../firebase/config";
import { supabase } from "../lib/supabase";
import {
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
} from "../legal/legalVersions";

export interface RegistrationConsent {
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  necessaryDataConsent: boolean;
  marketingConsent: boolean;
  termsVersion: string;
  privacyPolicyVersion: string;
  acceptedAt: unknown;
  consentSource: "registration";
}

async function ensureSupabaseAuthReady(uid: string): Promise<void> {
  const currentUser = auth.currentUser;

  if (!currentUser || currentUser.uid !== uid) {
    throw new Error("Firebase authentication is required to save consent.");
  }

  const idToken = await currentUser.getIdToken(false);

  const response = await fetch("/api/auth/ensure-supabase-role", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  let result: { success?: boolean; error?: string } = {};
  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok || result.success !== true) {
    throw new Error(
      result.error ??
        `Supabase authentication setup failed with status ${response.status}.`,
    );
  }

  await currentUser.getIdToken(true);
}

export async function saveRegistrationConsent(
  uid: string,
  marketingConsent: boolean,
): Promise<void> {
  const cleanUid = uid.trim();

  if (!cleanUid) {
    throw new Error("Firebase UID is required for registration consent.");
  }

  await ensureSupabaseAuthReady(cleanUid);

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("legal_consents")
    .upsert(
      {
        firebase_uid: cleanUid,
        terms_accepted: true,
        privacy_policy_accepted: true,
        necessary_data_consent: true,
        marketing_consent: Boolean(marketingConsent),
        terms_version: TERMS_VERSION,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        accepted_at: now,
        consent_source: "registration",
        updated_at: now,
      },
      { onConflict: "firebase_uid" },
    );

  if (error) {
    console.error("Failed to save registration consent:", error);
    throw new Error(error.message);
  }
}
