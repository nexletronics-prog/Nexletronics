/*
 * ==========================================================
 * HOMEPAGE FEATURE
 * ==========================================================
 */

export interface HomepageFeature {
  number: string;
  title: string;
  description: string;
}


/*
 * ==========================================================
 * HOMEPAGE SETTINGS
 * ==========================================================
 */

export interface HomepageSettings {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  heroImage?: string;

  aboutEyebrow: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutButtonText: string;
  aboutButtonLink: string;

  features: HomepageFeature[];

  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonText: string;
  ctaButtonLink: string;

  showFeatures: boolean;
  showAbout: boolean;
  showProducts: boolean;
  showServices: boolean;
  showCTA: boolean;

  updatedAt?: unknown;
}


/*
 * ==========================================================
 * GLOBAL WEBSITE SETTINGS
 * ==========================================================
 *
 * Firestore document:
 *
 *     siteSettings/global
 *
 * This is now also the source of truth for the
 * administration/store controls.
 */

export interface GlobalWebsiteSettings {

  /* --------------------------------------------------------
     COMPANY
  --------------------------------------------------------- */

  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;


  /* --------------------------------------------------------
     FOOTER
  --------------------------------------------------------- */

  footerDescription: string;
  copyrightText: string;


  /* --------------------------------------------------------
     SOCIAL
  --------------------------------------------------------- */

  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;


  /* --------------------------------------------------------
     STORE / ADMIN SETTINGS
  --------------------------------------------------------- */

  currency: string;

  maintenanceMode: boolean;

  emailLogin: boolean;

  googleLogin: boolean;

  checkoutEnabled: boolean;


  /* --------------------------------------------------------
     FIRESTORE METADATA
  --------------------------------------------------------- */

  updatedAt?: unknown;
}