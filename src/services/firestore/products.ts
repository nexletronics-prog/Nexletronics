import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

import type { Product } from "../../types/product";

const PRODUCTS_COLLECTION =
  "products";


/*
 * ==========================================================
 * CONVERT FIRESTORE DOCUMENT → PRODUCT
 * ==========================================================
 */

function mapProduct(
  document: {
    id: string;
    data: () => Record<string, unknown>;
  },
): Product {
  const data =
    document.data();

  return {
    id: document.id,

    name:
      typeof data.name === "string"
        ? data.name
        : "",

    slug:
      typeof data.slug === "string"
        ? data.slug
        : "",

    category:
      typeof data.category === "string"
        ? data.category
        : "",

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    shortDescription:
      typeof data.shortDescription ===
      "string"
        ? data.shortDescription
        : "",

    price:
      typeof data.price === "number"
        ? data.price
        : 0,

    currency:
      typeof data.currency === "string"
        ? data.currency
        : "INR",

    compareAtPrice:
      typeof data.compareAtPrice ===
      "number"
        ? data.compareAtPrice
        : undefined,

    stock:
      typeof data.stock === "number"
        ? data.stock
        : 0,

    available:
      typeof data.available === "boolean"
        ? data.available
        : false,

    featured:
      typeof data.featured === "boolean"
        ? data.featured
        : false,

    icon:
      typeof data.icon === "string"
        ? data.icon
        : undefined,

    imageUrl:
      typeof data.imageUrl === "string"
        ? data.imageUrl
        : undefined,

    specifications:
      typeof data.specifications ===
        "object" &&
      data.specifications !== null
        ? (
            data.specifications as Record<
              string,
              string
            >
          )
        : {},

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}


/*
 * ==========================================================
 * GET ALL AVAILABLE PRODUCTS
 * ==========================================================
 */

export async function getProducts(): Promise<
  Product[]
> {
  const productsRef =
    collection(
      db,
      PRODUCTS_COLLECTION,
    );

  const productsQuery =
    query(
      productsRef,

      where(
        "available",
        "==",
        true,
      ),

      orderBy(
        "createdAt",
        "desc",
      ),
    );

  const snapshot =
    await getDocs(
      productsQuery,
    );

  return snapshot.docs.map(
    (document) =>
      mapProduct(document),
  );
}


/*
 * ==========================================================
 * GET FEATURED PRODUCTS
 * ==========================================================
 */

export async function getFeaturedProducts(): Promise<
  Product[]
> {
  const productsRef =
    collection(
      db,
      PRODUCTS_COLLECTION,
    );

  const productsQuery =
    query(
      productsRef,

      where(
        "available",
        "==",
        true,
      ),

      where(
        "featured",
        "==",
        true,
      ),

      limit(8),
    );

  const snapshot =
    await getDocs(
      productsQuery,
    );

  return snapshot.docs.map(
    (document) =>
      mapProduct(document),
  );
}


/*
 * ==========================================================
 * GET PRODUCTS BY CATEGORY
 * ==========================================================
 */

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  if (!category.trim()) {
    return [];
  }

  const productsRef =
    collection(
      db,
      PRODUCTS_COLLECTION,
    );

  const productsQuery =
    query(
      productsRef,

      where(
        "category",
        "==",
        category,
      ),

      where(
        "available",
        "==",
        true,
      ),
    );

  const snapshot =
    await getDocs(
      productsQuery,
    );

  return snapshot.docs.map(
    (document) =>
      mapProduct(document),
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
  if (!id) {
    return null;
  }

  const productRef =
    doc(
      db,
      PRODUCTS_COLLECTION,
      id,
    );

  const snapshot =
    await getDoc(
      productRef,
    );

  if (!snapshot.exists()) {
    return null;
  }

  return mapProduct(snapshot);
}


/*
 * ==========================================================
 * GET PRODUCT BY SLUG
 * ==========================================================
 */

export async function getProductBySlug(
  slug: string,
): Promise<Product | null> {
  if (!slug.trim()) {
    return null;
  }

  const productsRef =
    collection(
      db,
      PRODUCTS_COLLECTION,
    );

  const productsQuery =
    query(
      productsRef,

      where(
        "slug",
        "==",
        slug,
      ),

      where(
        "available",
        "==",
        true,
      ),

      limit(1),
    );

  const snapshot =
    await getDocs(
      productsQuery,
    );

  if (snapshot.empty) {
    return null;
  }

  return mapProduct(
    snapshot.docs[0],
  );
}