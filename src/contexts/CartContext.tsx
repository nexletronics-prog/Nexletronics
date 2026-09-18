import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type {
  Product,
} from "../types/product";

import {
  db,
} from "../firebase/config";

import {
  useAuth,
} from "../hooks/useAuth";


/*
 * ==========================================================
 * TYPES
 * ==========================================================
 */

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


/*
 * ==========================================================
 * CONTEXT
 * ==========================================================
 */

const CartContext =
  createContext<
    CartContextValue | undefined
  >(undefined);


/*
 * ==========================================================
 * CONSTANTS
 * ==========================================================
 */

const GUEST_CART_KEY =
  "nexletronics-cart:guest";


const CART_COLLECTION =
  "carts";


/*
 * ==========================================================
 * REMOVE UNDEFINED VALUES
 * ==========================================================
 *
 * Firestore does not accept undefined values.
 *
 * Product objects can contain optional fields such as:
 *
 * image
 * imageUrl
 * thumbnailImage
 * description
 * etc.
 *
 * This function recursively removes undefined values before
 * anything is written to Firestore.
 */

function removeUndefined(
  value: unknown,
): unknown {

  if (
    value ===
    undefined
  ) {

    return undefined;
  }


  if (
    value ===
    null
  ) {

    return null;
  }


  if (
    Array.isArray(
      value,
    )
  ) {

    return value
      .map(
        (
          item,
        ) =>
          removeUndefined(
            item,
          ),
      )
      .filter(
        (
          item,
        ) =>
          item !==
          undefined,
      );
  }


  if (
    typeof value ===
    "object"
  ) {

    const result:
      Record<
        string,
        unknown
      > = {};


    for (
      const [
        key,
        entry,
      ] of Object.entries(
        value as Record<
          string,
          unknown
        >,
      )
    ) {

      const cleaned =
        removeUndefined(
          entry,
        );


      if (
        cleaned !==
        undefined
      ) {

        result[
          key
        ] =
          cleaned;
      }
    }


    return result;
  }


  return value;
}


/*
 * ==========================================================
 * PRODUCT VALIDATION
 * ==========================================================
 */

function isValidProduct(
  value: unknown,
): value is Product {

  if (
    !value ||
    typeof value !==
      "object"
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
    typeof product.id ===
      "string" &&

    typeof product.price ===
      "number" &&

    Number.isFinite(
      product.price,
    ) &&

    typeof product.stock ===
      "number" &&

    Number.isFinite(
      product.stock,
    ) &&

    typeof product.available ===
      "boolean"
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
    !Array.isArray(
      value,
    )
  ) {

    return [];
  }


  const result:
    CartItem[] = [];


  for (
    const rawItem of value
  ) {

    if (
      !rawItem ||
      typeof rawItem !==
        "object"
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


    const numericQuantity =
      Number(
        item.quantity,
      );


    if (
      !Number.isFinite(
        numericQuantity,
      ) ||
      numericQuantity <=
        0
    ) {

      continue;
    }


    const stock =
      Math.max(
        1,
        Math.floor(
          Number(
            item.product.stock,
          ),
        ),
      );


    /*
     * Clean the product before keeping it in state.
     */

    const cleanedProduct =
      removeUndefined(
        item.product,
      ) as Product;


    result.push({

      product:
        cleanedProduct,

      quantity:
        Math.min(
          Math.floor(
            numericQuantity,
          ),
          stock,
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


    if (
      !raw
    ) {

      return [];
    }


    return normalizeCart(
      JSON.parse(
        raw,
      ),
    );

  } catch (
    error
  ) {

    console.error(
      "[CART] Guest load failed:",
      error,
    );


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
        removeUndefined(
          items,
        ),
      ),
    );

  } catch (
    error
  ) {

    console.error(
      "[CART] Guest save failed:",
      error,
    );
  }
}


/*
 * ==========================================================
 * CONVERT CART FOR FIRESTORE
 * ==========================================================
 */

function prepareCartForFirestore(
  items: CartItem[],
): CartItem[] {

  const normalized =
    normalizeCart(
      items,
    );


  return removeUndefined(
    normalized,
  ) as CartItem[];
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
  } =
    useAuth();


  /*
   * ========================================================
   * STATE
   * ========================================================
   */

  const [
    items,
    setItems,
  ] =
    useState<CartItem[]>(
      [],
    );


  const [
    ready,
    setReady,
  ] =
    useState(false);


  /*
   * ========================================================
   * UID REF
   * ========================================================
   */

  const activeUidRef =
    useRef<
      string | null
    >(null);


  /*
   * ========================================================
   * FIRESTORE LISTENER
   * ========================================================
   */

  useEffect(() => {

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

    if (
      !user
    ) {

      activeUidRef.current =
        null;


      setItems(
        loadGuestCart(),
      );


      setReady(
        true,
      );


      console.log(
        "[CART ACCOUNT]",
        {
          uid:
            null,

          email:
            null,
        },
      );


      return;
    }


    /*
     * ------------------------------------------------------
     * CUSTOMER
     * ------------------------------------------------------
     */

    const uid =
      user.uid;


    activeUidRef.current =
      uid;


    setItems(
      [],
    );


    setReady(
      false,
    );


    console.log(
      "[CART ACCOUNT]",
      {
        uid,
        email:
          user.email ??
          null,
      },
    );


    const cartRef =
      doc(
        db,
        CART_COLLECTION,
        uid,
      );


    console.log(
      "[CART LISTENER]",
      {
        uid,
        path:
          cartRef.path,
      },
    );


    const unsubscribe =
      onSnapshot(
        cartRef,

        async (
          snapshot,
        ) => {

          /*
           * Ignore callbacks belonging to an old account.
           */

          if (
            activeUidRef.current !==
            uid
          ) {

            return;
          }


          console.log(
            "[CART DOCUMENT]",
            {
              uid,
              path:
                cartRef.path,

              exists:
                snapshot.exists(),

              data:
                snapshot.exists()
                  ? snapshot.data()
                  : null,
            },
          );


          /*
           * ------------------------------------------------
           * NEW CUSTOMER CART
           * ------------------------------------------------
           */

          if (
            !snapshot.exists()
          ) {

            try {

              await setDoc(
                cartRef,

                {
                  userId:
                    uid,

                  items:
                    [],

                  updatedAt:
                    serverTimestamp(),
                },
              );


              console.log(
                "[CART CREATED]",
                {
                  uid,
                  path:
                    cartRef.path,
                },
              );

            } catch (
              error
            ) {

              console.error(
                "[CART CREATE FAILED]",
                {
                  uid,
                  error,
                },
              );

            }


            if (
              activeUidRef.current ===
              uid
            ) {

              setItems(
                [],
              );


              setReady(
                true,
              );

            }


            return;
          }


          /*
           * ------------------------------------------------
           * EXISTING CUSTOMER CART
           * ------------------------------------------------
           */

          const data =
            snapshot.data();


          const safeItems =
            normalizeCart(
              data.items,
            );


          console.log(
            "[CART LOADED]",
            {
              uid,
              path:
                cartRef.path,

              itemCount:
                safeItems.length,

              items:
                safeItems,
            },
          );


          /*
           * Repair old documents containing undefined /
           * invalid quantities.
           *
           * Because Firestore itself cannot store undefined,
           * this primarily repairs malformed legacy objects
           * or invalid quantities.
           */

          const cleanedForFirestore =
            prepareCartForFirestore(
              safeItems,
            );


          /*
           * Rewrite only if the serialized representation
           * differs.
           */

          try {

            const safeJson =
              JSON.stringify(
                cleanedForFirestore,
              );


            const currentJson =
              JSON.stringify(
                data.items ??
                  [],
              );


            if (
              safeJson !==
              currentJson
            ) {

              await setDoc(
                cartRef,

                {
                  userId:
                    uid,

                  items:
                    cleanedForFirestore,

                  updatedAt:
                    serverTimestamp(),
                },

                {
                  merge:
                    true,
                },
              );

            }

          } catch (
            error
          ) {

            console.error(
              "[CART REPAIR FAILED]",
              {
                uid,
                error,
              },
            );

          }


          /*
           * Apply THIS customer's cart only.
           */

          if (
            activeUidRef.current ===
            uid
          ) {

            setItems(
              safeItems,
            );


            setReady(
              true,
            );

          }

        },

        (
          error,
        ) => {

          console.error(
            "[CART REALTIME ERROR]",
            {
              uid,
              path:
                cartRef.path,

              error,
            },
          );


          if (
            activeUidRef.current ===
            uid
          ) {

            setItems(
              [],
            );


            setReady(
              false,
            );

          }

        },
      );


    return () => {

      console.log(
        "[CART LISTENER CLEANUP]",
        {
          uid,
          path:
            cartRef.path,
        },
      );


      unsubscribe();

    };

  }, [
    authLoading,
    user?.uid,
  ]);


  /*
   * ========================================================
   * FIRESTORE SAVE
   * ========================================================
   */

  async function saveCustomerCart(
    uid: string,
    nextItems: CartItem[],
  ): Promise<void> {

    if (
      !user ||
      user.uid !==
        uid
    ) {

      return;
    }


    if (
      activeUidRef.current !==
      uid
    ) {

      return;
    }


    /*
     * This is the critical fix.
     *
     * Every undefined property is removed before Firestore.
     */

    const safeItems =
      prepareCartForFirestore(
        nextItems,
      );


    const cartRef =
      doc(
        db,
        CART_COLLECTION,
        uid,
      );


    console.log(
      "[CART SAVE]",
      {
        uid,
        path:
          cartRef.path,

        itemCount:
          safeItems.length,

        items:
          safeItems,
      },
    );


    await setDoc(
      cartRef,

      {
        userId:
          uid,

        items:
          safeItems,

        updatedAt:
          serverTimestamp(),
      },

      {
        merge:
          true,
      },
    );


    console.log(
      "[CART SAVE SUCCESS]",
      {
        uid,
        path:
          cartRef.path,
      },
    );

  }


  /*
   * ========================================================
   * ADD
   * ========================================================
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

      console.warn(
        "[CART] Invalid product",
        product,
      );


      return;
    }


    if (
      !product.available ||
      product.stock <=
        0
    ) {

      return;
    }


    const numericQuantity =
      Math.floor(
        Number(
          quantity,
        ),
      );


    if (
      !Number.isFinite(
        numericQuantity,
      ) ||
      numericQuantity <=
        0
    ) {

      return;
    }


    /*
     * Customer cart must have finished loading.
     */

    if (
      user &&
      !ready
    ) {

      console.warn(
        "[CART] Customer cart is still loading",
        {
          uid:
            user.uid,
        },
      );


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


        let next:
          CartItem[];


        const cleanedProduct =
          removeUndefined(
            product,
          ) as Product;


        if (
          !existing
        ) {

          next = [
            ...current,

            {
              product:
                cleanedProduct,

              quantity:
                Math.min(
                  numericQuantity,
                  Math.max(
                    1,
                    product.stock,
                  ),
                ),
            },
          ];

        } else {

          next =
            current.map(
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

                  product:
                    cleanedProduct,

                  quantity:
                    Math.min(
                      existing.quantity +
                        numericQuantity,

                      Math.max(
                        1,
                        product.stock,
                      ),
                    ),

                };

              },
            );

        }


        /*
         * Save authenticated cart.
         */

        if (
          user
        ) {

          void saveCustomerCart(
            user.uid,
            next,
          ).catch(
            (
              error,
            ) => {

              console.error(
                "[CART] Add sync failed:",
                error,
              );

            },
          );

        } else {

          /*
           * Guest cart.
           */

          saveGuestCart(
            next,
          );

        }


        return next;
      },
    );
  }


  /*
   * ========================================================
   * REMOVE
   * ========================================================
   */

  function removeFromCart(
    productId: string,
  ) {

    if (
      user &&
      !ready
    ) {

      return;
    }


    setItems(
      (
        current,
      ) => {

        const next =
          current.filter(
            (
              item,
            ) =>
              item.product.id !==
              productId,
          );


        if (
          user
        ) {

          void saveCustomerCart(
            user.uid,
            next,
          ).catch(
            (
              error,
            ) => {

              console.error(
                "[CART] Remove sync failed:",
                error,
              );

            },
          );

        } else {

          saveGuestCart(
            next,
          );

        }


        return next;
      },
    );
  }


  /*
   * ========================================================
   * UPDATE QUANTITY
   * ========================================================
   */

  function updateQuantity(
    productId: string,
    quantity: number,
  ) {

    if (
      user &&
      !ready
    ) {

      return;
    }


    const numericQuantity =
      Math.floor(
        Number(
          quantity,
        ),
      );


    if (
      !Number.isFinite(
        numericQuantity,
      ) ||
      numericQuantity <=
        0
    ) {

      removeFromCart(
        productId,
      );


      return;
    }


    setItems(
      (
        current,
      ) => {

        const next =
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
                    numericQuantity,

                    Math.max(
                      1,
                      item.product.stock,
                    ),
                  ),

              };

            },
          );


        if (
          user
        ) {

          void saveCustomerCart(
            user.uid,
            next,
          ).catch(
            (
              error,
            ) => {

              console.error(
                "[CART] Update sync failed:",
                error,
              );

            },
          );

        } else {

          saveGuestCart(
            next,
          );

        }


        return next;
      },
    );
  }


  /*
   * ========================================================
   * INCREASE
   * ========================================================
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


    if (
      !item
    ) {

      return;
    }


    updateQuantity(
      productId,
      item.quantity +
        1,
    );
  }


  /*
   * ========================================================
   * DECREASE
   * ========================================================
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


    if (
      !item
    ) {

      return;
    }


    updateQuantity(
      productId,
      item.quantity -
        1,
    );
  }


  /*
   * ========================================================
   * CLEAR CART
   * ========================================================
   */

  function clearCart() {

    setItems(
      [],
    );


    if (
      user
    ) {

      void saveCustomerCart(
        user.uid,
        [],
      ).catch(
        (
          error,
        ) => {

          console.error(
            "[CART] Clear sync failed:",
            error,
          );

        },
      );

    } else {

      saveGuestCart(
        [],
      );

    }
  }


  /*
   * ========================================================
   * GET ITEM QUANTITY
   * ========================================================
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
   * ========================================================
   * SUBTOTAL
   * ========================================================
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
   * ========================================================
   * ITEM COUNT
   * ========================================================
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
   * ========================================================
   * VALUE
   * ========================================================
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