import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

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


export async function saveRegistrationConsent(
  uid: string,
  marketingConsent: boolean,
) {

  const consent:
    RegistrationConsent = {

    termsAccepted: true,

    privacyPolicyAccepted: true,

    necessaryDataConsent: true,

    marketingConsent,

    termsVersion:
      TERMS_VERSION,

    privacyPolicyVersion:
      PRIVACY_POLICY_VERSION,

    acceptedAt:
      serverTimestamp(),

    consentSource:
      "registration",
  };


  await setDoc(
    doc(
      db,
      "users",
      uid,
    ),
    {
      legal: consent,
    },
    {
      merge: true,
    },
  );
}