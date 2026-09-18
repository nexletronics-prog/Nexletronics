import {
  auth,
} from "../firebase/config";


const SUPABASE_URL =
  "https://ivbkgfwyocmazhrqibqn.supabase.co";


const PRINTING_UPLOAD_FUNCTION =
  `${SUPABASE_URL}/functions/v1/printing-upload`;


export const MAX_STL_FILE_SIZE =
  50 * 1024 * 1024;


/*
 * ==========================================================
 * VALIDATE STL
 * ==========================================================
 */

export function validateStlFile(
  file: File,
): void {

  if (
    !file.name
      .toLowerCase()
      .endsWith(".stl")
  ) {
    throw new Error(
      "Only STL files are allowed.",
    );
  }


  if (
    file.size <= 0
  ) {
    throw new Error(
      "The STL file is empty.",
    );
  }


  if (
    file.size >
    MAX_STL_FILE_SIZE
  ) {
    throw new Error(
      "The STL file must be 50 MB or smaller.",
    );
  }
}


/*
 * ==========================================================
 * UPLOAD STL
 * ==========================================================
 */

export async function uploadStlFile(
  file: File,
  orderId: string,
): Promise<{
  path: string;
  fileName: string;
}> {

  validateStlFile(
    file,
  );


  if (
    !orderId.trim()
  ) {
    throw new Error(
      "Printing order ID is required.",
    );
  }


  const user =
    auth.currentUser;


  if (
    !user
  ) {
    throw new Error(
      "You must be signed in before uploading an STL.",
    );
  }


  /*
   * Force-refresh once.
   *
   * This is useful when the Firebase token was issued before
   * the user entered the printing page.
   */

  const token =
    await user.getIdToken(
      true,
    );


  if (
    !token
  ) {
    throw new Error(
      "Unable to get your Firebase authentication token.",
    );
  }


  const formData =
    new FormData();


  formData.append(
    "action",
    "upload-stl",
  );


  formData.append(
    "orderId",
    orderId.trim(),
  );


  formData.append(
    "file",
    file,
    file.name,
  );


  let response: Response;


  try {

    response =
      await fetch(
        PRINTING_UPLOAD_FUNCTION,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body:
            formData,
        },
      );

  } catch (
    error
  ) {

    console.error(
      "STL upload network error:",
      error,
    );


    throw new Error(
      "Unable to connect to the printing upload service.",
    );
  }


  let result: {
    success?: boolean;
    path?: string;
    fileName?: string;
    error?: string;
  };


  try {

    result =
      (
        await response.json()
      ) as typeof result;

  } catch {

    throw new Error(
      `STL upload service returned HTTP ${response.status}.`,
    );
  }


  if (
    !response.ok
  ) {

    console.error(
      "STL upload response:",
      {
        status:
          response.status,

        result,
      },
    );


    if (
      response.status ===
      401
    ) {

      throw new Error(
        "STL upload was rejected by the server. Make sure the printing-upload Edge Function has verify_jwt=false and is deployed.",
      );
    }


    if (
      response.status ===
      403
    ) {

      throw new Error(
        "You are not authorized to upload this STL file.",
      );
    }


    throw new Error(
      result.error ||
        `STL upload failed with HTTP ${response.status}.`,
    );
  }


  if (
    !result.success ||
    !result.path ||
    !result.fileName
  ) {

    throw new Error(
      result.error ||
        "STL upload did not return a storage path.",
    );
  }


  return {
    path:
      result.path,

    fileName:
      result.fileName,
  };
}