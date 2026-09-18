import {
  auth,
} from "../firebase/config";


/*
 * ==========================================================
 * NEXLETRONICS SUPABASE IMAGE UPLOAD
 * ==========================================================
 *
 * Firebase Authentication:
 *   → verifies the currently logged-in admin
 *
 * Supabase:
 *   → stores product images
 *
 * Edge Function:
 *   → verifies the Firebase ID token
 *   → checks the admin UID
 *   → uploads the image securely
 */

const EDGE_FUNCTION_URL =
  "https://ivbkgfwyocmazhrqibqn.supabase.co/functions/v1/admin-product-upload";


/*
 * ==========================================================
 * IMAGE LIMITS
 * ==========================================================
 */

export const MAX_PRODUCT_IMAGES =
  10;


export const MAX_PRODUCT_IMAGE_SIZE =
  5 * 1024 * 1024;


export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];


/*
 * ==========================================================
 * UPLOAD RESPONSE
 * ==========================================================
 */

interface ProductImageUploadResponse {
  success?: boolean;

  path?: string;

  publicUrl?: string;

  uid?: string;

  error?: string;
}


/*
 * ==========================================================
 * VALIDATE IMAGE
 * ==========================================================
 */

function validateProductImage(
  file: File,
): void {

  if (
    !ALLOWED_PRODUCT_IMAGE_TYPES.includes(
      file.type,
    )
  ) {

    throw new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed.",
    );
  }


  if (
    file.size >
    MAX_PRODUCT_IMAGE_SIZE
  ) {

    throw new Error(
      "Each image must be 5 MB or smaller.",
    );
  }
}


/*
 * ==========================================================
 * READ SERVER ERROR
 * ==========================================================
 */

async function readServerError(
  response: Response,
): Promise<string> {

  try {

    const data =
      (await response.json()) as
        | ProductImageUploadResponse
        | null;


    if (
      data &&
      typeof data.error ===
        "string" &&
      data.error.trim()
    ) {

      return data.error;
    }

  } catch {
    /*
     * Server did not return JSON.
     */
  }


  return (
    `Image upload failed with HTTP ${response.status}.`
  );
}


/*
 * ==========================================================
 * UPLOAD ONE PRODUCT IMAGE
 * ==========================================================
 */

export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<string> {

  /*
   * Validate image.
   */

  validateProductImage(
    file,
  );


  /*
   * Validate product ID.
   */

  const cleanProductId =
    productId.trim();


  if (
    !cleanProductId
  ) {

    throw new Error(
      "Product ID is required for image upload.",
    );
  }


  /*
   * ========================================================
   * FIREBASE USER
   * ========================================================
   */

  const currentUser =
    auth.currentUser;


  if (
    !currentUser
  ) {

    throw new Error(
      "You must be signed in before uploading product images.",
    );
  }


  /*
   * ========================================================
   * FIREBASE ID TOKEN
   * ========================================================
   *
   * This token is sent to the Supabase Edge Function.
   *
   * The Supabase secret key is NEVER exposed here.
   */

  const idToken =
    await currentUser.getIdToken(
      false,
    );


  if (
    !idToken
  ) {

    throw new Error(
      "Unable to obtain Firebase authentication token.",
    );
  }


  /*
   * ========================================================
   * FORM DATA
   * ========================================================
   */

  const formData =
    new FormData();


  formData.append(
    "productId",
    cleanProductId,
  );


  formData.append(
    "file",
    file,
    file.name,
  );


  /*
   * ========================================================
   * SEND TO SUPABASE EDGE FUNCTION
   * ========================================================
   */

  let response: Response;


  try {

    response =
      await fetch(
        EDGE_FUNCTION_URL,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },

          body:
            formData,
        },
      );

  } catch (
    networkError
  ) {

    console.error(
      "Supabase Edge Function connection failed:",
      networkError,
    );


    throw new Error(
      "Could not connect to the Supabase image upload service.",
    );
  }


  /*
   * ========================================================
   * HANDLE ERROR
   * ========================================================
   */

  if (
    !response.ok
  ) {

    const message =
      await readServerError(
        response,
      );


    console.error(
      "Product image upload failed:",
      {
        status:
          response.status,

        statusText:
          response.statusText,

        message,
      },
    );


    throw new Error(
      message,
    );
  }


  /*
   * ========================================================
   * READ SUCCESS RESPONSE
   * ========================================================
   */

  let result:
    ProductImageUploadResponse;


  try {

    result =
      (await response.json()) as
        ProductImageUploadResponse;

  } catch {

    throw new Error(
      "Supabase returned an invalid upload response.",
    );
  }


  /*
   * ========================================================
   * PUBLIC URL
   * ========================================================
   */

  if (
    typeof result.publicUrl !==
      "string" ||
    !result.publicUrl.trim()
  ) {

    throw new Error(
      "Image uploaded, but no public image URL was returned.",
    );
  }


  return result.publicUrl;
}


/*
 * ==========================================================
 * UPLOAD MULTIPLE PRODUCT IMAGES
 * ==========================================================
 *
 * Optional helper.
 *
 * ProductForm can use uploadProductImage() individually,
 * which is better for showing upload progress.
 */

export async function uploadProductImages(
  files: File[],
  productId: string,
): Promise<string[]> {

  if (
    files.length ===
    0
  ) {

    throw new Error(
      "Please select at least one image.",
    );
  }


  if (
    files.length >
    MAX_PRODUCT_IMAGES
  ) {

    throw new Error(
      `A product can have a maximum of ${MAX_PRODUCT_IMAGES} images.`,
    );
  }


  const uploadedUrls:
    string[] =
    [];


  for (
    const file of
      files
  ) {

    const publicUrl =
      await uploadProductImage(
        file,
        productId,
      );


    uploadedUrls.push(
      publicUrl,
    );
  }


  return uploadedUrls;
}