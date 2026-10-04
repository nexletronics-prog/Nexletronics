import { supabase } from "../lib/supabase";

import type {
  PrintingMaterialConfig,
  PrintingOrder,
  PrintingSettings,
} from "../types/printing";

const PRINTING_SETTINGS_ID = "default";
const PRINTING_SETTINGS_TABLE = "printing_settings";
const PRINTING_ORDERS_TABLE = "printing_orders";

export const defaultPrintingMaterials: PrintingMaterialConfig[] = [
  {
    id: "pla",
    name: "PLA",
    pricePerGram: 2.5,
    densityGramsPerCm3: 1.24,
    active: true,
    description: "Easy to print and ideal for general prototypes.",
  },
  {
    id: "petg",
    name: "PETG",
    pricePerGram: 3,
    densityGramsPerCm3: 1.27,
    active: true,
    description: "Stronger and more durable than standard PLA.",
  },
  {
    id: "tpu",
    name: "TPU",
    pricePerGram: 4,
    densityGramsPerCm3: 1.21,
    active: true,
    description: "Flexible material for soft and impact-resistant parts.",
  },
];

export const defaultPrintingSettings: PrintingSettings = {
  printerName: "Bambu Lab A1",
  buildWidth: 256,
  buildDepth: 256,
  buildHeight: 256,
  materials: defaultPrintingMaterials,
  roughMultiplier: 1,
  premiumMultiplier: 1.5,
  machineRatePerHour: 30,
  minimumPrintCharge: 100,
  setupFee: 0,
  packagingFee: 0,
  deliveryFee: 0,
};

interface PrintingSettingsRow {
  id: string;
  printer_name: string | null;
  build_width: number | string | null;
  build_depth: number | string | null;
  build_height: number | string | null;
  materials: unknown;
  rough_multiplier: number | string | null;
  premium_multiplier: number | string | null;
  machine_rate_per_hour: number | string | null;
  minimum_print_charge: number | string | null;
  setup_fee: number | string | null;
  packaging_fee: number | string | null;
  delivery_fee: number | string | null;
  updated_at: string | null;
}

interface PrintingOrderRow {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  original_file_name: string;
  storage_path: string;
  material: string;
  finish: string;
  quantity: number;
  dimensions: unknown;
  volume_cm3: number | string | null;
  estimated_weight_grams: number | string | null;
  estimated_print_time_minutes: number | string | null;
  estimate: unknown;
  estimated_price: number | string;
  final_price: number | string | null;
  status: string;
  payment_status: string;
  admin_notes: string | null;
  customer_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function numberOrDefault(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeMaterials(value: unknown): PrintingMaterialConfig[] {
  if (!Array.isArray(value)) {
    return defaultPrintingMaterials.map((item) => ({ ...item }));
  }

  const materials = value
    .filter((item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      id: typeof item.id === "string" ? item.id.trim() : "",
      name: typeof item.name === "string" ? item.name.trim() : "",
      pricePerGram: Math.max(0, numberOrDefault(item.pricePerGram, 0)),
      densityGramsPerCm3: Math.max(
        0.01,
        numberOrDefault(item.densityGramsPerCm3, 1.24),
      ),
      active: item.active !== false,
      description:
        typeof item.description === "string" ? item.description.trim() : "",
    }))
    .filter((item) => Boolean(item.id) && Boolean(item.name));

  return materials.length > 0
    ? materials
    : defaultPrintingMaterials.map((item) => ({ ...item }));
}

function normalizePrintingSettings(
  raw: Record<string, unknown>,
): PrintingSettings {
  return {
    ...defaultPrintingSettings,
    printerName:
      typeof raw.printerName === "string" && raw.printerName.trim()
        ? raw.printerName.trim()
        : defaultPrintingSettings.printerName,
    buildWidth: numberOrDefault(raw.buildWidth, defaultPrintingSettings.buildWidth),
    buildDepth: numberOrDefault(raw.buildDepth, defaultPrintingSettings.buildDepth),
    buildHeight: numberOrDefault(raw.buildHeight, defaultPrintingSettings.buildHeight),
    materials: normalizeMaterials(raw.materials),
    roughMultiplier: Math.max(
      0,
      numberOrDefault(raw.roughMultiplier, defaultPrintingSettings.roughMultiplier),
    ),
    premiumMultiplier: Math.max(
      0,
      numberOrDefault(raw.premiumMultiplier, defaultPrintingSettings.premiumMultiplier),
    ),
    machineRatePerHour: Math.max(
      0,
      numberOrDefault(raw.machineRatePerHour, defaultPrintingSettings.machineRatePerHour),
    ),
    minimumPrintCharge: Math.max(
      0,
      numberOrDefault(raw.minimumPrintCharge, defaultPrintingSettings.minimumPrintCharge),
    ),
    setupFee: Math.max(0, numberOrDefault(raw.setupFee, defaultPrintingSettings.setupFee)),
    packagingFee: Math.max(
      0,
      numberOrDefault(raw.packagingFee, defaultPrintingSettings.packagingFee),
    ),
    deliveryFee: Math.max(
      0,
      numberOrDefault(raw.deliveryFee, defaultPrintingSettings.deliveryFee),
    ),
    updatedAt: raw.updatedAt,
  };
}

function normalizeSettingsRow(row: PrintingSettingsRow): PrintingSettings {
  return normalizePrintingSettings({
    printerName: row.printer_name,
    buildWidth: row.build_width,
    buildDepth: row.build_depth,
    buildHeight: row.build_height,
    materials: row.materials,
    roughMultiplier: row.rough_multiplier,
    premiumMultiplier: row.premium_multiplier,
    machineRatePerHour: row.machine_rate_per_hour,
    minimumPrintCharge: row.minimum_print_charge,
    setupFee: row.setup_fee,
    packagingFee: row.packaging_fee,
    deliveryFee: row.delivery_fee,
    updatedAt: row.updated_at,
  });
}

function normalizeDimensions(value: unknown): PrintingOrder["dimensions"] {
  const raw = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

  return {
    width: numberOrDefault(raw.width, 0),
    depth: numberOrDefault(raw.depth, 0),
    height: numberOrDefault(raw.height, 0),
  };
}

function normalizeOrderRow(row: PrintingOrderRow): PrintingOrder {
  const status = [
    "pending",
    "reviewing",
    "quoted",
    "payment_pending",
    "paid",
    "approved",
    "printing",
    "quality_check",
    "ready",
    "completed",
    "rejected",
    "cancelled",
  ].includes(row.status)
    ? (row.status as PrintingOrder["status"])
    : "pending";

  const paymentStatus = [
    "unpaid",
    "pending",
    "paid",
    "failed",
    "refunded",
  ].includes(row.payment_status)
    ? (row.payment_status as PrintingOrder["paymentStatus"])
    : "unpaid";

  const finish = row.finish === "premium" ? "premium" : "rough";

  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name || "Customer",
    customerEmail: row.customer_email || "",
    originalFileName: row.original_file_name || "model.stl",
    storagePath: row.storage_path || "",
    material: row.material || "pla",
    finish,
    quantity: Math.max(1, Math.round(numberOrDefault(row.quantity, 1))),
    dimensions: normalizeDimensions(row.dimensions),
    volumeCm3:
      row.volume_cm3 === null ? undefined : numberOrDefault(row.volume_cm3, 0),
    estimatedWeightGrams:
      row.estimated_weight_grams === null
        ? undefined
        : numberOrDefault(row.estimated_weight_grams, 0),
    estimatedPrintTimeMinutes:
      row.estimated_print_time_minutes === null
        ? undefined
        : numberOrDefault(row.estimated_print_time_minutes, 0),
    estimate: row.estimate as PrintingOrder["estimate"],
    estimatedPrice: numberOrDefault(row.estimated_price, 0),
    finalPrice:
      row.final_price === null ? undefined : numberOrDefault(row.final_price, 0),
    status,
    paymentStatus,
    adminNotes: row.admin_notes || "",
    customerNotes: row.customer_notes || "",
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

function mapOrderToRow(
  order: Omit<PrintingOrder, "id">,
  id: string,
) {
  return {
    id,
    user_id: order.userId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    original_file_name: order.originalFileName,
    storage_path: order.storagePath,
    material: order.material,
    finish: order.finish,
    quantity: Math.max(1, Math.round(order.quantity)),
    dimensions: order.dimensions,
    volume_cm3: order.volumeCm3 ?? null,
    estimated_weight_grams: order.estimatedWeightGrams ?? null,
    estimated_print_time_minutes: order.estimatedPrintTimeMinutes ?? null,
    estimate: order.estimate ?? null,
    estimated_price: order.estimatedPrice,
    final_price: order.finalPrice ?? null,
    status: order.status,
    payment_status: order.paymentStatus,
    admin_notes: order.adminNotes ?? "",
    customer_notes: order.customerNotes ?? "",
  };
}

function createPrintingOrderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `print-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getPrintingSettings(): Promise<PrintingSettings> {
  const { data, error } = await supabase
    .from(PRINTING_SETTINGS_TABLE)
    .select("*")
    .eq("id", PRINTING_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    console.error("Unable to load printing settings:", error);
    return {
      ...defaultPrintingSettings,
      materials: defaultPrintingMaterials.map((item) => ({ ...item })),
    };
  }

  if (!data) {
    return {
      ...defaultPrintingSettings,
      materials: defaultPrintingMaterials.map((item) => ({ ...item })),
    };
  }

  return normalizeSettingsRow(data as PrintingSettingsRow);
}

export function subscribePrintingSettings(
  callback: (settings: PrintingSettings) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;

  void getPrintingSettings()
    .then((settings) => {
      if (active) callback(settings);
    })
    .catch((error: unknown) => {
      if (!active) return;
      const normalized = error instanceof Error
        ? error
        : new Error("Unable to load printing settings.");
      callback({
        ...defaultPrintingSettings,
        materials: defaultPrintingMaterials.map((item) => ({ ...item })),
      });
      onError?.(normalized);
    });

  const channel = supabase
    .channel("printing-settings-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: PRINTING_SETTINGS_TABLE,
        filter: `id=eq.${PRINTING_SETTINGS_ID}`,
      },
      (payload) => {
        if (!active) return;
        const next = payload.new as PrintingSettingsRow;
        if (!next || !next.id) return;
        callback(normalizeSettingsRow(next));
      },
    )
    .subscribe((status, error) => {
      if (!active) return;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(
          error instanceof Error
            ? error
            : new Error("Realtime printing settings connection failed."),
        );
      }
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function savePrintingSettings(
  settings: PrintingSettings,
): Promise<void> {
  const clean = normalizePrintingSettings(
    settings as PrintingSettings & Record<string, unknown>,
  );

  const { error } = await supabase
    .from(PRINTING_SETTINGS_TABLE)
    .upsert(
      {
        id: PRINTING_SETTINGS_ID,
        printer_name: clean.printerName,
        build_width: clean.buildWidth,
        build_depth: clean.buildDepth,
        build_height: clean.buildHeight,
        materials: clean.materials,
        rough_multiplier: clean.roughMultiplier,
        premium_multiplier: clean.premiumMultiplier,
        machine_rate_per_hour: clean.machineRatePerHour,
        minimum_print_charge: clean.minimumPrintCharge,
        setup_fee: clean.setupFee,
        packaging_fee: clean.packagingFee,
        delivery_fee: clean.deliveryFee,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function createPrintingOrder(
  order: Omit<PrintingOrder, "id">,
): Promise<string> {
  if (!order.userId.trim()) {
    throw new Error("A signed-in user is required for a printing order.");
  }

  const id = createPrintingOrderId();
  const row = mapOrderToRow(order, id);

  const { error } = await supabase
    .from(PRINTING_ORDERS_TABLE)
    .insert(row);

  if (error) {
    throw new Error(error.message);
  }

  return id;
}

export async function getAllPrintingOrders(): Promise<PrintingOrder[]> {
  const { data, error } = await supabase
    .from(PRINTING_ORDERS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PrintingOrderRow[] | null ?? []).map(normalizeOrderRow);
}

export async function getPrintingOrdersForUser(
  userId: string,
): Promise<PrintingOrder[]> {
  if (!userId.trim()) return [];

  const { data, error } = await supabase
    .from(PRINTING_ORDERS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PrintingOrderRow[] | null ?? []).map(normalizeOrderRow);
}

export function subscribePrintingOrders(
  userId: string,
  callback: (orders: PrintingOrder[]) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;

  if (!userId.trim()) {
    callback([]);
    return () => {
      active = false;
    };
  }

  void getPrintingOrdersForUser(userId)
    .then((orders) => {
      if (active) callback(orders);
    })
    .catch((error: unknown) => {
      if (!active) return;
      onError?.(
        error instanceof Error
          ? error
          : new Error("Unable to load your printing orders."),
      );
    });

  const channel = supabase
    .channel(`printing-orders-user-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: PRINTING_ORDERS_TABLE,
        filter: `user_id=eq.${userId}`,
      },
      () => {
        void getPrintingOrdersForUser(userId)
          .then((orders) => {
            if (active) callback(orders);
          })
          .catch((error: unknown) => {
            if (!active) return;
            onError?.(
              error instanceof Error
                ? error
                : new Error("Unable to refresh your printing orders."),
            );
          });
      },
    )
    .subscribe((status, error) => {
      if (!active) return;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(
          error instanceof Error
            ? error
            : new Error("Realtime printing orders connection failed."),
        );
      }
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function updatePrintingOrder(
  id: string,
  data: Partial<Omit<PrintingOrder, "id">>,
): Promise<void> {
  if (!id.trim()) {
    throw new Error("Printing order ID is required.");
  }

  const patch: Record<string, unknown> = {};

  if (data.userId !== undefined) patch.user_id = data.userId;
  if (data.customerName !== undefined) patch.customer_name = data.customerName;
  if (data.customerEmail !== undefined) patch.customer_email = data.customerEmail;
  if (data.originalFileName !== undefined) patch.original_file_name = data.originalFileName;
  if (data.storagePath !== undefined) patch.storage_path = data.storagePath;
  if (data.material !== undefined) patch.material = data.material;
  if (data.finish !== undefined) patch.finish = data.finish;
  if (data.quantity !== undefined) patch.quantity = Math.max(1, Math.round(data.quantity));
  if (data.dimensions !== undefined) patch.dimensions = data.dimensions;
  if (data.volumeCm3 !== undefined) patch.volume_cm3 = data.volumeCm3 ?? null;
  if (data.estimatedWeightGrams !== undefined) patch.estimated_weight_grams = data.estimatedWeightGrams ?? null;
  if (data.estimatedPrintTimeMinutes !== undefined) patch.estimated_print_time_minutes = data.estimatedPrintTimeMinutes ?? null;
  if (data.estimate !== undefined) patch.estimate = data.estimate ?? null;
  if (data.estimatedPrice !== undefined) patch.estimated_price = data.estimatedPrice;
  if (data.finalPrice !== undefined) patch.final_price = data.finalPrice ?? null;
  if (data.status !== undefined) patch.status = data.status;
  if (data.paymentStatus !== undefined) patch.payment_status = data.paymentStatus;
  if (data.adminNotes !== undefined) patch.admin_notes = data.adminNotes ?? "";
  if (data.customerNotes !== undefined) patch.customer_notes = data.customerNotes ?? "";

  patch.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from(PRINTING_ORDERS_TABLE)
    .update(patch)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
