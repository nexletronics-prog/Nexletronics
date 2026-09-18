const GOOGLE_SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbw4fNWvfD8eSl97Z3l1S5ZQNUaF_gocd0ovDmLMDKbzkOAh8pF0fe0OyWmXGsIlLREi/exec";
export interface GoogleSheetOrderItem {
  name: string;

  quantity: number;

  price: number;

  sku?: string;
}


export interface GoogleSheetOrderAddress {
  name: string;

  phone: string;

  email: string;

  address: string;

  city: string;

  state: string;

  pincode: string;
}


export interface GoogleSheetOrderData {
  orderId: string;

  userId: string;

  userEmail: string;

  items: GoogleSheetOrderItem[];

  shippingAddress:
    GoogleSheetOrderAddress;

  subtotal: number;

  shipping: number;

  total: number;

  currency: string;

  paymentStatus: string;

  paymentMethod: string;

  status: string;

  createdAt?: string;
}


/*
 * ==========================================================
 * BACKUP ORDER TO GOOGLE SHEETS
 * ==========================================================
 */

export async function backupOrderToGoogleSheets(
  order: GoogleSheetOrderData,
): Promise<void> {

  const payload = {
    orderId:
      order.orderId,

    userId:
      order.userId,

    userEmail:
      order.userEmail,

    items:
      order.items.map(
        (
          item,
        ) => ({
          name:
            item.name,

          quantity:
            item.quantity,

          price:
            item.price,

          sku:
            item.sku ??
            "",
        }),
      ),

    shippingAddress:
      order.shippingAddress,

    subtotal:
      order.subtotal,

    shipping:
      order.shipping,

    total:
      order.total,

    currency:
      order.currency,

    paymentStatus:
      order.paymentStatus,

    paymentMethod:
      order.paymentMethod,

    status:
      order.status,

    createdAt:
      order.createdAt ??
      new Date().toISOString(),
  };


  try {

    /*
     * Google Apps Script accepts the POST.
     *
     * no-cors is intentional because the Apps Script web app
     * does not need to expose a browser-readable response.
     */

    await fetch(
      GOOGLE_SHEETS_WEB_APP_URL,

      {
        method:
          "POST",

        mode:
          "no-cors",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
        },

        body:
          JSON.stringify(
            payload,
          ),
      },
    );


    console.log(
      "Google Sheets backup submitted:",
      order.orderId,
    );

  } catch (
    error
  ) {

    console.error(
      "Google Sheets backup failed:",
      error,
    );


    /*
     * Do not throw.
     *
     * The Firebase order is already successful.
     */

  }
}