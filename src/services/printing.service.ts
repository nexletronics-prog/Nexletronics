import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  PrintingOrder,
  PrintingSettings,
} from "../types/printing";


const PRINTING_SETTINGS_COLLECTION =
  "printingSettings";

const PRINTING_SETTINGS_ID =
  "default";

const PRINTING_ORDERS_COLLECTION =
  "threeDPrintOrders";


/*
 * ==========================================================
 * DEFAULT MATERIALS
 * ==========================================================
 */

export const defaultPrintingMaterials = [

  {
    id:
      "pla",

    name:
      "PLA",

    pricePerGram:
      2.5,

    densityGramsPerCm3:
      1.24,

    active:
      true,

    description:
      "Easy to print and ideal for general prototypes.",
  },

  {
    id:
      "petg",

    name:
      "PETG",

    pricePerGram:
      3,

    densityGramsPerCm3:
      1.27,

    active:
      true,

    description:
      "Stronger and more durable than standard PLA.",
  },

  {
    id:
      "tpu",

    name:
      "TPU",

    pricePerGram:
      4,

    densityGramsPerCm3:
      1.21,

    active:
      true,

    description:
      "Flexible material for soft and impact-resistant parts.",
  },

];


/*
 * ==========================================================
 * DEFAULT SETTINGS
 * ==========================================================
 */

export const defaultPrintingSettings:
  PrintingSettings = {

  printerName:
    "Bambu Lab A1",

  buildWidth:
    256,

  buildDepth:
    256,

  buildHeight:
    256,

  materials:
    defaultPrintingMaterials,

  roughMultiplier:
    1,

  premiumMultiplier:
    1.5,

  machineRatePerHour:
    30,

  minimumPrintCharge:
    100,

  setupFee:
    0,

  packagingFee:
    0,

  deliveryFee:
    0,

};


/*
 * ==========================================================
 * NORMALIZE MATERIALS
 * ==========================================================
 */

function normalizeMaterials(
  value:
    unknown,
) {

  if (
    !Array.isArray(
      value,
    )
  ) {

    return [
      ...defaultPrintingMaterials,
    ];

  }


  const materials =
    value
      .filter(
        (
          material,
        ) =>
          Boolean(
            material,
          ) &&
          typeof material ===
            "object",
      )
      .map(
        (
          material,
        ) =>
          material as {
            id?: unknown;

            name?: unknown;

            pricePerGram?: unknown;

            densityGramsPerCm3?: unknown;

            active?: unknown;

            description?: unknown;
          },
      )
      .filter(
        (
          material,
        ) =>
          typeof material.id ===
            "string" &&
          typeof material.name ===
            "string",
      )
      .map(
        (
          material,
        ) => ({

          id:
            String(
              material.id,
            ),

          name:
            String(
              material.name,
            ),

          pricePerGram:
            Number.isFinite(
              Number(
                material.pricePerGram,
              ),
            )
              ? Math.max(
                  0,
                  Number(
                    material.pricePerGram,
                  ),
                )
              : 0,

          densityGramsPerCm3:
            Number.isFinite(
              Number(
                material.densityGramsPerCm3,
              ),
            )
              ? Math.max(
                  0.01,
                  Number(
                    material.densityGramsPerCm3,
                  ),
                )
              : 1.24,

          active:
            material.active !==
            false,

          description:
            typeof material.description ===
              "string"
              ? material.description
              : "",

        }),
      );


  if (
    materials.length ===
    0
  ) {

    return [
      ...defaultPrintingMaterials,
    ];

  }


  return materials;
}


/*
 * ==========================================================
 * NORMALIZE SETTINGS
 * ==========================================================
 */

function normalizePrintingSettings(
  raw:
    Partial<PrintingSettings>,
): PrintingSettings {

  return {

    ...defaultPrintingSettings,

    ...raw,

    printerName:
      typeof raw.printerName ===
        "string" &&
      raw.printerName.trim()
        ? raw.printerName
        : defaultPrintingSettings.printerName,

    buildWidth:
      Number.isFinite(
        Number(
          raw.buildWidth,
        ),
      )
        ? Number(
            raw.buildWidth,
          )
        : defaultPrintingSettings.buildWidth,

    buildDepth:
      Number.isFinite(
        Number(
          raw.buildDepth,
        ),
      )
        ? Number(
            raw.buildDepth,
          )
        : defaultPrintingSettings.buildDepth,

    buildHeight:
      Number.isFinite(
        Number(
          raw.buildHeight,
        ),
      )
        ? Number(
            raw.buildHeight,
          )
        : defaultPrintingSettings.buildHeight,

    roughMultiplier:
      Number.isFinite(
        Number(
          raw.roughMultiplier,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.roughMultiplier,
            ),
          )
        : defaultPrintingSettings.roughMultiplier,

    premiumMultiplier:
      Number.isFinite(
        Number(
          raw.premiumMultiplier,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.premiumMultiplier,
            ),
          )
        : defaultPrintingSettings.premiumMultiplier,

    machineRatePerHour:
      Number.isFinite(
        Number(
          raw.machineRatePerHour,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.machineRatePerHour,
            ),
          )
        : defaultPrintingSettings.machineRatePerHour,

    minimumPrintCharge:
      Number.isFinite(
        Number(
          raw.minimumPrintCharge,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.minimumPrintCharge,
            ),
          )
        : defaultPrintingSettings.minimumPrintCharge,

    setupFee:
      Number.isFinite(
        Number(
          raw.setupFee,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.setupFee,
            ),
          )
        : defaultPrintingSettings.setupFee,

    packagingFee:
      Number.isFinite(
        Number(
          raw.packagingFee,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.packagingFee,
            ),
          )
        : defaultPrintingSettings.packagingFee,

    deliveryFee:
      Number.isFinite(
        Number(
          raw.deliveryFee,
        ),
      )
        ? Math.max(
            0,
            Number(
              raw.deliveryFee,
            ),
          )
        : defaultPrintingSettings.deliveryFee,

    materials:
      normalizeMaterials(
        raw.materials,
      ),

  };
}


/*
 * ==========================================================
 * GET SETTINGS
 * ==========================================================
 *
 * One-time read.
 *
 * Kept for compatibility with existing code.
 */

export async function getPrintingSettings():
  Promise<PrintingSettings> {

  try {

    const settingsRef =
      doc(
        db,
        PRINTING_SETTINGS_COLLECTION,
        PRINTING_SETTINGS_ID,
      );


    const snapshot =
      await getDoc(
        settingsRef,
      );


    if (
      !snapshot.exists()
    ) {

      return {

        ...defaultPrintingSettings,

        materials:
          [
            ...defaultPrintingMaterials,
          ],

      };

    }


    return normalizePrintingSettings(
      snapshot.data() as
        Partial<PrintingSettings>,
    );

  } catch (
    error
  ) {

    console.error(
      "Unable to load printing settings. Using defaults.",
      error,
    );


    return {

      ...defaultPrintingSettings,

      materials:
        [
          ...defaultPrintingMaterials,
        ],

    };

  }
}


/*
 * ==========================================================
 * REALTIME SETTINGS
 * ==========================================================
 *
 * Public 3D-printing page uses this listener.
 *
 * Firestore:
 *
 * printingSettings/default
 *
 */

export function subscribePrintingSettings(
  callback: (
    settings:
      PrintingSettings,
  ) => void,

  onError?: (
    error:
      Error,
  ) => void,
): () => void {

  const settingsRef =
    doc(
      db,
      PRINTING_SETTINGS_COLLECTION,
      PRINTING_SETTINGS_ID,
    );


  return onSnapshot(
    settingsRef,

    (
      snapshot,
    ) => {

      if (
        !snapshot.exists()
      ) {

        callback({

          ...defaultPrintingSettings,

          materials:
            [
              ...defaultPrintingMaterials,
            ],

        });

        return;

      }


      const normalized =
        normalizePrintingSettings(
          snapshot.data() as
            Partial<PrintingSettings>,
        );


      callback(
        normalized,
      );

    },

    (
      firebaseError,
    ) => {

      console.error(
        "Realtime printing settings listener failed:",
        firebaseError,
      );


      /*
       * Important:
       *
       * The public page still remains usable using defaults.
       */

      callback({

        ...defaultPrintingSettings,

        materials:
          [
            ...defaultPrintingMaterials,
          ],

      });


      if (
        onError
      ) {

        onError(
          firebaseError,
        );

      }

    },
  );
}


/*
 * ==========================================================
 * SAVE SETTINGS
 * ==========================================================
 */

export async function savePrintingSettings(
  settings:
    PrintingSettings,
): Promise<void> {

  const settingsRef =
    doc(
      db,
      PRINTING_SETTINGS_COLLECTION,
      PRINTING_SETTINGS_ID,
    );


  const cleanSettings =
    normalizePrintingSettings(
      settings,
    );


  await setDoc(
    settingsRef,

    {
      ...cleanSettings,

      updatedAt:
        serverTimestamp(),
    },

    {
      merge:
        true,
    },
  );
}


/*
 * ==========================================================
 * CREATE PRINTING ORDER
 * ==========================================================
 */

export async function createPrintingOrder(
  order:
    Omit<
      PrintingOrder,
      "id"
    >,
): Promise<string> {

  const document =
    await addDoc(
      collection(
        db,
        PRINTING_ORDERS_COLLECTION,
      ),

      {
        ...order,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );


  return document.id;
}


/*
 * ==========================================================
 * UPDATE PRINTING ORDER
 * ==========================================================
 */

export async function getAllPrintingOrders(): Promise<PrintingOrder[]> {
  const snapshot = await getDocs(
    collection(
      db,
      PRINTING_ORDERS_COLLECTION,
    ),
  );

  const toMillis = (value: unknown): number => {
    if (value instanceof Date) {
      return value.getTime();
    }

    if (value && typeof value === "object") {
      const item = value as {
        toMillis?: unknown;
        toDate?: unknown;
        seconds?: unknown;
      };

      if (typeof item.toMillis === "function") {
        return Number(
          (item.toMillis as () => unknown)(),
        ) || 0;
      }

      if (typeof item.toDate === "function") {
        const date = (
          item.toDate as () => unknown
        )();

        if (date instanceof Date) {
          return date.getTime();
        }
      }

      if (item.seconds !== undefined) {
        return Number(item.seconds) * 1000 || 0;
      }
    }

    const parsed = new Date(
      String(value ?? ""),
    ).getTime();

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  };

  return snapshot.docs
    .map(
      (document) => ({
        id: document.id,
        ...(document.data() as Omit<PrintingOrder, "id">),
      }),
    )
    .sort(
      (a, b) =>
        toMillis(b.createdAt) -
        toMillis(a.createdAt),
    );
}

export async function updatePrintingOrder(
  id:
    string,

  data:
    Partial<
      Omit<
        PrintingOrder,
        "id"
      >
    >,
): Promise<void> {

  if (
    !id.trim()
  ) {

    throw new Error(
      "Printing order ID is required.",
    );

  }


  await updateDoc(
    doc(
      db,
      PRINTING_ORDERS_COLLECTION,
      id,
    ),

    {
      ...data,

      updatedAt:
        serverTimestamp(),
    },
  );
}