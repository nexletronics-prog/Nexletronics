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

export async function getPrintingFileDownloadUrl(
  storagePath: string,
): Promise<string> {
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
    body: JSON.stringify({
      action: "download-stl",
      path: storagePath,
    }),
  });

  let result: DownloadResponse = {};

  try {
    result = (await response.json()) as DownloadResponse;
  } catch {
    throw new Error(
      `Unable to parse STL download response (HTTP ${response.status}).`,
    );
  }

  if (response.status === 401) {
    throw new Error("Your Firebase session is invalid or expired.");
  }

  if (response.status === 403) {
    throw new Error("Administrator access is required.");
  }

  if (!response.ok) {
    throw new Error(
      result.error || "Unable to generate STL download link.",
    );
  }

  if (!result.url) {
    throw new Error("No secure STL download URL was returned.");
  }

  return result.url;
}

/**
 * Opens the secure STL URL in a new browser tab.
 *
 * The temporary tab is created synchronously from the user's click.
 * We intentionally do not pass `noopener,noreferrer` to window.open()
 * because Chrome may return a null WindowProxy while still creating the
 * tab, which would leave an about:blank page behind.
 */
export async function openPrintingStlFile(
  storagePath: string,
): Promise<void> {
  if (!storagePath.trim()) {
    throw new Error("STL storage path is missing.");
  }

  // Create the tab directly from the user's click.
  const popup = window.open("about:blank", "_blank");

  if (!popup) {
    throw new Error(
      "Your browser blocked the STL download window. Allow pop-ups for this site and try again.",
    );
  }

  // Remove the opener reference for security.
  try {
    popup.opener = null;
  } catch {
    // Ignore browsers that do not allow changing opener here.
  }

  try {
    try {
      popup.document.title = "Preparing STL...";
    } catch {
      // Ignore title-setting failures.
    }

    const url = await getPrintingFileDownloadUrl(storagePath);

    // Navigate the already-created tab to the secure signed URL.
    popup.location.replace(url);
  } catch (error) {
    try {
      popup.close();
    } catch {
      // Ignore close failures.
    }

    throw error;
  }
}