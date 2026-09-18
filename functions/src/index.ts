import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  setGlobalOptions,
} from "firebase-functions/v2";

import {
  defineSecret,
} from "firebase-functions/params";

import {
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

import nodemailer from "nodemailer";


/*
 * ==========================================================
 * GLOBAL CONFIG
 * ==========================================================
 */

setGlobalOptions({
  region:
    "asia-south1",

  maxInstances:
    10,
});


/*
 * ==========================================================
 * FIREBASE ADMIN
 * ==========================================================
 */

initializeApp();

const db =
  getFirestore();


/*
 * ==========================================================
 * EMAIL SECRETS
 * ==========================================================
 *
 * These values are stored securely in Firebase.
 *
 * They are NEVER sent to the browser.
 * ==========================================================
 */

const SMTP_HOST =
  defineSecret(
    "SMTP_HOST",
  );

const SMTP_PORT =
  defineSecret(
    "SMTP_PORT",
  );

const SMTP_USER =
  defineSecret(
    "SMTP_USER",
  );

const SMTP_PASS =
  defineSecret(
    "SMTP_PASS",
  );

const MAIL_FROM =
  defineSecret(
    "MAIL_FROM",
  );


/*
 * ==========================================================
 * TYPES
 * ==========================================================
 */

interface OrderItemInput {
  productId:
    string;

  quantity:
    number;
}


interface ShippingAddressInput {
  name:
    string;

  phone:
    string;

  email:
    string;

  address:
    string;

  city:
    string;

  state:
    string;

  pincode:
    string;
}


interface CreateSecureOrderData {
  items:
    OrderItemInput[];

  shippingAddress:
    ShippingAddressInput;
}


interface StoredOrderItem {
  productId:
    string;

  name:
    string;

  sku?:
    string;

  price:
    number;

  quantity:
    number;

  image?:
    string;

  category?:
    string;
}


/*
 * ==========================================================
 * CREATE SECURE ORDER
 * ==========================================================
 *
 * The browser sends only:
 *
 * - product IDs
 * - quantities
 * - delivery information
 *
 * The backend determines:
 *
 * - current product price
 * - current stock
 * - subtotal
 * - shipping
 * - total
 *
 * and atomically:
 *
 * - creates the order
 * - deducts stock
 * ==========================================================
 */

export const createSecureOrder =
  onCall(
    async (
      request,
    ) => {

      /*
       * ======================================================
       * AUTHENTICATION
       * ======================================================
       */

      if (
        !request.auth
      ) {

        throw new HttpsError(
          "unauthenticated",
          "You must be signed in to place an order.",
        );
      }


      const userId =
        request.auth.uid;


      const userEmail =
        typeof request.auth.token.email ===
        "string"
          ? request.auth.token.email
          : "";


      /*
       * ======================================================
       * INPUT
       * ======================================================
       */

      const data =
        request.data as
          | CreateSecureOrderData
          | undefined;


      if (
        !data
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Order data is required.",
        );
      }


      const items =
        data.items;


      const shippingAddress =
        data.shippingAddress;


      if (
        !Array.isArray(
          items,
        ) ||
        items.length ===
          0
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Your cart is empty.",
        );
      }


      if (
        !shippingAddress
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Delivery address is required.",
        );
      }


      /*
       * ======================================================
       * ADDRESS VALIDATION
       * ======================================================
       */

      const cleanedPhone =
        shippingAddress.phone.replace(
          /\D/g,
          "",
        );


      const cleanedName =
        shippingAddress.name.trim();


      const cleanedAddress =
        shippingAddress.address.trim();


      const cleanedCity =
        shippingAddress.city.trim();


      const cleanedState =
        shippingAddress.state.trim();


      const cleanedPincode =
        shippingAddress.pincode.trim();


      if (
        cleanedName.length <
          2 ||
        cleanedAddress.length <
          5 ||
        cleanedCity.length <
          2 ||
        cleanedState.length <
          2 ||
        !/^\d{10}$/.test(
          cleanedPhone,
        ) ||
        !/^\d{6}$/.test(
          cleanedPincode,
        )
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Please provide a valid delivery address.",
        );
      }


      /*
       * ======================================================
       * COMBINE DUPLICATE PRODUCTS
       * ======================================================
       */

      const quantities =
        new Map<
          string,
          number
        >();


      for (
        const item of items
      ) {

        if (
          !item ||
          typeof item.productId !==
            "string" ||
          item.productId.trim() ===
            ""
        ) {

          throw new HttpsError(
            "invalid-argument",
            "Invalid product ID.",
          );
        }


        if (
          !Number.isInteger(
            item.quantity,
          ) ||
          item.quantity <=
            0
        ) {

          throw new HttpsError(
            "invalid-argument",
            `Invalid quantity for product ${item.productId}.`,
          );
        }


        const oldQuantity =
          quantities.get(
            item.productId,
          ) ?? 0;


        quantities.set(
          item.productId,
          oldQuantity +
            item.quantity,
        );
      }


      /*
       * ======================================================
       * ATOMIC FIRESTORE TRANSACTION
       * ======================================================
       */

      const result =
        await db.runTransaction(
          async (
            transaction,
          ) => {

            const products =
              new Map<
                string,
                FirebaseFirestore.DocumentSnapshot
              >();


            /*
             * ------------------------------------------------
             * READ PRODUCTS
             * ------------------------------------------------
             */

            for (
              const [
                productId,
              ] of quantities
            ) {

              const productRef =
                db
                  .collection(
                    "products",
                  )
                  .doc(
                    productId,
                  );


              const snapshot =
                await transaction.get(
                  productRef,
                );


              if (
                !snapshot.exists
              ) {

                throw new HttpsError(
                  "not-found",
                  "One of the products no longer exists.",
                );
              }


              products.set(
                productId,
                snapshot,
              );
            }


            /*
             * ------------------------------------------------
             * CALCULATE ORDER
             * ------------------------------------------------
             */

            let subtotal =
              0;


            const orderItems:
              StoredOrderItem[] =
              [];


            for (
              const [
                productId,
                quantity,
              ] of quantities
            ) {

              const snapshot =
                products.get(
                  productId,
                );


              if (
                !snapshot
              ) {

                throw new HttpsError(
                  "not-found",
                  "Product could not be loaded.",
                );
              }


              const product =
                snapshot.data();


              if (
                !product
              ) {

                throw new HttpsError(
                  "not-found",
                  "Product information is unavailable.",
                );
              }


              const available =
                product.active ??
                product.available ??
                true;


              if (
                !available
              ) {

                throw new HttpsError(
                  "failed-precondition",
                  `"${String(
                    product.name ??
                      "Product",
                  )}" is currently unavailable.`,
                );
              }


              const stock =
                typeof product.stock ===
                "number"
                  ? product.stock
                  : 0;


              if (
                stock <
                quantity
              ) {

                throw new HttpsError(
                  "failed-precondition",
                  `Only ${stock} unit(s) of "${String(
                    product.name ??
                      "Product",
                  )}" are available.`,
                );
              }


              const price =
                typeof product.price ===
                "number"
                  ? product.price
                  : 0;


              if (
                !Number.isFinite(
                  price,
                ) ||
                price < 0
              ) {

                throw new HttpsError(
                  "failed-precondition",
                  `Invalid price for "${String(
                    product.name ??
                      "Product",
                  )}".`,
                );
              }


              subtotal +=
                price *
                quantity;


              const item:
                StoredOrderItem =
                {
                  productId,

                  name:
                    String(
                      product.name ??
                        "Product",
                    ),

                  price,

                  quantity,

                  ...(typeof product.sku ===
                    "string"
                    ? {
                        sku:
                          product.sku,
                      }
                    : {}),

                  ...(typeof product.imageUrl ===
                    "string"
                    ? {
                        image:
                          product.imageUrl,
                      }
                    : typeof product.image ===
                        "string"
                      ? {
                          image:
                            product.image,
                        }
                      : Array.isArray(
                            product.images,
                          ) &&
                          typeof product
                            .images?.[0] ===
                            "string"
                        ? {
                            image:
                              product
                                .images[0],
                          }
                        : {}),

                  ...(typeof product.category ===
                    "string"
                    ? {
                        category:
                          product.category,
                      }
                    : {}),
                };


              orderItems.push(
                item,
              );
            }


            /*
             * ------------------------------------------------
             * SHIPPING
             * ------------------------------------------------
             */

            const shipping =
              subtotal >=
              1000
                ? 0
                : 60;


            const total =
              subtotal +
              shipping;


            /*
             * ------------------------------------------------
             * CREATE ORDER
             * ------------------------------------------------
             */

            const orderRef =
              db
                .collection(
                  "orders",
                )
                .doc();


            transaction.set(
              orderRef,

              {
                userId,

                userEmail,

                items:
                  orderItems,

                shippingAddress: {

                  name:
                    cleanedName,

                  phone:
                    cleanedPhone,

                  email:
                    userEmail,

                  address:
                    cleanedAddress,

                  city:
                    cleanedCity,

                  state:
                    cleanedState,

                  pincode:
                    cleanedPincode,

                },

                subtotal,

                shipping,

                total,

                currency:
                  "INR",

                status:
                  "pending",

                paymentStatus:
                  "pending",

                paymentMethod:
                  "pending",

                createdAt:
                  FieldValue.serverTimestamp(),

                updatedAt:
                  FieldValue.serverTimestamp(),

              },
            );


            /*
             * ------------------------------------------------
             * DEDUCT STOCK
             * ------------------------------------------------
             */

            for (
              const [
                productId,
                quantity,
              ] of quantities
            ) {

              const snapshot =
                products.get(
                  productId,
                );


              if (
                !snapshot
              ) {

                throw new HttpsError(
                  "not-found",
                  "Product could not be updated.",
                );
              }


              const product =
                snapshot.data();


              const currentStock =
                typeof product?.stock ===
                "number"
                  ? product.stock
                  : 0;


              const productRef =
                db
                  .collection(
                    "products",
                  )
                  .doc(
                    productId,
                  );


              transaction.update(
                productRef,

                {
                  stock:
                    currentStock -
                    quantity,

                  updatedAt:
                    FieldValue.serverTimestamp(),
                },
              );
            }


            /*
             * ------------------------------------------------
             * RETURN
             * ------------------------------------------------
             */

            return {

              orderId:
                orderRef.id,

              subtotal,

              shipping,

              total,

            };

          },
        );


      return result;
    },
  );


/*
 * ==========================================================
 * SEND ENQUIRY REPLY
 * ==========================================================
 *
 * Admin → Enquiries → Reply
 *
 * This function:
 *
 * 1. verifies Firebase authentication
 * 2. verifies administrator role
 * 3. reads the enquiry
 * 4. sends the email through SMTP
 * 5. stores the reply in Firestore
 *
 * ==========================================================
 */

export const sendEnquiryReply =
  onCall(
    {
      region:
        "asia-south1",

      secrets: [
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        MAIL_FROM,
      ],
    },

    async (
      request,
    ) => {

      /*
       * ======================================================
       * AUTH
       * ======================================================
       */

      if (
        !request.auth
      ) {

        throw new HttpsError(
          "unauthenticated",
          "You must be signed in.",
        );
      }


      const adminUid =
        request.auth.uid;


      /*
       * ======================================================
       * ADMIN CHECK
       * ======================================================
       */

      const adminRef =
        db
          .collection(
            "users",
          )
          .doc(
            adminUid,
          );


      const adminSnapshot =
        await adminRef.get();


      if (
        !adminSnapshot.exists
      ) {

        throw new HttpsError(
          "permission-denied",
          "Admin account not found.",
        );
      }


      const adminData =
        adminSnapshot.data();


      if (
        adminData?.role !==
        "admin"
      ) {

        throw new HttpsError(
          "permission-denied",
          "Only administrators can send replies.",
        );
      }


      /*
       * ======================================================
       * REQUEST DATA
       * ======================================================
       */

      const data =
        request.data as
          | {
              contactId?: unknown;
              reply?: unknown;
            }
          | undefined;


      const contactId =
        typeof data?.contactId ===
        "string"
          ? data.contactId.trim()
          : "";


      const reply =
        typeof data?.reply ===
        "string"
          ? data.reply.trim()
          : "";


      if (
        !contactId
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Enquiry ID is required.",
        );
      }


      if (
        !reply
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Reply cannot be empty.",
        );
      }


      if (
        reply.length >
        10000
      ) {

        throw new HttpsError(
          "invalid-argument",
          "Reply is too long.",
        );
      }


      /*
       * ======================================================
       * LOAD ENQUIRY
       * ======================================================
       */

      const contactRef =
        db
          .collection(
            "contacts",
          )
          .doc(
            contactId,
          );


      const contactSnapshot =
        await contactRef.get();


      if (
        !contactSnapshot.exists
      ) {

        throw new HttpsError(
          "not-found",
          "This enquiry no longer exists.",
        );
      }


      const contact =
        contactSnapshot.data();


      const customerName =
        typeof contact?.name ===
        "string"
          ? contact.name.trim()
          : "Customer";


      const customerEmail =
        typeof contact?.email ===
        "string"
          ? contact.email.trim()
          : "";


      if (
        !customerEmail
      ) {

        throw new HttpsError(
          "failed-precondition",
          "This enquiry does not have a customer email address.",
        );
      }


      /*
       * ======================================================
       * SMTP SETTINGS
       * ======================================================
       */

      const smtpHost =
        SMTP_HOST.value().trim();


      const smtpPort =
        Number(
          SMTP_PORT.value(),
        );


      const smtpUser =
        SMTP_USER.value().trim();


      const smtpPass =
        SMTP_PASS.value();


      const mailFrom =
        MAIL_FROM.value().trim();


      if (
        !smtpHost ||
        !smtpPort ||
        !smtpUser ||
        !smtpPass ||
        !mailFrom
      ) {

        console.error(
          "SMTP configuration is incomplete.",
        );


        throw new HttpsError(
          "failed-precondition",
          "Email service is not configured.",
        );
      }


      /*
       * ======================================================
       * SMTP TRANSPORT
       * ======================================================
       */

      const transporter =
        nodemailer.createTransport(
          {
            host:
              smtpHost,

            port:
              smtpPort,

            secure:
              smtpPort ===
              465,

            auth: {
              user:
                smtpUser,

              pass:
                smtpPass,
            },
          },
        );


      /*
       * ======================================================
       * VERIFY SMTP
       * ======================================================
       */

      try {

        await transporter.verify();

      } catch (
        error
      ) {

        console.error(
          "SMTP verification failed:",
          error,
        );


        throw new HttpsError(
          "failed-precondition",
          "The email server configuration is invalid.",
        );
      }


      /*
       * ======================================================
       * EMAIL CONTENT
       * ======================================================
       */

      const subject =
        "Re: Nexletronics enquiry";


      const textBody = [
        `Hello ${customerName},`,
        "",
        reply,
        "",
        "Regards,",
        "Nexletronics",
      ].join(
        "\n",
      );


      const htmlBody =
        `
        <!DOCTYPE html>

        <html>

          <body
            style="
              margin:0;
              padding:0;
              background:#faf9f5;
              font-family:Arial,Helvetica,sans-serif;
              color:#222;
            "
          >

            <div
              style="
                max-width:680px;
                margin:40px auto;
                padding:32px;
                background:#ffffff;
                border:1px solid #e5e5e5;
                border-radius:20px;
              "
            >

              <h2
                style="
                  margin:0 0 24px;
                  color:#9b7e1d;
                "
              >
                Nexletronics
              </h2>

              <p>
                Hello ${escapeHtml(
                  customerName,
                )},
              </p>

              <div
                style="
                  white-space:pre-wrap;
                  line-height:1.7;
                  margin-top:20px;
                "
              >
                ${escapeHtml(
                  reply,
                )}
              </div>

              <p
                style="
                  margin-top:32px;
                  color:#555;
                "
              >
                Regards,<br />
                <strong>
                  Nexletronics
                </strong>
              </p>

            </div>

          </body>

        </html>
        `;


      /*
       * ======================================================
       * SEND EMAIL
       * ======================================================
       */

      try {

        const info =
          await transporter.sendMail(
            {
              from:
                mailFrom,

              to:
                customerEmail,

              replyTo:
                smtpUser,

              subject,

              text:
                textBody,

              html:
                htmlBody,
            },
          );


        console.log(
          "Enquiry email sent:",
          {
            contactId,

            to:
              customerEmail,

            messageId:
              info.messageId,
          },
        );

      } catch (
        error
      ) {

        console.error(
          "Failed to send enquiry email:",
          error,
        );


        throw new HttpsError(
          "internal",
          "The email could not be sent. Please try again.",
        );
      }


      /*
       * ======================================================
       * SAVE REPLY AFTER SUCCESSFUL EMAIL
       * ======================================================
       */

      await contactRef.update(
        {
          adminReply:
            reply,

          status:
            "replied",

          repliedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),

          repliedBy:
            adminUid,
        },
      );


      /*
       * ======================================================
       * RESULT
       * ======================================================
       */

      return {

        success:
          true,

        contactId,

        customerEmail,

        message:
          "Reply sent successfully.",

      };

    },
  );


/*
 * ==========================================================
 * ESCAPE HTML
 * ==========================================================
 */

function escapeHtml(
  value: string,
): string {

  return value
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}