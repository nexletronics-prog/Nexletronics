import { auth } from "../firebase/config";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL in .env.local");
}

const FUNCTION_URL = `${supabaseUrl}/functions/v1/printing-upload`;

interface DownloadResponse {
  success?: boolean;
  url?: string;
  error?: string;
}

export async function getPrintingFileDownloadUrl(storagePath: string): Promise<string> {
  if (!storagePath.trim()) {
    throw new Error("STL storage path is missing.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in again.");
  }

  const token = await user.getIdToken(true);
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "download-stl", path: storagePath }),
  });

  let result: DownloadResponse = {};
  try {
    result = (await response.json()) as DownloadResponse;
  } catch {
    throw new Error(`Unable to parse STL download response (HTTP ${response.status}).`);
  }

  if (response.status === 401) {
    throw new Error("Your Firebase session is invalid or expired.");
  }
  if (response.status === 403) {
    throw new Error("Administrator access is required.");
  }
  if (!response.ok) {
    throw new Error(result.error || "Unable to generate STL download link.");
  }
  if (!result.url) {
    throw new Error("No secure STL download URL was returned.");
  }

  return result.url;
}

export async function downloadPrintingStlFile(
  storagePath: string,
  filename?: string,
): Promise<void> {
  const url = await getPrintingFileDownloadUrl(storagePath);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to download STL file (HTTP ${response.status}).`,
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download =
      filename?.trim() ||
      storagePath.split("/").pop() ||
      "model.stl";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

/**
 * Backward-compatible alias for callers that still use the old function name.
 * The behavior is now download-only; it never opens a new browser tab.
 */
export async function openPrintingStlFile(
  storagePath: string,
  filename?: string,
): Promise<void> {
  await downloadPrintingStlFile(storagePath, filename);
}
