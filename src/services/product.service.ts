import {
  supabase,
} from "../lib/supabase";

import type {
  Product,
} from "../types/product";


/*
 * ==========================================================
 * SUPABASE PRODUCT ROW
 * ==========================================================
 */

interface SupabaseProductRow {
  id: string;

  name: string;

  slug: string | null;

  sku: string | null;

  description: string;

  short_description: string | null;

  category: string;

  price: number;

  compare_at_price: number | null;

  currency: string;

  stock: number;

  available: boolean;

  active: boolean;

  featured: boolean;

  best_seller: boolean;

  trending: boolean;

  image: string | null;

  image_url: string | null;

  images: string[] | null;

  thumbnail_image: string | null;

  icon: string | null;

  specifications:
    Record<string, unknown> | null;

  created_at: string;

  updated_at: string;
}


/*
 * ==========================================================
 * IMAGE URL CLEANER
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

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/")
  ) {
    return url;
  }

  return undefined;
}


/*
 * ==========================================================
 * IMAGE ARRAY CLEANER
 * ==========================================================
 */

function cleanImageArray(
  value: unknown,
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return [
    ...new Set(
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
        ),
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


  images =
    images.slice(
      0,
      10,
    );


  let thumbnail =
    cleanImageUrl(
      product.thumbnailImage,
    );


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
 * MAP SUPABASE ROW → PRODUCT
 * ==========================================================
 */

function mapProduct(
  row: SupabaseProductRow,
): Product {
  const images =
    cleanImageArray(
      row.images,
    );


  const image =
    cleanImageUrl(
      row.image,
    );


  const imageUrl =
    cleanImageUrl(
      row.image_url,
    );


  const thumbnail =
    cleanImageUrl(
      row.thumbnail_image,
    );


  const primaryImage =
    thumbnail ||
    imageUrl ||
    image ||
    images[0];


  return {
    id:
      row.id,

    name:
      typeof row.name ===
      "string"
        ? row.name
        : "Unnamed product",

    slug:
      row.slug ??
      undefined,

    sku:
      row.sku ??
      undefined,

    description:
      typeof row.description ===
      "string"
        ? row.description
        : "",

    shortDescription:
      row.short_description ??
      undefined,

    category:
      typeof row.category ===
      "string"
        ? row.category
        : "Electronics",

    price:
      typeof row.price ===
      "number"
        ? row.price
        : 0,

    compareAtPrice:
      typeof row.compare_at_price ===
      "number"
        ? row.compare_at_price
        : undefined,

    currency:
      row.currency ??
      "INR",

    stock:
      typeof row.stock ===
      "number"
        ? row.stock
        : 0,

    available:
      row.available ??
      true,

    active:
      row.active ??
      true,

    featured:
      row.featured ??
      false,

    bestSeller:
      row.best_seller ??
      false,

    trending:
      row.trending ??
      false,

    image:
      primaryImage,

    imageUrl:
      primaryImage,

    images:
      primaryImage
        ? [
            primaryImage,
            ...images.filter(
              (
                item,
              ) =>
                item !==
                primaryImage,
            ),
          ].slice(
            0,
            10,
          )
        : images,

    thumbnailImage:
      primaryImage,

    icon:
      row.icon ??
      undefined,

    specifications:
      row.specifications &&
      typeof row.specifications ===
        "object"
        ? (
            row.specifications as Record<
              string,
              string
            >
          )
        : {},

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * PRODUCT SELECT COLUMNS
 * ==========================================================
 */

const PRODUCT_COLUMNS = `
  id,
  name,
  slug,
  sku,
  description,
  short_description,
  category,
  price,
  compare_at_price,
  currency,
  stock,
  available,
  active,
  featured,
  best_seller,
  trending,
  image,
  image_url,
  images,
  thumbnail_image,
  icon,
  specifications,
  created_at,
  updated_at
`;


/*
 * ==========================================================
 * GET ALL PRODUCTS
 * ==========================================================
 *
 * RLS decides what the caller can see.
 *
 * Public:
 *   active + available products
 *
 * Admin:
 *   all products
 */

export async function getProducts():
  Promise<Product[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("products")
      .select(
        PRODUCT_COLUMNS,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (error) {
    throw error;
  }


  return (
    (data ?? []) as SupabaseProductRow[]
  ).map(
    mapProduct,
  );
}


/*
 * ==========================================================
 * GET FEATURED PRODUCTS
 * ==========================================================
 */

export async function getFeaturedProducts():
  Promise<Product[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("products")
      .select(
        PRODUCT_COLUMNS,
      )
      .eq(
        "available",
        true,
      )
      .eq(
        "active",
        true,
      )
      .eq(
        "featured",
        true,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        8,
      );


  if (error) {
    throw error;
  }


  return (
    (data ?? []) as SupabaseProductRow[]
  ).map(
    mapProduct,
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
  if (
    !category.trim()
  ) {
    return [];
  }


  const {
    data,
    error,
  } =
    await supabase
      .from("products")
      .select(
        PRODUCT_COLUMNS,
      )
      .eq(
        "category",
        category,
      )
      .eq(
        "available",
        true,
      )
      .eq(
        "active",
        true,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (error) {
    throw error;
  }


  return (
    (data ?? []) as SupabaseProductRow[]
  ).map(
    mapProduct,
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
    !id.trim()
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from("products")
      .select(
        PRODUCT_COLUMNS,
      )
      .eq(
        "id",
        id,
      )
      .maybeSingle();


  if (error) {
    throw error;
  }


  if (!data) {
    return null;
  }


  return mapProduct(
    data as SupabaseProductRow,
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
    !slug.trim()
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from("products")
      .select(
        PRODUCT_COLUMNS,
      )
      .eq(
        "slug",
        slug,
      )
      .eq(
        "available",
        true,
      )
      .eq(
        "active",
        true,
      )
      .limit(
        1,
      )
      .maybeSingle();


  if (error) {
    throw error;
  }


  if (!data) {
    return null;
  }


  return mapProduct(
    data as SupabaseProductRow,
  );
}


/*
 * ==========================================================
 * CREATE PRODUCT
 * ==========================================================
 *
 * Optional id is supplied by ProductForm so the Supabase
 * product ID matches its image-storage folder.
 */

export async function createProduct(
  product: Omit<Product, "id">,
  id?: string,
): Promise<string> {
  const productId =
    id?.trim() ||
    crypto.randomUUID();


  const prepared =
    prepareProductImages(
      product,
    );


  const active =
    product.active ??
    product.available ??
    true;


  const available =
    product.available ??
    product.active ??
    true;


  const {
    error,
  } =
    await supabase
      .from("products")
      .insert({
        id:
          productId,

        name:
          product.name ??
          "Unnamed product",

        slug:
          product.slug ??
          null,

        sku:
          product.sku ??
          null,

        description:
          product.description ??
          "",

        short_description:
          product.shortDescription ??
          null,

        category:
          product.category ??
          "Electronics",

        price:
          typeof product.price ===
          "number"
            ? product.price
            : 0,

        compare_at_price:
          typeof product.compareAtPrice ===
          "number"
            ? product.compareAtPrice
            : null,

        currency:
          product.currency ??
          "INR",

        stock:
          typeof product.stock ===
          "number"
            ? product.stock
            : 0,

        available,

        active,

        featured:
          Boolean(
            product.featured,
          ),

        best_seller:
          Boolean(
            product.bestSeller,
          ),

        trending:
          Boolean(
            product.trending,
          ),

        image:
          prepared.thumbnailImage ??
          null,

        image_url:
          prepared.thumbnailImage ??
          null,

        images:
          prepared.images,

        thumbnail_image:
          prepared.thumbnailImage ??
          null,

        icon:
          product.icon ??
          null,

        specifications:
          product.specifications ??
          {},

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });


  if (error) {
    throw error;
  }


  return productId;
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
    !id.trim()
  ) {
    throw new Error(
      "Product ID is required.",
    );
  }


  const updates:
    Record<
      string,
      unknown
    > = {};


  if (
    "name" in data
  ) {
    updates.name =
      data.name ??
      "";
  }


  if (
    "slug" in data
  ) {
    updates.slug =
      data.slug ??
      null;
  }


  if (
    "sku" in data
  ) {
    updates.sku =
      data.sku ??
      null;
  }


  if (
    "description" in data
  ) {
    updates.description =
      data.description ??
      "";
  }


  if (
    "shortDescription" in data
  ) {
    updates.short_description =
      data.shortDescription ??
      null;
  }


  if (
    "category" in data
  ) {
    updates.category =
      data.category ??
      "Electronics";
  }


  if (
    "price" in data
  ) {
    updates.price =
      typeof data.price ===
      "number"
        ? data.price
        : 0;
  }


  if (
    "compareAtPrice" in data
  ) {
    updates.compare_at_price =
      typeof data.compareAtPrice ===
      "number"
        ? data.compareAtPrice
        : null;
  }


  if (
    "currency" in data
  ) {
    updates.currency =
      data.currency ??
      "INR";
  }


  if (
    "stock" in data
  ) {
    updates.stock =
      typeof data.stock ===
      "number"
        ? data.stock
        : 0;
  }


  if (
    "available" in data
  ) {
    updates.available =
      data.available ??
      true;
  }


  if (
    "active" in data
  ) {
    updates.active =
      data.active ??
      true;
  }


  if (
    "featured" in data
  ) {
    updates.featured =
      Boolean(
        data.featured,
      );
  }


  if (
    "bestSeller" in data
  ) {
    updates.best_seller =
      Boolean(
        data.bestSeller,
      );
  }


  if (
    "trending" in data
  ) {
    updates.trending =
      Boolean(
        data.trending,
      );
  }


  if (
    "icon" in data
  ) {
    updates.icon =
      data.icon ??
      null;
  }


  if (
    "specifications" in data
  ) {
    updates.specifications =
      data.specifications ??
      {};
  }


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


    updates.thumbnail_image =
      prepared.thumbnailImage ??
      null;


    updates.image =
      prepared.thumbnailImage ??
      null;


    updates.image_url =
      prepared.thumbnailImage ??
      null;
  }


  updates.updated_at =
    new Date().toISOString();


  const {
    error,
  } =
    await supabase
      .from("products")
      .update(
        updates,
      )
      .eq(
        "id",
        id,
      );


  if (error) {
    throw error;
  }
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
    !id.trim()
  ) {
    return;
  }


  const {
    error,
  } =
    await supabase
      .from("products")
      .delete()
      .eq(
        "id",
        id,
      );


  if (error) {
    throw error;
  }
}


/*
 * ==========================================================
 * SUPABASE REALTIME PRODUCTS
 * ==========================================================
 *
 * Used by:
 *
 *   Admin Product Manager
 *   Admin Dashboard
 *
 * Firestore is no longer involved.
 */

export function subscribeToProducts(
  onChange: (
    products: Product[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  let stopped =
    false;

  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  const productsMap =
    new Map<
      string,
      Product
    >();


  function emit() {
    const sorted =
      Array.from(
        productsMap.values(),
      ).sort(
        (
          first,
          second,
        ) => {
          const firstTime =
            first.createdAt
              ? Date.parse(
                  String(
                    first.createdAt,
                  ),
                )
              : 0;

          const secondTime =
            second.createdAt
              ? Date.parse(
                  String(
                    second.createdAt,
                  ),
                )
              : 0;

          return (
            secondTime -
            firstTime
          );
        },
      );


    if (!stopped) {
      onChange(
        sorted,
      );
    }
  }


  void (async () => {
    try {
      /*
       * Initial snapshot.
       */

      const initial =
        await getProducts();


      if (
        stopped
      ) {
        return;
      }


      productsMap.clear();


      for (
        const product of
          initial
      ) {
        productsMap.set(
          product.id,
          product,
        );
      }


      emit();


      /*
       * Realtime channel.
       */

      channel =
        supabase
          .channel(
            `nexletronics-products-${Date.now()}`,
          )
          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "products",
            },
            (
              payload,
            ) => {
              if (
                stopped
              ) {
                return;
              }


              if (
                payload.eventType ===
                "DELETE"
              ) {
                const oldRow =
                  payload.old as {
                    id?: string;
                  };


                if (
                  oldRow.id
                ) {
                  productsMap.delete(
                    oldRow.id,
                  );
                }
              } else {
                const row =
                  payload.new as SupabaseProductRow;


                if (
                  row?.id
                ) {
                  productsMap.set(
                    row.id,
                    mapProduct(
                      row,
                    ),
                  );
                }
              }


              emit();
            },
          )
          .subscribe(
            (
              status,
            ) => {
              if (
                status ===
                  "CHANNEL_ERROR" ||
                status ===
                  "TIMED_OUT"
              ) {
                const realtimeError =
                  new Error(
                    "Unable to connect to the realtime product database.",
                  );

                console.error(
                  realtimeError,
                );

                onError?.(
                  realtimeError,
                );
              }
            },
          );
    } catch (
      error
    ) {
      const normalized =
        error instanceof Error
          ? error
          : new Error(
              "Unable to load products.",
            );

      console.error(
        "Supabase products listener failed:",
        error,
      );

      onError?.(
        normalized,
      );
    }
  })();


  return () => {
    stopped =
      true;

    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
}