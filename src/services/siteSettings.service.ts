import { supabase } from "../lib/supabase";
import type {
  HomepageFeature,
  HomepageSettings,
} from "../types/siteSettings";

const HOMEPAGE_TABLE = "homepage_settings";
const HOMEPAGE_ID = "homepage";

export const defaultHomepageSettings: HomepageSettings = {
  heroEyebrow: "Premium Electronics Components",
  heroTitle: "Power Your Next Build",
  heroSubtitle:
    "From resistors to microcontrollers — Nexletronics delivers precision components for makers, engineers, and innovators.",
  heroButtonText: "Browse Components",
  heroButtonLink: "/products",
  secondaryButtonText: "Learn More",
  secondaryButtonLink: "/about",
  heroImage: "",
  aboutEyebrow: "About Nexletronics",
  aboutTitle: "Technology built around people and practical problems.",
  aboutDescription:
    "We combine electronics, software and engineering expertise to help makers, businesses and innovators turn ideas into practical solutions.",
  aboutButtonText: "About Us",
  aboutButtonLink: "/about",
  ctaEyebrow: "Have a project in mind?",
  ctaTitle: "Let's build something useful.",
  ctaDescription:
    "Tell us what you are working on and our team can help you choose the right components, services or custom solution.",
  ctaButtonText: "Start a Project",
  ctaButtonLink: "/contact",
  features: [
    {
      number: "01",
      title: "Innovation",
      description:
        "Modern technology designed around practical customer needs.",
    },
    {
      number: "02",
      title: "Reliability",
      description:
        "Products and solutions focused on quality and dependable performance.",
    },
    {
      number: "03",
      title: "Support",
      description:
        "A customer-first approach from initial enquiry to deployment.",
    },
  ],
  showFeatures: true,
  showAbout: true,
  showProducts: true,
  showServices: true,
  showCTA: true,
};

interface HomepageRow {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_button_text: string | null;
  hero_button_link: string | null;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
  hero_image: string | null;
  about_eyebrow: string | null;
  about_title: string | null;
  about_description: string | null;
  about_button_text: string | null;
  about_button_link: string | null;
  features: unknown;
  cta_eyebrow: string | null;
  cta_title: string | null;
  cta_description: string | null;
  cta_button_text: string | null;
  cta_button_link: string | null;
  show_features: boolean | null;
  show_about: boolean | null;
  show_products: boolean | null;
  show_services: boolean | null;
  show_cta: boolean | null;
  updated_at: string | null;
}

const HOMEPAGE_COLUMNS = `
  id,
  hero_eyebrow,
  hero_title,
  hero_subtitle,
  hero_button_text,
  hero_button_link,
  secondary_button_text,
  secondary_button_link,
  hero_image,
  about_eyebrow,
  about_title,
  about_description,
  about_button_text,
  about_button_link,
  features,
  cta_eyebrow,
  cta_title,
  cta_description,
  cta_button_text,
  cta_button_link,
  show_features,
  show_about,
  show_products,
  show_services,
  show_cta,
  updated_at
`;

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeFeature(value: unknown, index: number): HomepageFeature {
  if (!value || typeof value !== "object") {
    return {
      number: String(index + 1).padStart(2, "0"),
      title: "Feature",
      description: "",
    };
  }

  const feature = value as Partial<HomepageFeature>;

  return {
    number:
      typeof feature.number === "string"
        ? feature.number
        : String(index + 1).padStart(2, "0"),
    title:
      typeof feature.title === "string" ? feature.title : "Feature",
    description:
      typeof feature.description === "string" ? feature.description : "",
  };
}

function cloneDefault(): HomepageSettings {
  return {
    ...defaultHomepageSettings,
    features: defaultHomepageSettings.features.map((feature) => ({
      ...feature,
    })),
  };
}

function normalizeHomepageSettings(row?: Partial<HomepageRow> | null): HomepageSettings {
  if (!row) {
    return cloneDefault();
  }

  const rawFeatures = Array.isArray(row.features) ? row.features : [];
  const features =
    rawFeatures.length > 0
      ? rawFeatures.map((feature, index) => normalizeFeature(feature, index))
      : cloneDefault().features;

  return {
    ...cloneDefault(),
    heroEyebrow: cleanString(row.hero_eyebrow, defaultHomepageSettings.heroEyebrow),
    heroTitle: cleanString(row.hero_title, defaultHomepageSettings.heroTitle),
    heroSubtitle: cleanString(
      row.hero_subtitle,
      defaultHomepageSettings.heroSubtitle,
    ),
    heroButtonText: cleanString(
      row.hero_button_text,
      defaultHomepageSettings.heroButtonText,
    ),
    heroButtonLink: cleanString(
      row.hero_button_link,
      defaultHomepageSettings.heroButtonLink,
    ),
    secondaryButtonText: cleanString(
      row.secondary_button_text,
      defaultHomepageSettings.secondaryButtonText,
    ),
    secondaryButtonLink: cleanString(
      row.secondary_button_link,
      defaultHomepageSettings.secondaryButtonLink,
    ),
    heroImage: cleanString(row.hero_image, defaultHomepageSettings.heroImage ?? ""),
    aboutEyebrow: cleanString(
      row.about_eyebrow,
      defaultHomepageSettings.aboutEyebrow,
    ),
    aboutTitle: cleanString(row.about_title, defaultHomepageSettings.aboutTitle),
    aboutDescription: cleanString(
      row.about_description,
      defaultHomepageSettings.aboutDescription,
    ),
    aboutButtonText: cleanString(
      row.about_button_text,
      defaultHomepageSettings.aboutButtonText,
    ),
    aboutButtonLink: cleanString(
      row.about_button_link,
      defaultHomepageSettings.aboutButtonLink,
    ),
    features,
    ctaEyebrow: cleanString(row.cta_eyebrow, defaultHomepageSettings.ctaEyebrow),
    ctaTitle: cleanString(row.cta_title, defaultHomepageSettings.ctaTitle),
    ctaDescription: cleanString(
      row.cta_description,
      defaultHomepageSettings.ctaDescription,
    ),
    ctaButtonText: cleanString(
      row.cta_button_text,
      defaultHomepageSettings.ctaButtonText,
    ),
    ctaButtonLink: cleanString(
      row.cta_button_link,
      defaultHomepageSettings.ctaButtonLink,
    ),
    showFeatures:
      typeof row.show_features === "boolean"
        ? row.show_features
        : defaultHomepageSettings.showFeatures,
    showAbout:
      typeof row.show_about === "boolean"
        ? row.show_about
        : defaultHomepageSettings.showAbout,
    showProducts:
      typeof row.show_products === "boolean"
        ? row.show_products
        : defaultHomepageSettings.showProducts,
    showServices:
      typeof row.show_services === "boolean"
        ? row.show_services
        : defaultHomepageSettings.showServices,
    showCTA:
      typeof row.show_cta === "boolean"
        ? row.show_cta
        : defaultHomepageSettings.showCTA,
    updatedAt: row.updated_at ?? undefined,
  };
}

function toRow(settings: HomepageSettings): Omit<HomepageRow, "updated_at"> {
  return {
    id: HOMEPAGE_ID,
    hero_eyebrow: settings.heroEyebrow.trim(),
    hero_title: settings.heroTitle.trim(),
    hero_subtitle: settings.heroSubtitle.trim(),
    hero_button_text: settings.heroButtonText.trim(),
    hero_button_link: settings.heroButtonLink.trim(),
    secondary_button_text: settings.secondaryButtonText.trim(),
    secondary_button_link: settings.secondaryButtonLink.trim(),
    hero_image: settings.heroImage?.trim() ?? "",
    about_eyebrow: settings.aboutEyebrow.trim(),
    about_title: settings.aboutTitle.trim(),
    about_description: settings.aboutDescription.trim(),
    about_button_text: settings.aboutButtonText.trim(),
    about_button_link: settings.aboutButtonLink.trim(),
    features: settings.features.map((feature, index) => ({
      number:
        String(feature.number ?? String(index + 1).padStart(2, "0")).trim(),
      title: String(feature.title ?? "").trim(),
      description: String(feature.description ?? "").trim(),
    })),
    cta_eyebrow: settings.ctaEyebrow.trim(),
    cta_title: settings.ctaTitle.trim(),
    cta_description: settings.ctaDescription.trim(),
    cta_button_text: settings.ctaButtonText.trim(),
    cta_button_link: settings.ctaButtonLink.trim(),
    show_features: Boolean(settings.showFeatures),
    show_about: Boolean(settings.showAbout),
    show_products: Boolean(settings.showProducts),
    show_services: Boolean(settings.showServices),
    show_cta: Boolean(settings.showCTA),
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const { data, error } = await supabase
    .from(HOMEPAGE_TABLE)
    .select(HOMEPAGE_COLUMNS)
    .eq("id", HOMEPAGE_ID)
    .maybeSingle();

  if (error) {
    console.error("Failed to load homepage settings:", error);
    return cloneDefault();
  }

  return normalizeHomepageSettings((data ?? null) as HomepageRow | null);
}

export function subscribeToHomepageSettings(
  onChange: (settings: HomepageSettings) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;

  void getHomepageSettings()
    .then((settings) => {
      if (active) onChange(settings);
    })
    .catch((error) => {
      if (!active) return;
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      onError?.(normalized);
    });

  const channel = supabase
    .channel(`homepage-settings-${HOMEPAGE_ID}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: HOMEPAGE_TABLE,
        filter: `id=eq.${HOMEPAGE_ID}`,
      },
      (payload) => {
        if (!active) return;

        if (payload.eventType === "DELETE") {
          onChange(cloneDefault());
          return;
        }

        onChange(normalizeHomepageSettings(payload.new as HomepageRow));
      },
    )
    .subscribe((status) => {
      if (!active) return;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(new Error(`Homepage settings realtime channel: ${status}.`));
      }
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function saveHomepageSettings(
  settings: HomepageSettings,
): Promise<void> {
  if (!settings) {
    throw new Error("Homepage settings are required.");
  }

  const { error } = await supabase.from(HOMEPAGE_TABLE).upsert(toRow(settings));

  if (error) {
    console.error("Failed to save homepage settings:", error);
    throw new Error(error.message);
  }
}
