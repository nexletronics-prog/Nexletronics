import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  storage,
} from "../firebase/config";


/*
 * ==========================================================
 * UPLOAD PRODUCT IMAGE
 * ==========================================================
 */

export async function uploadProductImage(
  file: File,
  productId?: string,
): Promise<string> {
  if (!file) {
    throw new Error(
      "No image file was provided.",
    );
  }


  /*
   * File validation
   */

  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    throw new Error(
      "Only image files are allowed.",
    );
  }


  const maxSize =
    5 * 1024 * 1024;


  if (
    file.size >
    maxSize
  ) {
    throw new Error(
      "Image must be smaller than 5 MB.",
    );
  }


  /*
   * Safe extension
   */

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        "",
      ) ||
    "jpg";


  /*
   * Unique filename
   */

  const uniqueId =
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;


  const safeProductId =
    productId ||
    "new";


  const path =
    `products/${safeProductId}/${uniqueId}.${extension}`;


  const storageRef =
    ref(
      storage,
      path,
    );


  /*
   * Upload
   */

  await uploadBytes(
    storageRef,
    file,
    {
      contentType:
        file.type,

      customMetadata: {
        originalName:
          file.name,
      },
    },
  );


  /*
   * Return download URL
   */

  return getDownloadURL(
    storageRef,
  );
}


/*
 * ==========================================================
 * DELETE PRODUCT IMAGE
 * ==========================================================
 */

export async function deleteProductImage(
  imageUrl: string,
): Promise<void> {
  if (!imageUrl) {
    return;
  }


  /*
   * `ref(storage, downloadUrl)` can resolve a Firebase
   * Storage download URL into a StorageReference.
   *
   * If the URL isn't a Firebase Storage URL, simply skip it.
   */

  if (
    !imageUrl.includes(
      "firebasestorage.googleapis.com",
    ) &&
    !imageUrl.includes(
      "firebasestorage.app",
    )
  ) {
    return;
  }


  try {
    const storageRef =
      ref(
        storage,
        imageUrl,
      );

    await deleteObject(
      storageRef,
    );
  } catch (error) {
    console.warn(
      "Unable to delete Storage image:",
      error,
    );
  }
}