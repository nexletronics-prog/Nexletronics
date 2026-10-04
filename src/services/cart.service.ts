import { supabase } from "../lib/supabase";
import type { CartItem } from "../contexts/CartContext";

/*
 * ==========================================================
 * CART SERVICE
 * ==========================================================
 *
 * Firebase:
 *   Authentication only
 *
 * Supabase:
 *   Logged-in customer cart data
 */

const CART_TABLE = "carts";

export async function getCustomerCart(
  uid: string,
): Promise<CartItem[]> {
  const cleanUid = uid.trim();

  if (!cleanUid) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(CART_TABLE)
    .select("items")
    .eq("firebase_uid", cleanUid)
    .maybeSingle();

  if (error) {
    console.error(
      "[CART SUPABASE LOAD FAILED]",
      error,
    );

    throw new Error(
      error.message,
    );
  }

  if (
    !data ||
    !Array.isArray(data.items)
  ) {
    return [];
  }

  return data.items as CartItem[];
}


export async function saveCustomerCart(
  uid: string,
  items: CartItem[],
): Promise<void> {
  const cleanUid = uid.trim();

  if (!cleanUid) {
    throw new Error(
      "Customer UID is required.",
    );
  }

  const {
    error,
  } = await supabase
    .from(CART_TABLE)
    .upsert(
      {
        firebase_uid:
          cleanUid,

        items,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "firebase_uid",
      },
    );

  if (error) {
    console.error(
      "[CART SUPABASE SAVE FAILED]",
      error,
    );

    throw new Error(
      error.message,
    );
  }
}