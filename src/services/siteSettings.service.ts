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
  HomepageFeature,
  HomepageSettings,
} from "../types/siteSettings";


/*
 * ==========================================================
 * DEFAULT HOMEPAGE SETTINGS
 * ==========================================================
 */

export const defaultHomepageSettings:
  HomepageSettings = {

  heroEyebrow:
    "Premium Electronics Components",

  heroTitle:
    "Power Your Next Build",

  heroSubtitle:
    "From resistors to microcontrollers — Nexletronics delivers precision components for makers, engineers, and innovators.",

  heroButtonText:
    "Browse Components",

  heroButtonLink:
    "/products",

  secondaryButtonText:
    "Learn More",

  secondaryButtonLink:
    "/about",

  heroImage:
    "",


  aboutEyebrow:
    "About Nexletronics",

  aboutTitle:
    "Technology built around people and practical problems.",

  aboutDescription:
    "We combine electronics, software and engineering expertise to help makers, businesses and innovators turn ideas into practical solutions.",

  aboutButtonText:
    "About Us",

  aboutButtonLink:
    "/about",


  ctaEyebrow:
    "Have a project in mind?",

  ctaTitle:
    "Let's build something useful.",

  ctaDescription:
    "Tell us what you are working on and our team can help you choose the right components, services or custom solution.",

  ctaButtonText:
    "Start a Project",

  ctaButtonLink:
    "/contact",


  features: [
    {
      number:
        "01",

      title:
        "Innovation",

      description:
        "Modern technology designed around practical customer needs.",
    },

    {
      number:
        "02",

      title:
        "Reliability",

      description:
        "Products and solutions focused on quality and dependable performance.",
    },

    {
      number:
        "03",

      title:
        "Support",

      description:
        "A customer-first approach from initial enquiry to deployment.",
    },
  ],


  showFeatures:
    true,

  showAbout:
    true,

  showProducts:
    true,

  showServices:
    true,

  showCTA:
    true,
};


/*
 * ==========================================================
 * FEATURE NORMALIZER
 * ==========================================================
 */

function normalizeFeature(
  feature: unknown,
  index: number,
): HomepageFeature {

  const value =
    feature &&
    typeof feature ===
      "object"
      ? feature as Partial<HomepageFeature>
      : {};


  return {

    number:
      typeof value.number ===
      "string"
        ? value.number
        : String(
            index + 1,
          ).padStart(
            2,
            "0",
          ),

    title:
      typeof value.title ===
      "string"
        ? value.title
        : "Feature",

    description:
      typeof value.description ===
      "string"
        ? value.description
        : "",
  };
}


/*
 * ==========================================================
 * HOMEPAGE NORMALIZER
 * ==========================================================
 */

function normalizeHomepageSettings(
  data?: Partial<HomepageSettings>,
): HomepageSettings {

  const value =
    data ?? {};


  const features =
    Array.isArray(
      value.features,
    ) &&
    value.features.length > 0

      ? value.features.map(
          (
            feature,
            index,
          ) =>
            normalizeFeature(
              feature,
              index,
            ),
        )

      : defaultHomepageSettings.features.map(
          (
            feature,
          ) => ({
            ...feature,
          }),
        );


  return {

    ...defaultHomepageSettings,

    ...value,

    features,


    heroEyebrow:
      typeof value.heroEyebrow ===
      "string"
        ? value.heroEyebrow
        : defaultHomepageSettings.heroEyebrow,


    heroTitle:
      typeof value.heroTitle ===
      "string"
        ? value.heroTitle
        : defaultHomepageSettings.heroTitle,


    heroSubtitle:
      typeof value.heroSubtitle ===
      "string"
        ? value.heroSubtitle
        : defaultHomepageSettings.heroSubtitle,


    heroButtonText:
      typeof value.heroButtonText ===
      "string"
        ? value.heroButtonText
        : defaultHomepageSettings.heroButtonText,


    heroButtonLink:
      typeof value.heroButtonLink ===
      "string"
        ? value.heroButtonLink
        : defaultHomepageSettings.heroButtonLink,


    secondaryButtonText:
      typeof value.secondaryButtonText ===
      "string"
        ? value.secondaryButtonText
        : defaultHomepageSettings.secondaryButtonText,


    secondaryButtonLink:
      typeof value.secondaryButtonLink ===
      "string"
        ? value.secondaryButtonLink
        : defaultHomepageSettings.secondaryButtonLink,


    heroImage:
      typeof value.heroImage ===
      "string"
        ? value.heroImage
        : defaultHomepageSettings.heroImage,


    aboutEyebrow:
      typeof value.aboutEyebrow ===
      "string"
        ? value.aboutEyebrow
        : defaultHomepageSettings.aboutEyebrow,


    aboutTitle:
      typeof value.aboutTitle ===
      "string"
        ? value.aboutTitle
        : defaultHomepageSettings.aboutTitle,


    aboutDescription:
      typeof value.aboutDescription ===
      "string"
        ? value.aboutDescription
        : defaultHomepageSettings.aboutDescription,


    aboutButtonText:
      typeof value.aboutButtonText ===
      "string"
        ? value.aboutButtonText
        : defaultHomepageSettings.aboutButtonText,


    aboutButtonLink:
      typeof value.aboutButtonLink ===
      "string"
        ? value.aboutButtonLink
        : defaultHomepageSettings.aboutButtonLink,


    ctaEyebrow:
      typeof value.ctaEyebrow ===
      "string"
        ? value.ctaEyebrow
        : defaultHomepageSettings.ctaEyebrow,


    ctaTitle:
      typeof value.ctaTitle ===
      "string"
        ? value.ctaTitle
        : defaultHomepageSettings.ctaTitle,


    ctaDescription:
      typeof value.ctaDescription ===
      "string"
        ? value.ctaDescription
        : defaultHomepageSettings.ctaDescription,


    ctaButtonText:
      typeof value.ctaButtonText ===
      "string"
        ? value.ctaButtonText
        : defaultHomepageSettings.ctaButtonText,


    ctaButtonLink:
      typeof value.ctaButtonLink ===
      "string"
        ? value.ctaButtonLink
        : defaultHomepageSettings.ctaButtonLink,


    showFeatures:
      typeof value.showFeatures ===
      "boolean"
        ? value.showFeatures
        : defaultHomepageSettings.showFeatures,


    showAbout:
      typeof value.showAbout ===
      "boolean"
        ? value.showAbout
        : defaultHomepageSettings.showAbout,


    showProducts:
      typeof value.showProducts ===
      "boolean"
        ? value.showProducts
        : defaultHomepageSettings.showProducts,


    showServices:
      typeof value.showServices ===
      "boolean"
        ? value.showServices
        : defaultHomepageSettings.showServices,


    showCTA:
      typeof value.showCTA ===
      "boolean"
        ? value.showCTA
        : defaultHomepageSettings.showCTA,


    updatedAt:
      value.updatedAt,
  };
}


/*
 * ==========================================================
 * GET HOMEPAGE SETTINGS
 * ==========================================================
 */

export async function getHomepageSettings():
  Promise<HomepageSettings> {

  try {

    const reference =
      doc(
        db,
        "siteSettings",
        "homepage",
      );


    const snapshot =
      await getDoc(
        reference,
      );


    if (!snapshot.exists()) {

      return normalizeHomepageSettings();

    }


    return normalizeHomepageSettings(
      snapshot.data() as Partial<HomepageSettings>,
    );

  } catch (error) {

    console.error(
      "Failed to load homepage settings:",
      error,
    );


    return normalizeHomepageSettings();

  }
}


/*
 * ==========================================================
 * REALTIME HOMEPAGE SETTINGS
 * ==========================================================
 */

export function subscribeToHomepageSettings(
  onChange: (
    settings: HomepageSettings,
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {

  const reference =
    doc(
      db,
      "siteSettings",
      "homepage",
    );


  return onSnapshot(

    reference,

    (snapshot) => {

      if (!snapshot.exists()) {

        onChange(
          normalizeHomepageSettings(),
        );

        return;
      }


      onChange(
        normalizeHomepageSettings(
          snapshot.data() as Partial<HomepageSettings>,
        ),
      );
    },

    (error) => {

      console.error(
        "Realtime homepage settings listener failed:",
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
 * SAVE HOMEPAGE SETTINGS
 * ==========================================================
 */

export async function saveHomepageSettings(
  settings: HomepageSettings,
): Promise<void> {

  if (!settings) {

    throw new Error(
      "Homepage settings are required.",
    );
  }


  const features =
    Array.isArray(
      settings.features,
    )

      ? settings.features.map(
          (
            feature,
            index,
          ) => ({

            number:
              String(
                feature.number ??
                  String(
                    index + 1,
                  ).padStart(
                    2,
                    "0",
                  ),
              ).trim(),

            title:
              String(
                feature.title ??
                  "",
              ).trim(),

            description:
              String(
                feature.description ??
                  "",
              ).trim(),
          }),
        )

      : defaultHomepageSettings.features.map(
          (
            feature,
          ) => ({
            ...feature,
          }),
        );


  await setDoc(

    doc(
      db,
      "siteSettings",
      "homepage",
    ),

    {

      heroEyebrow:
        settings.heroEyebrow.trim(),

      heroTitle:
        settings.heroTitle.trim(),

      heroSubtitle:
        settings.heroSubtitle.trim(),

      heroButtonText:
        settings.heroButtonText.trim(),

      heroButtonLink:
        settings.heroButtonLink.trim(),

      secondaryButtonText:
        settings.secondaryButtonText.trim(),

      secondaryButtonLink:
        settings.secondaryButtonLink.trim(),

      heroImage:
        settings.heroImage?.trim() ||
        "",


      aboutEyebrow:
        settings.aboutEyebrow.trim(),

      aboutTitle:
        settings.aboutTitle.trim(),

      aboutDescription:
        settings.aboutDescription.trim(),

      aboutButtonText:
        settings.aboutButtonText.trim(),

      aboutButtonLink:
        settings.aboutButtonLink.trim(),


      ctaEyebrow:
        settings.ctaEyebrow.trim(),

      ctaTitle:
        settings.ctaTitle.trim(),

      ctaDescription:
        settings.ctaDescription.trim(),

      ctaButtonText:
        settings.ctaButtonText.trim(),

      ctaButtonLink:
        settings.ctaButtonLink.trim(),


      features,


      showFeatures:
        Boolean(
          settings.showFeatures,
        ),

      showAbout:
        Boolean(
          settings.showAbout,
        ),

      showProducts:
        Boolean(
          settings.showProducts,
        ),

      showServices:
        Boolean(
          settings.showServices,
        ),

      showCTA:
        Boolean(
          settings.showCTA,
        ),


      updatedAt:
        serverTimestamp(),
    },

    {
      merge: true,
    },
  );
}