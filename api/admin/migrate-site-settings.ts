import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "../_lib/firebase-admin.mjs";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function bearerToken(req: VercelRequest): string | null {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (
      (value as { toDate: () => Date }).toDate().toISOString()
    );
  }

  return null;
}

function cleanFeatures(value: unknown): Array<{
  number: string;
  title: string;
  description: string;
}> {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const feature =
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {};

    return {
      number: asString(feature.number, String(index + 1).padStart(2, "0")),
      title: asString(feature.title, "Feature"),
      description: asString(feature.description),
    };
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  try {
    const token = bearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Firebase authentication required.",
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.is_admin !== true) {
      return res.status(403).json({
        success: false,
        error: "Admin permission required.",
      });
    }

    const db = getFirestore();
    const batchResults = {
      homepage: false,
      global: false,
      homepage3D: false,
    };

    const homepageSnapshot = await db
      .collection("siteSettings")
      .doc("homepage")
      .get();

    if (homepageSnapshot.exists) {
      const data = homepageSnapshot.data() ?? {};

      const row = {
        id: "homepage",
        hero_eyebrow: asString(data.heroEyebrow, "Premium Electronics Components"),
        hero_title: asString(data.heroTitle, "Power Your Next Build"),
        hero_subtitle: asString(data.heroSubtitle),
        hero_button_text: asString(data.heroButtonText, "Browse Components"),
        hero_button_link: asString(data.heroButtonLink, "/products"),
        secondary_button_text: asString(data.secondaryButtonText, "Learn More"),
        secondary_button_link: asString(data.secondaryButtonLink, "/about"),
        hero_image: asString(data.heroImage),
        about_eyebrow: asString(data.aboutEyebrow, "About Nexletronics"),
        about_title: asString(
          data.aboutTitle,
          "Technology built around people and practical problems.",
        ),
        about_description: asString(data.aboutDescription),
        about_button_text: asString(data.aboutButtonText, "About Us"),
        about_button_link: asString(data.aboutButtonLink, "/about"),
        features: cleanFeatures(data.features),
        cta_eyebrow: asString(data.ctaEyebrow, "Have a project in mind?"),
        cta_title: asString(data.ctaTitle, "Let's build something useful."),
        cta_description: asString(data.ctaDescription),
        cta_button_text: asString(data.ctaButtonText, "Start a Project"),
        cta_button_link: asString(data.ctaButtonLink, "/contact"),
        show_features: asBoolean(data.showFeatures, true),
        show_about: asBoolean(data.showAbout, true),
        show_products: asBoolean(data.showProducts, true),
        show_services: asBoolean(data.showServices, true),
        show_cta: asBoolean(data.showCTA, true),
        updated_at: toIso(data.updatedAt),
      };

      const { error } = await supabase
        .from("homepage_settings")
        .upsert(row);

      if (error) throw new Error(`Homepage settings migration failed: ${error.message}`);
      batchResults.homepage = true;
    }

    const globalSnapshot = await db
      .collection("siteSettings")
      .doc("global")
      .get();

    if (globalSnapshot.exists) {
      const data = globalSnapshot.data() ?? {};

      const row = {
        id: "global",
        company_name: asString(data.companyName, "Nexletronics"),
        company_email: asString(data.companyEmail, "info@nexletronics.com"),
        company_phone: asString(data.companyPhone),
        company_address: asString(data.companyAddress),
        footer_description: asString(data.footerDescription),
        copyright_text: asString(
          data.copyrightText,
          "Nexletronics. All rights reserved.",
        ),
        instagram_url: asString(data.instagramUrl),
        facebook_url: asString(data.facebookUrl),
        youtube_url: asString(data.youtubeUrl),
        linkedin_url: asString(data.linkedinUrl),
        currency: asString(data.currency, "INR"),
        maintenance_mode: asBoolean(data.maintenanceMode, false),
        email_login: asBoolean(data.emailLogin, true),
        google_login: asBoolean(data.googleLogin, true),
        checkout_enabled: asBoolean(data.checkoutEnabled, true),
        updated_at: toIso(data.updatedAt),
      };

      const { error } = await supabase
        .from("global_website_settings")
        .upsert(row);

      if (error) throw new Error(`Global settings migration failed: ${error.message}`);
      batchResults.global = true;
    }

    const modelSnapshot = await db
      .collection("siteSettings")
      .doc("homepage3DModel")
      .get();

    if (modelSnapshot.exists) {
      const data = modelSnapshot.data() ?? {};

      const row = {
        id: "current",
        enabled: asBoolean(data.enabled, false),
        title: asString(data.title, "Nexletronics 3D Model"),
        description: asString(data.description, "Interactive 3D printed model."),
        file_url: asString(data.fileUrl),
        storage_path: asString(data.storagePath),
        original_file_name: asString(data.originalFileName),
        rotation_enabled: asBoolean(data.rotationEnabled, true),
        rotation_speed: Math.min(2.5, Math.max(0.1, asNumber(data.rotationSpeed, 0.7))),
        zoom_enabled: asBoolean(data.zoomEnabled, true),
        zoom_level: Math.min(2, Math.max(0.5, asNumber(data.zoomLevel, 1))),
        updated_at: toIso(data.updatedAt),
      };

      const { error } = await supabase
        .from("homepage_3d_models")
        .upsert(row);

      if (error) throw new Error(`Homepage 3D model migration failed: ${error.message}`);
      batchResults.homepage3D = true;
    }

    return res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      migrated: batchResults,
      note:
        "Homepage 3D metadata is migrated. Existing Firebase Storage STL files are kept untouched until re-uploaded through the admin panel, which now writes new files to Supabase Storage.",
    });
  } catch (error) {
    console.error("Site settings migration failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Migration failed.",
    });
  }
}
