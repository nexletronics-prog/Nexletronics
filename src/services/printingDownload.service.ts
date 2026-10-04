import { auth } from "../firebase/config";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL.");
}

const FUNCTION_URL =
  `${supabaseUrl}/functions/v1/printing-upload`;

interface DownloadResponse {
  success?: boolean;
  url?: string;
  error?: string;
}

/**
 * Get the current Firebase ID token without forcing a refresh.
 *
 * The previous implementation used getIdToken(true), which forces
 * Firebase to refresh and persist the current user. That can trigger
 * "Database is closing/hidden" IndexedDB errors in some browsers.
 *
 * We already have a valid authenticated session at this point, so
 * use the currently cached token first.
 */
async function getFirebaseIdToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Please sign in again before downloading the STL file.",
    );
  }

  try {
    const token = await user.getIdToken(false);

    if (!token) {
      throw new Error(
        "Firebase did not return an authentication token.",
      );
    }

    return token;
  } catch (error) {
    console.error(
      "Failed to obtain Firebase ID token:",
      error,
    );

    throw new Error(
      "Unable to verify your administrator session. Please refresh the page and try again.",
    );
  }
}

/**
 * Ask the secure Supabase Edge Function to generate a temporary
 * download URL for a private STL file.
 */
export async function getPrintingFileDownloadUrl(
  storagePath: string,
): Promise<string> {
  const cleanPath =
    storagePath.trim();

  if (!cleanPath) {
    throw new Error(
      "STL storage path is missing.",
    );
  }

  const token =
    await getFirebaseIdToken();

  let response: Response;

  try {
    response = await fetch(
      FUNCTION_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          action: "download-stl",
          path: cleanPath,
        }),
      },
    );
  } catch (error) {
    console.error(
      "Failed to contact printing download function:",
      error,
    );

    throw new Error(
      "Unable to contact the secure STL download service.",
    );
  }

  let result:
    DownloadResponse = {};

  try {
    result =
      (await response.json()) as
        DownloadResponse;
  } catch {
    throw new Error(
      `Unable to read the STL download response (HTTP ${response.status}).`,
    );
  }

  if (response.status === 401) {
    throw new Error(
      "Your authentication session is invalid or expired. Please sign in again.",
    );
  }

  if (response.status === 403) {
    throw new Error(
      "Administrator access is required to download this STL file.",
    );
  }

  if (response.status === 404) {
    throw new Error(
      "The STL file or secure download service was not found.",
    );
  }

  if (!response.ok) {
    throw new Error(
      result.error ||
      `Unable to generate STL download link (HTTP ${response.status}).`,
    );
  }

  if (!result.url) {
    throw new Error(
      "The secure download service did not return a download URL.",
    );
  }

  return result.url;
}

/**
 * Download a private STL file directly.
 *
 * No popup.
 * No new tab.
 * No about:blank.
 */
export async function downloadPrintingStlFile(
  storagePath: string,
  filename?: string,
): Promise<void> {
  const url =
    await getPrintingFileDownloadUrl(
      storagePath,
    );

  let response: Response;

  try {
    response =
      await fetch(url);
  } catch (error) {
    console.error(
      "Failed to fetch STL file:",
      error,
    );

    throw new Error(
      "Unable to download the STL file from secure storage.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Unable to download STL file (HTTP ${response.status}).`,
    );
  }

  const blob =
    await response.blob();

  if (!blob.size) {
    throw new Error(
      "The downloaded STL file is empty.",
    );
  }

  const objectUrl =
    URL.createObjectURL(blob);

  try {
    const anchor =
      document.createElement("a");

    anchor.href =
      objectUrl;

    const fallbackFilename =
      storagePath
        .split("/")
        .pop()
        ?.trim() ||
      "model.stl";

    anchor.download =
      filename?.trim() ||
      fallbackFilename;

    anchor.style.display =
      "none";

    document.body.appendChild(
      anchor,
    );

    anchor.click();

    anchor.remove();
  } finally {
    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          objectUrl,
        );
      },
      1000,
    );
  }
}

/**
 * Backward-compatible function name.
 *
 * Behavior is download-only.
 * It never opens a new tab or popup.
 */
export async function openPrintingStlFile(
  storagePath: string,
  filename?: string,
): Promise<void> {
  await downloadPrintingStlFile(
    storagePath,
    filename,
  );
}