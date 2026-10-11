import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { adminAuth, adminDb } from "../_lib/firebase-admin.mjs";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isAllowlistedAdmin(uid: string): boolean {
  return (process.env.NEXLETRONICS_ADMIN_UIDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(uid);
}

function embeddedArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing server-side Supabase configuration.");
    }

    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Firebase authentication required.",
      });
    }

    const decoded = await adminAuth.verifyIdToken(
      authorization.slice(7).trim(),
    );

    if (decoded.is_admin !== true && !isAllowlistedAdmin(decoded.uid)) {
      return res.status(403).json({
        success: false,
        error: "Administrator access required.",
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Keep this helper scoped to the configured client so TypeScript preserves
    // createClient's inferred SupabaseClient generics instead of using
    // ReturnType<typeof createClient>, which erases them incompatibly.
    const countSupabaseTable = async (
      table: string,
    ): Promise<{ count: number | null; error?: string }> => {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        return { count: null, error: error.message };
      }

      return { count: count ?? 0 };
    };

    // Source snapshots are read-only; this endpoint never writes to either database.
    const [
      usersSnapshot,
      ordersSnapshot,
      printingOrdersSnapshot,
      contactsSnapshot,
      servicesSnapshot,
      portfolioSnapshot,
      customProjectsSnapshot,
      homepageSettingsSnapshot,
      globalSettingsSnapshot,
      homepage3DSettingsSnapshot,
      showcaseSettingsSnapshot,
    ] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("orders").get(),
      adminDb.collection("threeDPrintOrders").get(),
      adminDb.collection("contacts").get(),
      adminDb.collection("services").get(),
      adminDb.collection("customPortfolio").get(),
      adminDb.collection("customProjects").get(),
      adminDb.collection("siteSettings").doc("homepage").get(),
      adminDb.collection("siteSettings").doc("global").get(),
      adminDb.collection("siteSettings").doc("homepage3DModel").get(),
      adminDb.collection("customShowcaseSettings").doc("default").get(),
    ]);

    const usersWithLegalConsent = usersSnapshot.docs.filter((document) => {
      const data = document.data();
      return data.legal !== null && typeof data.legal === "object";
    }).length;

    const embeddedOrderItems = ordersSnapshot.docs.reduce(
      (total, document) => total + embeddedArrayLength(document.data().items),
      0,
    );

    let legacyQuotations = 0;
    let legacyQuotationItems = 0;
    const projectSubcollections: Record<string, number> = {};

    // Discover and count all subcollections per legacy project so that messages,
    // activities, and other legacy nested data are not silently assumed absent.
    await Promise.all(
      customProjectsSnapshot.docs.map(async (projectDocument) => {
        const collections = await projectDocument.ref.listCollections();
        await Promise.all(
          collections.map(async (collection) => {
            const snapshot = await collection.get();
            projectSubcollections[collection.id] =
              (projectSubcollections[collection.id] ?? 0) + snapshot.size;

            if (collection.id === "quotations") {
              legacyQuotations += snapshot.size;
              legacyQuotationItems += snapshot.docs.reduce(
                (total, quotationDocument) =>
                  total + embeddedArrayLength(quotationDocument.data().items),
                0,
              );
            }
          }),
        );
      }),
    );

    const destinationTables = [
      "profiles",
      "legal_consents",
      "products",
      "orders",
      "order_items",
      "carts",
      "printing_orders",
      "printing_settings",
      "contacts",
      "services",
      "custom_projects",
      "custom_quotations",
      "custom_quotation_items",
      "custom_project_messages",
      "custom_project_activities",
      "custom_portfolio",
      "custom_showcase_settings",
      "homepage_settings",
      "global_website_settings",
      "homepage_3d_models",
      "product_reviews",
      "payment_sessions",
      "razorpay_webhook_events",
    ];

    const destinationCounts = await Promise.all(
      destinationTables.map(async (table) => [
        table,
        await countSupabaseTable(table),
      ] as const),
    );

    return res.status(200).json({
      success: true,
      readOnly: true,
      generatedAt: new Date().toISOString(),
      firestore: {
        users: usersSnapshot.size,
        usersWithLegalConsent,
        orders: ordersSnapshot.size,
        embeddedOrderItems,
        threeDPrintOrders: printingOrdersSnapshot.size,
        contacts: contactsSnapshot.size,
        services: servicesSnapshot.size,
        customPortfolio: portfolioSnapshot.size,
        customProjects: customProjectsSnapshot.size,
        customProjectQuotations: legacyQuotations,
        embeddedCustomQuotationItems: legacyQuotationItems,
        customProjectSubcollections: projectSubcollections,
        settingsDocuments: {
          homepage: homepageSettingsSnapshot.exists,
          global: globalSettingsSnapshot.exists,
          homepage3DModel: homepage3DSettingsSnapshot.exists,
          customShowcaseDefault: showcaseSettingsSnapshot.exists,
        },
      },
      supabase: Object.fromEntries(destinationCounts),
      notes: [
        "This endpoint is read-only and does not migrate or modify records.",
        "Counts help identify possible gaps but do not prove record-by-record equivalence.",
        "The currently inspected repository has migration endpoints for users, orders, printing, contacts, services, settings, showcase, and quotations; no equivalent product migration endpoint was found.",
      ],
    });
  } catch (error) {
    console.error("Migration audit failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Migration audit failed.",
    });
  }
}
