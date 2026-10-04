import { supabase } from "../lib/supabase";
import {
  defaultHomepage3DModel,
  type Homepage3DModel,
} from "../types/homepage3DModel";

export const HOMEPAGE_3D_MODEL_DOCUMENT = "current";
export const HOMEPAGE_3D_MODEL_STORAGE_FOLDER = "homepage-3d";
export const HOMEPAGE_3D_MODEL_BUCKET = "homepage-3d";
export const MAX_HOMEPAGE_3D_FILE_SIZE = 50 * 1024 * 1024;

const MODEL_TABLE = "homepage_3d_models";
const MODEL_ID = "current";

interface ModelRow {
  id: string;
  enabled: boolean | null;
  title: string | null;
  description: string | null;
  file_url: string | null;
  storage_path: string | null;
  original_file_name: string | null;
  rotation_enabled: boolean | null;
  rotation_speed: number | null;
  zoom_enabled: boolean | null;
  zoom_level: number | null;
  updated_at: string | null;
}

const MODEL_COLUMNS = `
  id,
  enabled,
  title,
  description,
  file_url,
  storage_path,
  original_file_name,
  rotation_enabled,
  rotation_speed,
  zoom_enabled,
  zoom_level,
  updated_at
`;

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeHomepage3DModel(row?: Partial<ModelRow> | null): Homepage3DModel {
  if (!row) return { ...defaultHomepage3DModel };

  return {
    ...defaultHomepage3DModel,
    id: "current",
    enabled:
      typeof row.enabled === "boolean"
        ? row.enabled
        : defaultHomepage3DModel.enabled,
    title:
      typeof row.title === "string" && row.title.trim()
        ? row.title.trim()
        : defaultHomepage3DModel.title,
    description:
      typeof row.description === "string"
        ? row.description.trim()
        : defaultHomepage3DModel.description,
    fileUrl: typeof row.file_url === "string" ? row.file_url : "",
    storagePath: typeof row.storage_path === "string" ? row.storage_path : "",
    originalFileName:
      typeof row.original_file_name === "string"
        ? row.original_file_name
        : "",
    rotationEnabled:
      typeof row.rotation_enabled === "boolean"
        ? row.rotation_enabled
        : defaultHomepage3DModel.rotationEnabled,
    rotationSpeed: clampNumber(
      row.rotation_speed,
      defaultHomepage3DModel.rotationSpeed,
      0.1,
      2.5,
    ),
    zoomEnabled:
      typeof row.zoom_enabled === "boolean"
        ? row.zoom_enabled
        : defaultHomepage3DModel.zoomEnabled,
    zoomLevel: clampNumber(
      row.zoom_level,
      defaultHomepage3DModel.zoomLevel,
      0.5,
      2,
    ),
    updatedAt: row.updated_at ?? undefined,
  };
}

function toRow(model: Homepage3DModel) {
  return {
    id: MODEL_ID,
    enabled: Boolean(model.enabled),
    title: model.title.trim() || defaultHomepage3DModel.title,
    description: model.description.trim(),
    file_url: model.fileUrl.trim(),
    storage_path: model.storagePath.trim(),
    original_file_name: model.originalFileName.trim(),
    rotation_enabled: Boolean(model.rotationEnabled),
    rotation_speed: clampNumber(
      model.rotationSpeed,
      defaultHomepage3DModel.rotationSpeed,
      0.1,
      2.5,
    ),
    zoom_enabled: Boolean(model.zoomEnabled),
    zoom_level: clampNumber(
      model.zoomLevel,
      defaultHomepage3DModel.zoomLevel,
      0.5,
      2,
    ),
  };
}

export async function getHomepage3DModel(): Promise<Homepage3DModel> {
  const { data, error } = await supabase
    .from(MODEL_TABLE)
    .select(MODEL_COLUMNS)
    .eq("id", MODEL_ID)
    .maybeSingle();

  if (error) {
    console.error("Failed to load homepage 3D model:", error);
    return { ...defaultHomepage3DModel };
  }

  return normalizeHomepage3DModel((data ?? null) as ModelRow | null);
}

export function subscribeToHomepage3DModel(
  onChange: (model: Homepage3DModel) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;

  void getHomepage3DModel()
    .then((model) => {
      if (active) onChange(model);
    })
    .catch((error) => {
      if (!active) return;
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      onError?.(normalized);
    });

  const channel = supabase
    .channel(`homepage-3d-model-${MODEL_ID}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: MODEL_TABLE,
        filter: `id=eq.${MODEL_ID}`,
      },
      (payload) => {
        if (!active) return;

        if (payload.eventType === "DELETE") {
          onChange({ ...defaultHomepage3DModel });
          return;
        }

        onChange(normalizeHomepage3DModel(payload.new as ModelRow));
      },
    )
    .subscribe((status) => {
      if (!active) return;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(new Error(`Homepage 3D model realtime channel: ${status}.`));
      }
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

function validateHomepage3DModelFile(file: File): void {
  if (!file) throw new Error("Please choose an STL file.");
  if (!file.name.toLowerCase().endsWith(".stl")) {
    throw new Error("Only .stl files are allowed.");
  }
  if (file.size <= 0) throw new Error("The STL file is empty.");
  if (file.size > MAX_HOMEPAGE_3D_FILE_SIZE) {
    throw new Error("The STL file must be 50 MB or smaller.");
  }
}

function createSafeFileName(originalName: string): string {
  const baseName = originalName
    .replace(/\.stl$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${baseName || "model"}-${Date.now()}.stl`;
}

export async function uploadHomepage3DModelFile(
  file: File,
): Promise<{
  url: string;
  path: string;
  originalFileName: string;
}> {
  validateHomepage3DModelFile(file);

  const fileName = createSafeFileName(file.name);
  const path = `${HOMEPAGE_3D_MODEL_STORAGE_FOLDER}/current/${fileName}`;

  const { error } = await supabase.storage
    .from(HOMEPAGE_3D_MODEL_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: "model/stl",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(HOMEPAGE_3D_MODEL_BUCKET)
    .getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    originalFileName: file.name,
  };
}

export async function deleteHomepage3DModelFile(
  storagePath: string,
): Promise<void> {
  const cleanPath = storagePath.trim();
  if (!cleanPath) return;

  const { error } = await supabase.storage
    .from(HOMEPAGE_3D_MODEL_BUCKET)
    .remove([cleanPath]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveHomepage3DModel(
  model: Homepage3DModel,
): Promise<void> {
  const normalized = normalizeHomepage3DModel(toRow(model));

  const { error } = await supabase
    .from(MODEL_TABLE)
    .upsert(toRow(normalized));

  if (error) {
    console.error("Failed to save homepage 3D model:", error);
    throw new Error(error.message);
  }
}

export async function disableHomepage3DModel(): Promise<void> {
  const disabledModel: Homepage3DModel = {
    ...defaultHomepage3DModel,
    enabled: false,
  };

  await saveHomepage3DModel(disabledModel);
}
