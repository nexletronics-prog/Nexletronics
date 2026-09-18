import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  GlobalWebsiteSettings,
} from "../types/siteSettings";


/*
 * ==========================================================
 * DEFAULT GLOBAL SETTINGS
 * ==========================================================
 */

export const defaultGlobalWebsiteSettings:
  GlobalWebsiteSettings = {

  companyName:
    "Nexletronics",

  companyEmail:
    "info@nexletronics.com",

  companyPhone:
    "",

  companyAddress:
    "",

  footerDescription:
    "Technology, electronics and innovation solutions built for real-world applications.",

  copyrightText:
    "Nexletronics. All rights reserved.",

  instagramUrl:
    "",

  facebookUrl:
    "",

  youtubeUrl:
    "",

  linkedinUrl:
    "",

  currency:
    "INR",

  maintenanceMode:
    false,

  emailLogin:
    true,

  googleLogin:
    true,

  checkoutEnabled:
    true,
};


/*
 * ==========================================================
 * NORMALIZE
 * ==========================================================
 */

function normalizeGlobalWebsiteSettings(
  data?: Partial<GlobalWebsiteSettings>,
): GlobalWebsiteSettings {

  const value =
    data ?? {};


  return {

    ...defaultGlobalWebsiteSettings,


    companyName:
      typeof value.companyName === "string"
        ? value.companyName
        : defaultGlobalWebsiteSettings.companyName,


    companyEmail:
      typeof value.companyEmail === "string"
        ? value.companyEmail
        : defaultGlobalWebsiteSettings.companyEmail,


    companyPhone:
      typeof value.companyPhone === "string"
        ? value.companyPhone
        : defaultGlobalWebsiteSettings.companyPhone,


    companyAddress:
      typeof value.companyAddress === "string"
        ? value.companyAddress
        : defaultGlobalWebsiteSettings.companyAddress,


    footerDescription:
      typeof value.footerDescription === "string"
        ? value.footerDescription
        : defaultGlobalWebsiteSettings.footerDescription,


    copyrightText:
      typeof value.copyrightText === "string"
        ? value.copyrightText
        : defaultGlobalWebsiteSettings.copyrightText,


    instagramUrl:
      typeof value.instagramUrl === "string"
        ? value.instagramUrl
        : defaultGlobalWebsiteSettings.instagramUrl,


    facebookUrl:
      typeof value.facebookUrl === "string"
        ? value.facebookUrl
        : defaultGlobalWebsiteSettings.facebookUrl,


    youtubeUrl:
      typeof value.youtubeUrl === "string"
        ? value.youtubeUrl
        : defaultGlobalWebsiteSettings.youtubeUrl,


    linkedinUrl:
      typeof value.linkedinUrl === "string"
        ? value.linkedinUrl
        : defaultGlobalWebsiteSettings.linkedinUrl,


    currency:
      typeof value.currency === "string"
        ? value.currency
        : defaultGlobalWebsiteSettings.currency,


    maintenanceMode:
      typeof value.maintenanceMode === "boolean"
        ? value.maintenanceMode
        : defaultGlobalWebsiteSettings.maintenanceMode,


    emailLogin:
      typeof value.emailLogin === "boolean"
        ? value.emailLogin
        : defaultGlobalWebsiteSettings.emailLogin,


    googleLogin:
      typeof value.googleLogin === "boolean"
        ? value.googleLogin
        : defaultGlobalWebsiteSettings.googleLogin,


    checkoutEnabled:
      typeof value.checkoutEnabled === "boolean"
        ? value.checkoutEnabled
        : defaultGlobalWebsiteSettings.checkoutEnabled,


    updatedAt:
      value.updatedAt,
  };
}


/*
 * ==========================================================
 * GET GLOBAL SETTINGS
 * ==========================================================
 */

export async function getGlobalWebsiteSettings():
  Promise<GlobalWebsiteSettings> {

  try {

    const reference =
      doc(
        db,
        "siteSettings",
        "global",
      );


    const snapshot =
      await getDoc(
        reference,
      );


    if (!snapshot.exists()) {

      return {
        ...defaultGlobalWebsiteSettings,
      };
    }


    return normalizeGlobalWebsiteSettings(
      snapshot.data() as Partial<GlobalWebsiteSettings>,
    );

  } catch (error) {

    console.error(
      "Failed to load global website settings:",
      error,
    );


    return {
      ...defaultGlobalWebsiteSettings,
    };
  }
}


/*
 * ==========================================================
 * REALTIME GLOBAL SETTINGS
 * ==========================================================
 */

export function subscribeToGlobalWebsiteSettings(
  onChange: (
    settings: GlobalWebsiteSettings,
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {

  const reference =
    doc(
      db,
      "siteSettings",
      "global",
    );


  return onSnapshot(

    reference,

    (snapshot) => {

      if (!snapshot.exists()) {

        onChange({
          ...defaultGlobalWebsiteSettings,
        });

        return;
      }


      const settings =
        normalizeGlobalWebsiteSettings(
          snapshot.data() as Partial<GlobalWebsiteSettings>,
        );


      onChange(
        settings,
      );
    },

    (error) => {

      console.error(
        "Global settings realtime listener failed:",
        error,
      );


      onError?.(
        error,
      );
    },
  );
}


/*
 * ==========================================================
 * SAVE GLOBAL SETTINGS
 * ==========================================================
 */

export async function saveGlobalWebsiteSettings(
  settings: GlobalWebsiteSettings,
): Promise<void> {

  const normalized =
    normalizeGlobalWebsiteSettings(
      settings,
    );


  await setDoc(

    doc(
      db,
      "siteSettings",
      "global",
    ),

    {

      companyName:
        normalized.companyName.trim(),

      companyEmail:
        normalized.companyEmail.trim(),

      companyPhone:
        normalized.companyPhone.trim(),

      companyAddress:
        normalized.companyAddress.trim(),

      footerDescription:
        normalized.footerDescription.trim(),

      copyrightText:
        normalized.copyrightText.trim(),

      instagramUrl:
        normalized.instagramUrl.trim(),

      facebookUrl:
        normalized.facebookUrl.trim(),

      youtubeUrl:
        normalized.youtubeUrl.trim(),

      linkedinUrl:
        normalized.linkedinUrl.trim(),

      currency:
        normalized.currency.trim(),

      maintenanceMode:
        normalized.maintenanceMode,

      emailLogin:
        normalized.emailLogin,

      googleLogin:
        normalized.googleLogin,

      checkoutEnabled:
        normalized.checkoutEnabled,

      updatedAt:
        serverTimestamp(),
    },

    {
      merge: true,
    },
  );
}