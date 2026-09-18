import {
  auth,
} from "../firebase/config";


const SUPABASE_URL =
  "https://ivbkgfwyocmazhrqibqn.supabase.co";


const FUNCTION_URL =
  `${SUPABASE_URL}/functions/v1/printing-upload`;


interface DownloadResponse {
  success?: boolean;
  url?: string;
  error?: string;
}


export async function getPrintingFileDownloadUrl(
  storagePath: string,
): Promise<string> {

  if (
    !storagePath.trim()
  ) {

    throw new Error(
      "STL storage path is missing.",
    );
  }


  const user =
    auth.currentUser;


  if (
    !user
  ) {

    throw new Error(
      "Please sign in again.",
    );
  }


  const token =
    await user.getIdToken(
      true,
    );


  const response =
    await fetch(
      FUNCTION_URL,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            action:
              "download-stl",

            path:
              storagePath,
          }),
      },
    );


  const result =
    (
      await response.json()
    ) as DownloadResponse;


  if (
    response.status ===
    401
  ) {

    throw new Error(
      "Your Firebase session is invalid or expired.",
    );
  }


  if (
    response.status ===
    403
  ) {

    throw new Error(
      "Administrator access is required.",
    );
  }


  if (
    !response.ok
  ) {

    throw new Error(
      result.error ||
        "Unable to generate STL download link.",
    );
  }


  if (
    !result.url
  ) {

    throw new Error(
      "No secure STL download URL was returned.",
    );
  }


  return result.url;
}


export async function openPrintingStlFile(
  storagePath: string,
): Promise<void> {

  const url =
    await getPrintingFileDownloadUrl(
      storagePath,
    );


  const popup =
    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );


  if (
    !popup
  ) {

    throw new Error(
      "Your browser blocked the STL download window.",
    );
  }
}