import {
  createClient,
} from "@supabase/supabase-js";

import {
  requireAuth,
} from "../_lib/require-auth.mjs";


interface CartItemInput {
  productId: string;

  quantity: number;
}


interface AddressInput {
  name?: string;

  email?: string;

  phone?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  country?: string;

  companyName?: string;

  gstin?: string;
}


interface CreateOrderBody {
  items: CartItemInput[];

  customer?: {
    name?: string;

    email?: string;

    phone?: string;
  };

  shippingAddress?: AddressInput;

  billingAddress?: AddressInput;

  billingAddressSameAsShipping?: boolean;
}


function json(
  data: unknown,
  status = 200,
) {
  return Response.json(
    data,
    {
      status,

      headers: {
        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store",
      },
    },
  );
}


function cleanString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function normalizeQuantity(
  value: unknown,
): number {
  const quantity =
    Number(
      value,
    );


  if (
    !Number.isInteger(
      quantity,
    ) ||
    quantity <=
      0
  ) {
    return 0;
  }


  return quantity;
}


function normalizeAddress(
  address:
    | AddressInput
    | undefined,
) {
  if (
    !address
  ) {
    return null;
  }


  return {
    name:
      cleanString(
        address.name,
      ),

    email:
      cleanString(
        address.email,
      ).toLowerCase(),

    phone:
      cleanString(
        address.phone,
      ),

    address:
      cleanString(
        address.address,
      ),

    city:
      cleanString(
        address.city,
      ),

    state:
      cleanString(
        address.state,
      ),

    pincode:
      cleanString(
        address.pincode,
      ),

    country:
      cleanString(
        address.country,
      ) ||
      "India",

    companyName:
      cleanString(
        address.companyName,
      ),

    gstin:
      cleanString(
        address.gstin,
      ),
  };
}


function getSupabaseAdmin() {
  const url =
    process.env.VITE_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


  if (!url) {
    throw new Error(
      "Missing VITE_SUPABASE_URL.",
    );
  }


  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY.",
    );
  }


  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    },
  );
}


export async function POST(
  request: Request,
) {
  try {
    /*
     * ======================================================
     * FIREBASE AUTH
     * ======================================================
     */

    const user =
      await requireAuth(
        request,
      );


    /*
     * ======================================================
     * RAZORPAY CONFIG
     * ======================================================
     */

    const keyId =
      process.env
        .RAZORPAY_KEY_ID;

    const keySecret =
      process.env
        .RAZORPAY_KEY_SECRET;


    if (
      !keyId ||
      !keySecret
    ) {
      return json(
        {
          success:
            false,

          error:
            "Razorpay server configuration is missing.",
        },
        500,
      );
    }


    /*
     * ======================================================
     * SUPABASE ADMIN
     * ======================================================
     */

    const supabase =
      getSupabaseAdmin();


    /*
     * ======================================================
     * REQUEST
     * ======================================================
     */

    const body =
      (
        await request.json()
      ) as CreateOrderBody;


    if (
      !body ||
      !Array.isArray(
        body.items,
      ) ||
      body.items.length ===
        0
    ) {
      return json(
        {
          success:
            false,

          error:
            "Cart is empty.",
        },
        400,
      );
    }


    const requestedItems =
      body.items
        .map(
          (
            item,
          ) => ({
            productId:
              cleanString(
                item?.productId,
              ),

            quantity:
              normalizeQuantity(
                item?.quantity,
              ),
          }),
        )
        .filter(
          (
            item,
          ) =>
            item.productId &&
            item.quantity >
              0,
        );


    if (
      requestedItems.length ===
      0
    ) {
      return json(
        {
          success:
            false,

          error:
            "No valid cart items were provided.",
        },
        400,
      );
    }


    if (
      requestedItems.length >
      50
    ) {
      return json(
        {
          success:
            false,

          error:
            "Too many cart items.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * COMBINE DUPLICATES
     * ======================================================
     */

    const quantities =
      new Map<
        string,
        number
      >();


    for (
      const item of
        requestedItems
    ) {
      quantities.set(
        item.productId,
        (
          quantities.get(
            item.productId,
          ) ??
          0
        ) +
          item.quantity,
      );
    }


    const productIds =
      Array.from(
        quantities.keys(),
      );


    /*
     * ======================================================
     * LOAD PRODUCTS FROM SUPABASE
     * ======================================================
     *
     * This is now the single application source of truth.
     */

    const {
      data: products,
      error:
        productsError,
    } =
      await supabase
        .from(
          "products",
        )
        .select(
          `
            id,
            name,
            sku,
            price,
            stock,
            available,
            active,
            image,
            image_url,
            thumbnail_image,
            category
          `,
        )
        .in(
          "id",
          productIds,
        );


    if (
      productsError
    ) {
      throw productsError;
    }


    const productMap =
      new Map<
        string,
        Record<
          string,
          unknown
        >
      >();


    for (
      const product of
        (
          products ??
          []
        ) as Record<
          string,
          unknown
        >[]
    ) {
      productMap.set(
        String(
          product.id,
        ),
        product,
      );
    }


    /*
     * ======================================================
     * VALIDATE PRODUCTS
     * ======================================================
     */

    let subtotal =
      0;


    const validatedItems:
      Array<{
        productId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        sku?: string;
        image?: string;
        category?: string;
      }> = [];


    for (
      const productId of
        productIds
    ) {
      const quantity =
        quantities.get(
          productId,
        ) ??
        0;


      const product =
        productMap.get(
          productId,
        );


      if (
        !product
      ) {
        return json(
          {
            success:
              false,

            error:
              `Product ${productId} was not found.`,
          },
          400,
        );
      }


      const available =
        product.available ??
        product.active ??
        false;


      if (
        available !==
        true
      ) {
        return json(
          {
            success:
              false,

            error:
              `${
                product.name ??
                "A product"
              } is currently unavailable.`,
          },
          400,
        );
      }


      const unitPrice =
        Number(
          product.price,
        );


      if (
        !Number.isFinite(
          unitPrice,
        ) ||
        unitPrice <
          0
      ) {
        return json(
          {
            success:
              false,

            error:
              `Invalid price configured for ${
                product.name ??
                productId
              }.`,
          },
          500,
        );
      }


      const stock =
        Number(
          product.stock,
        );


      if (
        !Number.isFinite(
          stock,
        ) ||
        stock <
          0
      ) {
        return json(
          {
            success:
              false,

            error:
              `Invalid stock configured for ${
                product.name ??
                productId
              }.`,
          },
          500,
        );
      }


      if (
        quantity >
        stock
      ) {
        return json(
          {
            success:
              false,

            error:
              `${
                product.name ??
                "Product"
              } does not have enough stock.`,

            availableStock:
              stock,

            requestedQuantity:
              quantity,
          },
          400,
        );
      }


      const lineTotal =
        unitPrice *
        quantity;


      subtotal +=
        lineTotal;


      const image =
        cleanString(
          product.thumbnail_image,
        ) ||
        cleanString(
          product.image_url,
        ) ||
        cleanString(
          product.image,
        );


      validatedItems.push({
        productId,

        name:
          cleanString(
            product.name,
          ) ||
          "Unnamed product",

        quantity,

        unitPrice,

        lineTotal,

        sku:
          cleanString(
            product.sku,
          ) ||
          undefined,

        image:
          image ||
          undefined,

        category:
          cleanString(
            product.category,
          ) ||
          undefined,
      });
    }


    subtotal =
      Math.round(
        (
          subtotal +
          Number.EPSILON
        ) *
          100,
      ) /
      100;


    /*
     * ======================================================
     * SHIPPING
     * ======================================================
     *
     * Keep the existing Checkout behaviour:
     * create-order currently uses free shipping.
     */

    const shippingAmount =
      0;


    const taxAmount =
      0;


    const discountAmount =
      0;


    const total =
      Math.max(
        0,
        subtotal +
          shippingAmount +
          taxAmount -
          discountAmount,
      );


    const amountInPaise =
      Math.round(
        total *
          100,
      );


    if (
      !Number.isInteger(
        amountInPaise,
      ) ||
      amountInPaise <=
        0
    ) {
      return json(
        {
          success:
            false,

          error:
            "Calculated order amount is invalid.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * CUSTOMER DATA
     * ======================================================
     */

    const shippingAddress =
      normalizeAddress(
        body.shippingAddress,
      );


    let billingAddress =
      normalizeAddress(
        body.billingAddress,
      );


    const billingSame =
      body.billingAddressSameAsShipping ===
      true;


    if (
      billingSame &&
      shippingAddress
    ) {
      billingAddress =
        shippingAddress;
    }


    const customerName =
      cleanString(
        body.customer?.name,
      ) ||
      cleanString(
        user.name,
      );


    const customerEmail =
      cleanString(
        body.customer?.email,
      ) ||
      cleanString(
        user.email,
      );


    const customerPhone =
      cleanString(
        body.customer?.phone,
      );


    if (
      !customerName ||
      !customerEmail
    ) {
      return json(
        {
          success:
            false,

          error:
            "Customer name and email are required.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * RAZORPAY ORDER
     * ======================================================
     */

    const receipt =
      `NX-${Date.now()}-${user.uid.slice(
        0,
        8,
      )}`;


    const authorization =
      Buffer.from(
        `${keyId}:${keySecret}`,
      ).toString(
        "base64",
      );


    const razorpayResponse =
      await fetch(
        "https://api.razorpay.com/v1/orders",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Basic ${authorization}`,
          },

          body:
            JSON.stringify({
              amount:
                amountInPaise,

              currency:
                "INR",

              receipt,

              payment_capture:
                1,

              notes: {
                firebaseUid:
                  user.uid,

                email:
                  customerEmail,

                itemCount:
                  String(
                    validatedItems.length,
                  ),
              },
            }),
        },
      );


    const razorpayData =
      await razorpayResponse.json();


    if (
      !razorpayResponse.ok
    ) {
      console.error(
        "[create-order] Razorpay error:",
        razorpayData,
      );


      return json(
        {
          success:
            false,

          error:
            "Unable to create Razorpay order.",
        },
        502,
      );
    }


    const razorpayOrderId =
      cleanString(
        razorpayData?.id,
      );


    if (
      !razorpayOrderId
    ) {
      return json(
        {
          success:
            false,

          error:
            "Razorpay did not return an order ID.",
        },
        502,
      );
    }


    /*
     * ======================================================
     * SAVE PAYMENT SESSION IN SUPABASE
     * ======================================================
     */

    const {
      error:
        sessionError,
    } =
      await supabase
        .from(
          "payment_sessions",
        )
        .insert({
          razorpay_order_id:
            razorpayOrderId,

          receipt,

          user_id:
            user.uid,

          user_email:
            customerEmail,

          customer: {
            name:
              customerName,

            email:
              customerEmail,

            phone:
              customerPhone,
          },

          items:
            validatedItems,

          shipping_address:
            shippingAddress,

          billing_address:
            billingAddress,

          billing_address_same_as_shipping:
            billingSame,

          subtotal,

          shipping_amount:
            shippingAmount,

          tax_amount:
            taxAmount,

          discount_amount:
            discountAmount,

          total,

          amount_in_paise:
            amountInPaise,

          currency:
            "INR",

          status:
            "created",

          created_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString(),
        });


    if (
      sessionError
    ) {
      console.error(
        "[create-order] Failed to save payment session:",
        sessionError,
      );


      return json(
        {
          success:
            false,

          error:
            "Unable to initialize payment session.",
        },
        500,
      );
    }


    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return json({
      success:
        true,

      orderId:
        razorpayOrderId,

      keyId,

      amount:
        amountInPaise,

      currency:
        "INR",

      totals: {
        subtotal,

        shipping:
          shippingAmount,

        tax:
          taxAmount,

        discount:
          discountAmount,

        total,
      },

      items:
        validatedItems,
    });

  } catch (
    error
  ) {
    console.error(
      "[create-order] FATAL ERROR:",
      error,
    );


    return json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to create payment order.",
      },
      500,
    );
  }
}