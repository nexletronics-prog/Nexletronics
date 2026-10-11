import { auth } from "../firebase/config";
import { supabase } from "../lib/supabase";
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

  const result: { success?: boolean; error?: string } =
    await response.json().catch(() => ({}));

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

  const { error } = await supabase.rpc("record_registration_consent", {
    p_marketing_consent: Boolean(marketingConsent),
  });

  if (error) {
    console.error("Failed to save registration consent:", error);
    throw new Error(error.message);
  }
}
