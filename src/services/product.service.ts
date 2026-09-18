import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  Product,
} from "../types/product";


/*
 * ==========================================================
 * PRODUCTS COLLECTION
 * ==========================================================
 */

const productsCollection =
  collection(
    db,
    "products",
  );


/*
 * ==========================================================
 * CLEAN IMAGE URL
 * ==========================================================
 */

function cleanImageUrl(
  value: unknown,
): string | undefined {

  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }


  const url =
    value.trim();


  if (!url) {
    return undefined;
  }


  /*
   * Remove old Supabase URLs from the previous setup.
   */

  if (
    url.includes(
      ".supabase.co/",
    ) ||
    url.includes(
      "supabase.co/storage/",
    )
  ) {

    /*
     * IMPORTANT:
     *
     * New Supabase product-image URLs are valid.
     *
     * Therefore only reject old storage URLs when they are
     * clearly not our current product bucket.
     */

    if (
      !url.includes(
        "ivbkgfwyocmazhrqibqn.supabase.co",
      )
    ) {

      return undefined;
    }
  }


  /*
   * HTTPS / HTTP.
   */

  if (
    url.startsWith(
      "https://",
    ) ||
    url.startsWith(
      "http://",
    )
  ) {

    return url;
  }


  /*
   * Public/local path.
   */

  if (
    url.startsWith(
      "/",
    )
  ) {

    return url;
  }


  return undefined;
}


/*
 * ==========================================================
 * CLEAN IMAGE ARRAY
 * ==========================================================
 */

function cleanImageArray(
  value: unknown,
): string[] {

  if (
    !Array.isArray(
      value,
    )
  ) {

    return [];
  }


  const result =
    value
      .map(
        (
          item,
        ) =>
          cleanImageUrl(
            item,
          ),
      )
      .filter(
        (
          item,
        ): item is string =>
          Boolean(item),
      );


  /*
   * Remove duplicates while preserving order.
   */

  return [
    ...new Set(
      result,
    ),
  ].slice(
    0,
    10,
  );
}


/*
 * ==========================================================
 * PREPARE PRODUCT IMAGES
 * ==========================================================
 */

function prepareProductImages(
  product: Partial<Product>,
): {
  images: string[];
  thumbnailImage?: string;
} {

  let images =
    cleanImageArray(
      product.images,
    );


  /*
   * Backward compatibility:
   *
   * Add imageUrl if it isn't already in the gallery.
   */

  const imageUrl =
    cleanImageUrl(
      product.imageUrl,
    );


  if (
    imageUrl &&
    !images.includes(
      imageUrl,
    )
  ) {

    images.unshift(
      imageUrl,
    );
  }


  /*
   * Backward compatibility:
   *
   * Add image if it isn't already in the gallery.
   */

  const image =
    cleanImageUrl(
      product.image,
    );


  if (
    image &&
    !images.includes(
      image,
    )
  ) {

    images.push(
      image,
    );
  }


  /*
   * Maximum 10.
   */

  images =
    images.slice(
      0,
      10,
    );


  /*
   * ========================================================
   * THUMBNAIL
   * ========================================================
   */

  let thumbnail =
    cleanImageUrl(
      product.thumbnailImage,
    );


  /*
   * Thumbnail must belong to the gallery.
   */

  if (
    !thumbnail ||
    !images.includes(
      thumbnail,
    )
  ) {

    thumbnail =
      images[0];
  }


  return {
    images,

    thumbnailImage:
      thumbnail,
  };
}


/*
 * ==========================================================
 * NORMALIZE PRODUCT
 * ==========================================================
 */

function normalizeProduct(
  id: string,
  raw: Partial<Product>,
): Product {

  const prepared =
    prepareProductImages(
      raw,
    );


  /*
   * Selected thumbnail becomes the legacy primary image.
   */

  const primaryImage =
    prepared.thumbnailImage;


  return {

    id,


    /*
     * BASIC
     */

    name:
      raw.name ??
      "Unnamed product",


    description:
      raw.description ??
      "",


    category:
      raw.category ??
      "Electronics",


    /*
     * PRICING
     */

    price:
      typeof raw.price ===
      "number"
        ? raw.price
        : 0,


    currency:
      raw.currency ??
      "INR",


    /*
     * INVENTORY
     */

    stock:
      typeof raw.stock ===
      "number"
        ? raw.stock
        : 0,


    available:
      raw.available ??
      raw.active ??
      true,


    active:
      raw.active,


    /*
     * FLAGS
     */

    featured:
      raw.featured,


    bestSeller:
      raw.bestSeller,


    trending:
      raw.trending,


    /*
     * IMAGES
     *
     * image and imageUrl point to the selected thumbnail.
     */

    image:
      primaryImage,


    imageUrl:
      primaryImage,


    images:
      prepared.images,


    thumbnailImage:
      primaryImage,


    /*
     * EXTRA
     */

    slug:
      raw.slug,


    sku:
      raw.sku,


    shortDescription:
      raw.shortDescription,


    compareAtPrice:
      raw.compareAtPrice,


    specifications:
      raw.specifications,


    createdAt:
      raw.createdAt,


    updatedAt:
      raw.updatedAt,
  };
}


/*
 * ==========================================================
 * GET ALL PRODUCTS
 * ==========================================================
 */

export async function getProducts():
  Promise<Product[]> {

  const snapshot =
    await getDocs(
      productsCollection,
    );


  return snapshot.docs.map(
    (
      document,
    ) =>
      normalizeProduct(
        document.id,
        document.data() as Partial<Product>,
      ),
  );
}


/*
 * ==========================================================
 * GET PRODUCT BY ID
 * ==========================================================
 */

export async function getProductById(
  id: string,
): Promise<Product | null> {

  if (
    !id
  ) {

    return null;
  }


  const snapshot =
    await getDoc(
      doc(
        db,
        "products",
        id,
      ),
    );


  if (
    !snapshot.exists()
  ) {

    return null;
  }


  return normalizeProduct(
    snapshot.id,
    snapshot.data() as Partial<Product>,
  );
}


/*
 * ==========================================================
 * GET PRODUCT BY SLUG
 * ==========================================================
 */

export async function getProductBySlug(
  slug: string,
): Promise<Product | null> {

  if (
    !slug
  ) {

    return null;
  }


  const products =
    await getProducts();


  return (
    products.find(
      (
        product,
      ) =>
        product.slug ===
        slug,
    ) ??
    null
  );
}


/*
 * ==========================================================
 * CREATE PRODUCT
 * ==========================================================
 */

export async function createProduct(
  product: Omit<Product, "id">,
): Promise<string> {

  const prepared =
    prepareProductImages(
      product,
    );


  const document =
    await addDoc(
      productsCollection,
      {

        ...product,


        /*
         * Primary/thumbnail image.
         */

        image:
          prepared.thumbnailImage,


        imageUrl:
          prepared.thumbnailImage,


        thumbnailImage:
          prepared.thumbnailImage,


        /*
         * Full gallery.
         */

        images:
          prepared.images,


        /*
         * Firestore timestamps.
         */

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
 * UPDATE PRODUCT
 * ==========================================================
 */

export async function updateProduct(
  id: string,
  data: Partial<
    Omit<Product, "id">
  >,
): Promise<void> {

  if (
    !id
  ) {

    throw new Error(
      "Product ID is required.",
    );
  }


  const updates:
    Record<
      string,
      unknown
    > = {

    ...data,


    updatedAt:
      serverTimestamp(),
  };


  /*
   * If image data changes, rebuild all image fields.
   */

  if (
    "images" in data ||
    "thumbnailImage" in data ||
    "image" in data ||
    "imageUrl" in data
  ) {

    const prepared =
      prepareProductImages(
        data,
      );


    updates.images =
      prepared.images;


    updates.thumbnailImage =
      prepared.thumbnailImage;


    updates.image =
      prepared.thumbnailImage;


    updates.imageUrl =
      prepared.thumbnailImage;
  }


  await updateDoc(
    doc(
      db,
      "products",
      id,
    ),
    updates,
  );
}


/*
 * ==========================================================
 * DELETE PRODUCT
 * ==========================================================
 */

export async function deleteProduct(
  id: string,
): Promise<void> {

  if (
    !id
  ) {

    return;
  }


  await deleteDoc(
    doc(
      db,
      "products",
      id,
    ),
  );
}