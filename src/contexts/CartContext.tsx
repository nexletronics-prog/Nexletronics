import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  Product,
} from "../types/product";

import {
  supabase,
} from "../lib/supabase";

import {
  useAuth,
} from "../hooks/useAuth";


export interface CartItem {
  product: Product;
  quantity: number;
}


interface CartContextValue {
  items: CartItem[];

  cartItems: CartItem[];

  addToCart: (
    product: Product,
    quantity?: number,
  ) => void;

  removeFromCart: (
    productId: string,
  ) => void;

  updateQuantity: (
    productId: string,
    quantity: number,
  ) => void;

  increaseQuantity: (
    productId: string,
  ) => void;

  decreaseQuantity: (
    productId: string,
  ) => void;

  clearCart: () => void;

  getItemQuantity: (
    productId: string,
  ) => number;

  subtotal: number;

  total: number;

  cartTotal: number;

  itemCount: number;

  cartCount: number;

  isEmpty: boolean;
}


const CartContext =
  createContext<
    CartContextValue | undefined
  >(undefined);


const GUEST_CART_KEY =
  "nexletronics-cart:guest";


const CART_TABLE =
  "carts";


/*
 * ==========================================================
 * VALIDATE PRODUCT
 * ==========================================================
 */

function isValidProduct(
  value: unknown,
): value is Product {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const product =
    value as {
      id?: unknown;
      price?: unknown;
      stock?: unknown;
      available?: unknown;
    };

  return (
    typeof product.id === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(
      product.price,
    ) &&
    typeof product.stock === "number" &&
    Number.isFinite(
      product.stock,
    ) &&
    typeof product.available === "boolean"
  );
}


/*
 * ==========================================================
 * NORMALIZE CART
 * ==========================================================
 */

function normalizeCart(
  value: unknown,
): CartItem[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const result: CartItem[] = [];

  for (
    const rawItem of value
  ) {
    if (
      !rawItem ||
      typeof rawItem !== "object"
    ) {
      continue;
    }

    const item =
      rawItem as {
        product?: unknown;
        quantity?: unknown;
      };

    if (
      !isValidProduct(
        item.product,
      )
    ) {
      continue;
    }

    const quantity =
      Number(
        item.quantity,
      );

    if (
      !Number.isFinite(
        quantity,
      ) ||
      quantity <= 0
    ) {
      continue;
    }

    const maxStock =
      Math.max(
        Number(
          item.product.stock,
        ),
        1,
      );

    result.push({
      product:
        item.product,

      quantity:
        Math.min(
          Math.floor(
            quantity,
          ),
          maxStock,
        ),
    });
  }

  return result;
}


/*
 * ==========================================================
 * GUEST CART
 * ==========================================================
 */

function loadGuestCart(): CartItem[] {
  try {
    const raw =
      localStorage.getItem(
        GUEST_CART_KEY,
      );

    if (!raw) {
      return [];
    }

    return normalizeCart(
      JSON.parse(raw),
    );
  } catch {
    return [];
  }
}


function saveGuestCart(
  items: CartItem[],
): void {
  try {
    localStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify(
        items,
      ),
    );
  } catch {
    /*
     * Ignore localStorage errors.
     */
  }
}


/*
 * ==========================================================
 * LOAD CUSTOMER CART FROM SUPABASE
 * ==========================================================
 *
 * Expected Supabase table:
 *
 * carts
 * ├── firebase_uid
 * ├── items
 * ├── created_at
 * └── updated_at
 *
 */

async function loadCustomerCart(
  uid: string,
): Promise<CartItem[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      CART_TABLE,
    )
    .select(
      "items",
    )
    .eq(
      "firebase_uid",
      uid,
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    !data ||
    !Array.isArray(
      data.items,
    )
  ) {
    return [];
  }

  return normalizeCart(
    data.items,
  );
}


/*
 * ==========================================================
 * SAVE CUSTOMER CART TO SUPABASE
 * ==========================================================
 */

async function saveCustomerCart(
  uid: string,
  items: CartItem[],
): Promise<void> {
  const {
    error,
  } = await supabase
    .from(
      CART_TABLE,
    )
    .upsert(
      {
        firebase_uid:
          uid,

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
    throw error;
  }
}


/*
 * ==========================================================
 * PROVIDER
 * ==========================================================
 */

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    loading: authLoading,
  } = useAuth();


  const [
    items,
    setItems,
  ] =
    useState<CartItem[]>(
      [],
    );


  const [
    initialized,
    setInitialized,
  ] =
    useState(false);


  /*
   * Prevent unnecessary duplicate writes.
   */

  const lastPersistedJsonRef =
    useRef("");


  /*
   * ==========================================================
   * LOAD CART WHEN ACCOUNT CHANGES
   * ==========================================================
   */

  useEffect(() => {
    let cancelled =
      false;


    async function loadCart() {
      /*
       * ------------------------------------------------------
       * WAIT FOR AUTH
       * ------------------------------------------------------
       */

      if (
        authLoading
      ) {
        return;
      }


      /*
       * ------------------------------------------------------
       * GUEST
       * ------------------------------------------------------
       */

      if (!user) {
        const guestItems =
          loadGuestCart();


        if (cancelled) {
          return;
        }


        const serialized =
          JSON.stringify(
            guestItems,
          );


        lastPersistedJsonRef.current =
          serialized;


        setItems(
          guestItems,
        );


        setInitialized(
          true,
        );


        console.log(
          "[CART ACCOUNT]",
          {
            uid: null,
            email: null,
          },
        );


        console.log(
          "[CART GUEST LOAD]",
          {
            itemCount:
              guestItems.length,
          },
        );


        return;
      }


      /*
       * ------------------------------------------------------
       * LOGGED-IN CUSTOMER
       * ------------------------------------------------------
       */

      const uid =
        user.uid;


      /*
       * Prevent the previous account's cart from
       * temporarily appearing for the new account.
       */

      setItems(
        [],
      );


      setInitialized(
        false,
      );


      lastPersistedJsonRef.current =
        "";


      console.log(
        "[CART ACCOUNT]",
        {
          uid,

          email:
            user.email ?? null,
        },
      );


      try {
        const safeItems =
          await loadCustomerCart(
            uid,
          );


        if (cancelled) {
          return;
        }


        const serialized =
          JSON.stringify(
            safeItems,
          );


        lastPersistedJsonRef.current =
          serialized;


        setItems(
          safeItems,
        );


        setInitialized(
          true,
        );


        console.log(
          "[CART LOADED FROM SUPABASE]",
          {
            uid,

            itemCount:
              safeItems.length,

            items:
              safeItems,
          },
        );

      } catch (
        error
      ) {
        console.error(
          "[CART LOAD FAILED]",
          {
            uid,
            error,
          },
        );


        if (cancelled) {
          return;
        }


        setItems(
          [],
        );


        /*
         * Keep false on failure so we do not accidentally
         * overwrite an existing server cart with [].
         */

        setInitialized(
          false,
        );
      }
    }


    void loadCart();


    return () => {
      cancelled =
        true;
    };
  }, [
    authLoading,
    user?.uid,
  ]);


  /*
   * ==========================================================
   * PERSIST CART
   * ==========================================================
   */

  useEffect(() => {
    if (
      authLoading ||
      !initialized
    ) {
      return;
    }


    const safeItems =
      normalizeCart(
        items,
      );


    const serialized =
      JSON.stringify(
        safeItems,
      );


    /*
     * Nothing changed.
     */

    if (
      serialized ===
      lastPersistedJsonRef.current
    ) {
      return;
    }


    /*
     * ========================================================
     * GUEST
     * ========================================================
     */

    if (!user) {
      saveGuestCart(
        safeItems,
      );


      lastPersistedJsonRef.current =
        serialized;


      console.log(
        "[CART SAVE GUEST]",
        {
          itemCount:
            safeItems.length,
        },
      );


      return;
    }


    /*
     * ========================================================
     * LOGGED-IN CUSTOMER
     * ========================================================
     */

    const uid =
      user.uid;


    let cancelled =
      false;


    async function persistCustomerCart() {
      try {
        await saveCustomerCart(
          uid,
          safeItems,
        );


        if (cancelled) {
          return;
        }


        /*
         * Mark as persisted only after Supabase
         * successfully accepts the write.
         */

        lastPersistedJsonRef.current =
          serialized;


        console.log(
          "[CART SAVED TO SUPABASE]",
          {
            uid,

            itemCount:
              safeItems.length,

            items:
              safeItems,
          },
        );

      } catch (
        error
      ) {
        console.error(
          "[CART SAVE FAILED]",
          {
            uid,
            error,
          },
        );
      }
    }


    void persistCustomerCart();


    return () => {
      cancelled =
        true;
    };
  }, [
    authLoading,
    initialized,
    items,
    user?.uid,
  ]);


  /*
   * ==========================================================
   * ADD TO CART
   * ==========================================================
   */

  function addToCart(
    product: Product,
    quantity = 1,
  ) {
    if (
      !isValidProduct(
        product,
      )
    ) {
      return;
    }


    if (
      !product.available ||
      product.stock <= 0
    ) {
      return;
    }


    const safeQuantity =
      Math.max(
        1,
        Math.floor(
          Number(
            quantity,
          ),
        ),
      );


    if (
      !Number.isFinite(
        safeQuantity,
      )
    ) {
      return;
    }


    setItems(
      (
        current,
      ) => {
        const existing =
          current.find(
            (
              item,
            ) =>
              item.product.id ===
              product.id,
          );


        if (!existing) {
          return [
            ...current,

            {
              product,

              quantity:
                Math.min(
                  safeQuantity,
                  product.stock,
                ),
            },
          ];
        }


        return current.map(
          (
            item,
          ) => {
            if (
              item.product.id !==
              product.id
            ) {
              return item;
            }


            return {
              product,

              quantity:
                Math.min(
                  existing.quantity +
                    safeQuantity,

                  Math.max(
                    product.stock,
                    1,
                  ),
                ),
            };
          },
        );
      },
    );
  }


  /*
   * ==========================================================
   * REMOVE FROM CART
   * ==========================================================
   */

  function removeFromCart(
    productId: string,
  ) {
    setItems(
      (
        current,
      ) =>
        current.filter(
          (
            item,
          ) =>
            item.product.id !==
            productId,
        ),
    );
  }


  /*
   * ==========================================================
   * UPDATE QUANTITY
   * ==========================================================
   */

  function updateQuantity(
    productId: string,
    quantity: number,
  ) {
    const safeQuantity =
      Math.floor(
        Number(
          quantity,
        ),
      );


    if (
      !Number.isFinite(
        safeQuantity,
      ) ||
      safeQuantity <= 0
    ) {
      removeFromCart(
        productId,
      );

      return;
    }


    setItems(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) => {
            if (
              item.product.id !==
              productId
            ) {
              return item;
            }


            return {
              ...item,

              quantity:
                Math.min(
                  safeQuantity,

                  Math.max(
                    item.product.stock,
                    1,
                  ),
                ),
            };
          },
        ),
    );
  }


  /*
   * ==========================================================
   * INCREASE QUANTITY
   * ==========================================================
   */

  function increaseQuantity(
    productId: string,
  ) {
    const item =
      items.find(
        (
          entry,
        ) =>
          entry.product.id ===
          productId,
      );


    if (!item) {
      return;
    }


    updateQuantity(
      productId,

      item.quantity +
        1,
    );
  }


  /*
   * ==========================================================
   * DECREASE QUANTITY
   * ==========================================================
   */

  function decreaseQuantity(
    productId: string,
  ) {
    const item =
      items.find(
        (
          entry,
        ) =>
          entry.product.id ===
          productId,
      );


    if (!item) {
      return;
    }


    updateQuantity(
      productId,

      item.quantity -
        1,
    );
  }


  /*
   * ==========================================================
   * CLEAR CART
   * ==========================================================
   */

  function clearCart() {
    setItems(
      [],
    );
  }


  /*
   * ==========================================================
   * GET ITEM QUANTITY
   * ==========================================================
   */

  function getItemQuantity(
    productId: string,
  ): number {
    return (
      items.find(
        (
          item,
        ) =>
          item.product.id ===
          productId,
      )?.quantity ??
      0
    );
  }


  /*
   * ==========================================================
   * SUBTOTAL
   * ==========================================================
   */

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            sum,
            item,
          ) => {
            const price =
              Number(
                item.product.price,
              );


            const quantity =
              Number(
                item.quantity,
              );


            if (
              !Number.isFinite(
                price,
              ) ||
              !Number.isFinite(
                quantity,
              )
            ) {
              return sum;
            }


            return (
              sum +
              price *
                quantity
            );
          },

          0,
        ),

      [
        items,
      ],
    );


  /*
   * ==========================================================
   * ITEM COUNT
   * ==========================================================
   */

  const itemCount =
    useMemo(
      () =>
        items.reduce(
          (
            count,
            item,
          ) =>
            count +
            item.quantity,

          0,
        ),

      [
        items,
      ],
    );


  /*
   * ==========================================================
   * CONTEXT VALUE
   * ==========================================================
   */

  const value:
    CartContextValue = {
    items,

    cartItems:
      items,

    addToCart,

    removeFromCart,

    updateQuantity,

    increaseQuantity,

    decreaseQuantity,

    clearCart,

    getItemQuantity,

    subtotal,

    total:
      subtotal,

    cartTotal:
      subtotal,

    itemCount,

    cartCount:
      itemCount,

    isEmpty:
      items.length ===
      0,
  };


  return (
    <CartContext.Provider
      value={
        value
      }
    >
      {
        children
      }
    </CartContext.Provider>
  );
}


/*
 * ==========================================================
 * HOOK
 * ==========================================================
 */

export function useCart() {
  const context =
    useContext(
      CartContext,
    );


  if (
    !context
  ) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }


  return context;
}


export default CartContext;