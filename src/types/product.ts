/*
 * ==========================================================
 * PRODUCT TYPE
 * ==========================================================
 */

export interface Product {
  /*
   * Firestore document ID
   */
  id: string;


  /*
   * ========================================================
   * BASIC INFORMATION
   * ========================================================
   */

  name: string;

  slug?: string;

  sku?: string;

  description: string;

  shortDescription?: string;

  category: string;


  /*
   * ========================================================
   * PRICING
   * ========================================================
   */

  price: number;

  compareAtPrice?: number;

  currency: string;


  /*
   * ========================================================
   * INVENTORY
   * ========================================================
   */

  stock: number;

  available: boolean;

  active?: boolean;


  /*
   * ========================================================
   * PRODUCT FLAGS
   * ========================================================
   */

  featured?: boolean;

  bestSeller?: boolean;

  trending?: boolean;


  /*
   * ========================================================
   * PRODUCT IMAGES
   * ========================================================
   *
   * `image` and `imageUrl` are retained for compatibility
   * with the existing product cards, orders and older data.
   *
   * `images` contains the complete product gallery.
   *
   * `thumbnailImage` identifies the image selected by the
   * admin as the primary/thumbnail image.
   */

  image?: string;

  imageUrl?: string;

  images?: string[];

  thumbnailImage?: string;


  /*
   * ========================================================
   * OTHER PRODUCT DATA
   * ========================================================
   */

  icon?: string;

  specifications?: Record<
    string,
    string
  >;


  /*
   * ========================================================
   * FIRESTORE METADATA
   * ========================================================
   */

  createdAt?: unknown;

  updatedAt?: unknown;
}