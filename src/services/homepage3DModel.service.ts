import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { supabase } from "../lib/supabase";

import {
  defaultHomepage3DModel,
  type Homepage3DModel,
} from "../types/homepage3DModel";

export const HOMEPAGE_3D_MODEL_DOCUMENT =
  "homepage3DModel";

export const HOMEPAGE_3D_STORAGE_BUCKET =
  "homepage-3d";

export const HOMEPAGE_3D_STORAGE_FOLDER =
  "current";

export const MAX_HOMEPAGE_3D_FILE_SIZE =
  50 * 1024 * 1024;

const MIN_ROTATION_SPEED = 0.1;

const MAX_ROTATION_SPEED = 2.5;

const MIN_ZOOM_LEVEL = 0.5;

const MAX_ZOOM_LEVEL = 2;

function homepage3DModelRef() {
  return doc(
    db,
    "siteSettings",
    HOMEPAGE_3D_MODEL_DOCUMENT,
  );
}

/*
 * =========================================================
 * NORMALIZE MODEL
 * =========================================================
 */

function normalizeHomepage3DModel(
  data?: Partial<Homepage3DModel>,
): Homepage3DModel {
  const value = data ?? {};

  const rotationSpeed =
    typeof value.rotationSpeed ===
      "number" &&
    Number.isFinite(
      value.rotationSpeed,
    )
      ? Math.min(
          MAX_ROTATION_SPEED,
          Math.max(
            MIN_ROTATION_SPEED,
            value.rotationSpeed,
          ),
        )
      : defaultHomepage3DModel.rotationSpeed;

  const zoomLevel =
    typeof value.zoomLevel ===
      "number" &&
    Number.isFinite(
      value.zoomLevel,
    )
      ? Math.min(
          MAX_ZOOM_LEVEL,
          Math.max(
            MIN_ZOOM_LEVEL,
            value.zoomLevel,
          ),
        )
      : defaultHomepage3DModel.zoomLevel;

  return {
    ...defaultHomepage3DModel,

    ...value,

    id: "current",

    enabled:
      typeof value.enabled ===
      "boolean"
        ? value.enabled
        : defaultHomepage3DModel.enabled,

    title:
      typeof value.title ===
        "string" &&
      value.title.trim()
        ? value.title.trim()
        : defaultHomepage3DModel.title,

    description:
      typeof value.description ===
        "string"
        ? value.description.trim()
        : defaultHomepage3DModel.description,

    fileUrl:
      typeof value.fileUrl ===
        "string"
        ? value.fileUrl
        : "",

    storagePath:
      typeof value.storagePath ===
        "string"
        ? value.storagePath
        : "",

    originalFileName:
      typeof value.originalFileName ===
        "string"
        ? value.originalFileName
        : "",

    rotationEnabled:
      typeof value.rotationEnabled ===
      "boolean"
        ? value.rotationEnabled
        : defaultHomepage3DModel.rotationEnabled,

    rotationSpeed,

    zoomEnabled:
      typeof value.zoomEnabled ===
      "boolean"
        ? value.zoomEnabled
        : defaultHomepage3DModel.zoomEnabled,

    zoomLevel,
  };
}

/*
 * =========================================================
 * GET MODEL
 * =========================================================
 */

export async function getHomepage3DModel(): Promise<Homepage3DModel> {
  const snapshot =
    await getDoc(
      homepage3DModelRef(),
    );

  if (!snapshot.exists()) {
    return defaultHomepage3DModel;
  }

  return normalizeHomepage3DModel(
    snapshot.data() as Partial<Homepage3DModel>,
  );
}

/*
 * =========================================================
 * REAL-TIME LISTENER
 * =========================================================
 */

export function subscribeToHomepage3DModel(
  onChange: (
    model: Homepage3DModel,
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {
  return onSnapshot(
    homepage3DModelRef(),

    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(
          defaultHomepage3DModel,
        );

        return;
      }

      onChange(
        normalizeHomepage3DModel(
          snapshot.data() as Partial<Homepage3DModel>,
        ),
      );
    },

    (error) => {
      console.error(
        "Homepage 3D model listener failed:",
        error,
      );

      onError?.(error);
    },
  );
}

/*
 * =========================================================
 * VALIDATE STL
 * =========================================================
 */

function validateHomepage3DModelFile(
  file: File,
): void {
  if (!file) {
    throw new Error(
      "Please choose an STL file.",
    );
  }

  if (
    !file.name
      .toLowerCase()
      .endsWith(".stl")
  ) {
    throw new Error(
      "Only .stl files are allowed.",
    );
  }

  if (file.size <= 0) {
    throw new Error(
      "The STL file is empty.",
    );
  }

  if (
    file.size >
    MAX_HOMEPAGE_3D_FILE_SIZE
  ) {
    throw new Error(
      "The STL file must be 50 MB or smaller.",
    );
  }
}

/*
 * =========================================================
 * SAFE FILE NAME
 * =========================================================
 */

function createSafeFileName(
  originalName: string,
): string {
  const baseName =
    originalName
      .replace(
        /\.stl$/i,
        "",
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      )
      .slice(0, 80);

  return `${
    baseName || "model"
  }-${Date.now()}.stl`;
}

/*
 * =========================================================
 * UPLOAD STL
 * =========================================================
 */

export async function uploadHomepage3DModelFile(
  file: File,
): Promise<{
  url: string;
  path: string;
  originalFileName: string;
}> {
  validateHomepage3DModelFile(
    file,
  );

  const fileName =
    createSafeFileName(
      file.name,
    );

  const path =
    `${HOMEPAGE_3D_STORAGE_FOLDER}/${fileName}`;

  const {
    error,
  } =
    await supabase.storage
      .from(
        HOMEPAGE_3D_STORAGE_BUCKET,
      )
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          contentType: "model/stl",
          upsert: false,
        },
      );

  if (error) {
    throw new Error(
      error.message ||
        "Unable to upload STL file.",
    );
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        HOMEPAGE_3D_STORAGE_BUCKET,
      )
      .getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error(
      "Unable to generate the STL public URL.",
    );
  }

  return {
    url: data.publicUrl,
    path,
    originalFileName:
      file.name,
  };
}

/*
 * =========================================================
 * DELETE STL
 * =========================================================
 */

export async function deleteHomepage3DModelFile(
  storagePath: string,
): Promise<void> {
  if (!storagePath.trim()) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(
        HOMEPAGE_3D_STORAGE_BUCKET,
      )
      .remove([
        storagePath,
      ]);

  if (error) {
    throw new Error(
      error.message ||
        "Unable to delete STL file.",
    );
  }
}

/*
 * =========================================================
 * SAVE SETTINGS
 * =========================================================
 */

export async function saveHomepage3DModel(
  model: Homepage3DModel,
): Promise<void> {
  const normalized =
    normalizeHomepage3DModel(
      model,
    );

  await setDoc(
    homepage3DModelRef(),
    {
      ...normalized,
      updatedAt:
        serverTimestamp(),
    },
  );
}

/*
 * =========================================================
 * DISABLE MODEL
 * =========================================================
 */

export async function disableHomepage3DModel(): Promise<void> {
  await setDoc(
    homepage3DModelRef(),
    {
      ...defaultHomepage3DModel,
      updatedAt:
        serverTimestamp(),
    },
  );
}