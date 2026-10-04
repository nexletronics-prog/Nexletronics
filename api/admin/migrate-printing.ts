import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldPath } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../_lib/firebase-admin.mjs";

const firestoreSettingsPath = "printingSettings";
const firestoreSettingsId = "default";
const firestoreOrdersPath = "threeDPrintOrders";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseRequest(
  path: string,
  init: RequestInit,
): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${response.status}: ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function jsonNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function firestoreTimestampToIso(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    const item = value as {
      toDate?: unknown;
      seconds?: unknown;
    };

    if (typeof item.toDate === "function") {
      const date = (item.toDate as () => unknown)();
      if (date instanceof Date) return date.toISOString();
    }

    if (typeof item.seconds === "number") {
      return new Date(item.seconds * 1000).toISOString();
    }
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }

  return null;
}

function normalizeOrder(id: string, raw: Record<string, unknown>) {
  const dimensions = raw.dimensions && typeof raw.dimensions === "object"
    ? raw.dimensions
    : { width: 0, depth: 0, height: 0 };

  return {
    id,
    user_id: cleanText(raw.userId),
    customer_name: cleanText(raw.customerName) || "Customer",
    customer_email: cleanText(raw.customerEmail),
    original_file_name: cleanText(raw.originalFileName) || "model.stl",
    storage_path: cleanText(raw.storagePath),
    material: cleanText(raw.material) || "pla",
    finish: raw.finish === "premium" ? "premium" : "rough",
    quantity: Math.max(1, Math.round(jsonNumber(raw.quantity) ?? 1)),
    dimensions,
    volume_cm3: jsonNumber(raw.volumeCm3),
    estimated_weight_grams: jsonNumber(raw.estimatedWeightGrams),
    estimated_print_time_minutes: jsonNumber(raw.estimatedPrintTimeMinutes),
    estimate: raw.estimate ?? null,
    estimated_price: jsonNumber(raw.estimatedPrice) ?? 0,
    final_price: jsonNumber(raw.finalPrice),
    status: cleanText(raw.status) || "pending",
    payment_status: cleanText(raw.paymentStatus) || "unpaid",
    admin_notes: cleanText(raw.adminNotes),
    customer_notes: cleanText(raw.customerNotes),
    created_at: firestoreTimestampToIso(raw.createdAt),
    updated_at: firestoreTimestampToIso(raw.updatedAt),
  };
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

    const decoded = await adminAuth.verifyIdToken(authorization.slice(7).trim());
    if (decoded.is_admin !== true) {
      return res.status(403).json({ success: false, error: "Administrator access required." });
    }

    const settingsSnapshot = await adminDb
      .collection(firestoreSettingsPath)
      .doc(firestoreSettingsId)
      .get();

    if (settingsSnapshot.exists) {
      const raw = settingsSnapshot.data() ?? {};
      await supabaseRequest("printing_settings", {
        method: "POST",
        body: JSON.stringify({
          id: "default",
          printer_name: cleanText(raw.printerName) || "Bambu Lab A1",
          build_width: jsonNumber(raw.buildWidth) ?? 256,
          build_depth: jsonNumber(raw.buildDepth) ?? 256,
          build_height: jsonNumber(raw.buildHeight) ?? 256,
          materials: Array.isArray(raw.materials) ? raw.materials : [],
          rough_multiplier: jsonNumber(raw.roughMultiplier) ?? 1,
          premium_multiplier: jsonNumber(raw.premiumMultiplier) ?? 1.5,
          machine_rate_per_hour: jsonNumber(raw.machineRatePerHour) ?? 30,
          minimum_print_charge: jsonNumber(raw.minimumPrintCharge) ?? 100,
          setup_fee: jsonNumber(raw.setupFee) ?? 0,
          packaging_fee: jsonNumber(raw.packagingFee) ?? 0,
          delivery_fee: jsonNumber(raw.deliveryFee) ?? 0,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    const snapshot = await adminDb
      .collection(firestoreOrdersPath)
      .orderBy(FieldPath.documentId())
      .get();

    const rows = snapshot.docs.map((document) => normalizeOrder(document.id, document.data() as Record<string, unknown>));

    if (rows.length > 0) {
      await supabaseRequest("printing_orders", {
        method: "POST",
        body: JSON.stringify(rows),
      });
    }

    return res.status(200).json({
      success: true,
      settingsMigrated: settingsSnapshot.exists,
      ordersMigrated: rows.length,
    });
  } catch (error) {
    console.error("Printing migration failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Printing migration failed.",
    });
  }
}
