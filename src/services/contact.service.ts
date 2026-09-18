import emailjs from "@emailjs/browser";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  ContactData,
} from "../types/contact";


/*
 * ==========================================================
 * CONTACT STATUS
 * ==========================================================
 */

export type ContactStatus =
  | "new"
  | "read"
  | "replied"
  | "archived";


/*
 * ==========================================================
 * CONTACT MESSAGE
 * ==========================================================
 */

export interface ContactMessage {
  id: string;

  name: string;

  email: string;

  phone: string;

  message: string;

  status: ContactStatus;

  createdAt: unknown;

  updatedAt: unknown;

  repliedAt: unknown;

  adminReply: string;

  repliedBy?: string;
}


/*
 * ==========================================================
 * EMAILJS CONFIG
 * ==========================================================
 *
 * These values come from .env
 *
 * VITE_EMAILJS_SERVICE_ID
 * VITE_EMAILJS_TEMPLATE_ID
 * VITE_EMAILJS_PUBLIC_KEY
 */

const EMAILJS_SERVICE_ID =
  String(
    import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "",
  ).trim();


const EMAILJS_TEMPLATE_ID =
  String(
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "",
  ).trim();


const EMAILJS_PUBLIC_KEY =
  String(
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "",
  ).trim();


/*
 * ==========================================================
 * FIRESTORE COLLECTION
 * ==========================================================
 */

const contactsCollection =
  collection(
    db,
    "contacts",
  );


/*
 * ==========================================================
 * SAVE CUSTOMER ENQUIRY
 * ==========================================================
 */

export async function saveContact(
  data: ContactData,
) {

  const name =
    typeof data.name === "string"
      ? data.name.trim()
      : "";


  const email =
    typeof data.email === "string"
      ? data.email.trim().toLowerCase()
      : "";


  const phone =
    typeof data.phone === "string"
      ? data.phone.trim()
      : "";


  const message =
    typeof data.message === "string"
      ? data.message.trim()
      : "";


  if (!name) {
    throw new Error(
      "Please enter your name.",
    );
  }


  if (!email) {
    throw new Error(
      "Please enter your email address.",
    );
  }


  if (!message) {
    throw new Error(
      "Please enter your message.",
    );
  }


  return addDoc(
    contactsCollection,
    {
      name,

      email,

      phone,

      message,

      status:
        "new",

      adminReply:
        "",

      repliedAt:
        null,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    },
  );
}


/*
 * ==========================================================
 * GET CONTACT MESSAGES
 * ==========================================================
 *
 * Kept for compatibility with older code.
 */

export async function getContactMessages(): Promise<
  ContactMessage[]
> {

  const contactsQuery =
    query(
      contactsCollection,

      orderBy(
        "createdAt",
        "desc",
      ),
    );


  const snapshot =
    await getDocs(
      contactsQuery,
    );


  return snapshot.docs.map(
    (
      document,
    ) =>
      mapContactMessage(
        document.id,
        document.data(),
      ),
  );
}


/*
 * ==========================================================
 * REALTIME CONTACT MESSAGES
 * ==========================================================
 */

export function subscribeContactMessages(
  callback: (
    messages: ContactMessage[],
  ) => void,

  onError?: (
    error: unknown,
  ) => void,
) {

  const contactsQuery =
    query(
      contactsCollection,

      orderBy(
        "createdAt",
        "desc",
      ),
    );


  return onSnapshot(
    contactsQuery,

    (
      snapshot,
    ) => {

      const messages =
        snapshot.docs.map(
          (
            document,
          ) =>
            mapContactMessage(
              document.id,
              document.data(),
            ),
        );


      callback(
        messages,
      );
    },

    (
      error,
    ) => {

      console.error(
        "Realtime contact listener failed:",
        error,
      );


      if (
        onError
      ) {

        onError(
          error,
        );

      }

    },
  );
}


/*
 * ==========================================================
 * UPDATE STATUS
 * ==========================================================
 */

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
) {

  if (!id) {
    throw new Error(
      "Contact ID is required.",
    );
  }


  await updateDoc(
    doc(
      db,
      "contacts",
      id,
    ),

    {
      status,

      updatedAt:
        serverTimestamp(),

      ...(status === "replied"
        ? {
            repliedAt:
              serverTimestamp(),
          }
        : {}),
    },
  );
}


/*
 * ==========================================================
 * SEND CUSTOMER REPLY
 * ==========================================================
 *
 * Used by Admin → Enquiries.
 *
 * This sends the actual email through EmailJS and then
 * stores the reply in Firestore.
 */

export async function saveContactReply(
  id: string,
  reply: string,
) {

  const cleanReply =
    reply.trim();


  /*
   * --------------------------------------------------------
   * VALIDATION
   * --------------------------------------------------------
   */

  if (!cleanReply) {

    throw new Error(
      "Reply message cannot be empty.",
    );

  }


  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY
  ) {

    throw new Error(
      "EmailJS is not configured. Check your .env file.",
    );

  }


  /*
   * --------------------------------------------------------
   * LOAD ENQUIRY
   * --------------------------------------------------------
   */

  const contactRef =
    doc(
      db,
      "contacts",
      id,
    );


  const contactSnapshot =
    await getDoc(
      contactRef,
    );


  if (
    !contactSnapshot.exists()
  ) {

    throw new Error(
      "The enquiry could not be found.",
    );

  }


  const contact =
    contactSnapshot.data();


  const customerName =
    typeof contact.name === "string"
      ? contact.name.trim()
      : "Customer";


  const customerEmail =
    typeof contact.email === "string"
      ? contact.email.trim()
      : "";


  if (!customerEmail) {

    throw new Error(
      "The enquiry does not contain a customer email address.",
    );

  }


  /*
   * --------------------------------------------------------
   * EMAILJS PARAMETERS
   * --------------------------------------------------------
   */

  const templateParams = {

    to_email:
      customerEmail,

    customer_email:
      customerEmail,

    customer_name:
      customerName,

    reply_message:
      cleanReply,

    name:
      customerName,

    email:
      customerEmail,

    message:
      cleanReply,

    company_name:
      "Nexletronics",
  };


  console.log(
    "[EMAILJS] Sending enquiry reply",
    {
      serviceId:
        EMAILJS_SERVICE_ID,

      templateId:
        EMAILJS_TEMPLATE_ID,

      recipient:
        customerEmail,
    },
  );


  /*
   * --------------------------------------------------------
   * SEND EMAIL
   * --------------------------------------------------------
   */

  let emailResponse;

  try {

    emailResponse =
      await emailjs.send(
        EMAILJS_SERVICE_ID,

        EMAILJS_TEMPLATE_ID,

        templateParams,

        {
          publicKey:
            EMAILJS_PUBLIC_KEY,
        },
      );

  } catch (
    error
  ) {

    console.error(
      "[EMAILJS] Send failed:",
      error,
    );


    throw new Error(
      "EmailJS could not send the email. Check your EmailJS service, template and account settings.",
    );

  }


  /*
   * --------------------------------------------------------
   * VERIFY RESPONSE
   * --------------------------------------------------------
   */

  if (
    emailResponse.status !==
    200
  ) {

    console.error(
      "[EMAILJS] Unexpected response:",
      emailResponse,
    );


    throw new Error(
      "The email service returned an unexpected response.",
    );

  }


  /*
   * --------------------------------------------------------
   * SAVE REPLY
   * --------------------------------------------------------
   *
   * Only after EmailJS succeeds.
   */

  await updateDoc(
    contactRef,

    {
      adminReply:
        cleanReply,

      status:
        "replied",

      repliedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    },
  );


  console.log(
    "[EMAILJS] Reply sent successfully",
    {
      contactId:
        id,

      recipient:
        customerEmail,
    },
  );


  return {

    success:
      true,

    customerEmail,

    message:
      "Reply sent successfully.",
  };
}


/*
 * ==========================================================
 * SEND EMAIL TO CUSTOMER
 * ==========================================================
 *
 * Used by:
 *
 *     Admin → Customers
 *
 * This sends a standalone email to one customer.
 *
 * Multiple selected customers can call this function one by
 * one from CustomerManager.
 */

export async function sendCustomerEmail(
  customerEmail: string,
  customerName: string,
  subject: string,
  message: string,
) {

  /*
   * --------------------------------------------------------
   * CLEAN INPUT
   * --------------------------------------------------------
   */

  const cleanEmail =
    customerEmail
      .trim()
      .toLowerCase();


  const cleanName =
    customerName.trim() ||
    "Customer";


  const cleanSubject =
    subject.trim();


  const cleanMessage =
    message.trim();


  /*
   * --------------------------------------------------------
   * VALIDATION
   * --------------------------------------------------------
   */

  if (!cleanEmail) {

    throw new Error(
      "Customer email address is required.",
    );

  }


  if (
    !isValidEmail(
      cleanEmail,
    )
  ) {

    throw new Error(
      "Please provide a valid customer email address.",
    );

  }


  if (!cleanSubject) {

    throw new Error(
      "Email subject cannot be empty.",
    );

  }


  if (!cleanMessage) {

    throw new Error(
      "Email message cannot be empty.",
    );

  }


  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY
  ) {

    throw new Error(
      "EmailJS is not configured. Check your .env file.",
    );

  }


  /*
   * --------------------------------------------------------
   * EMAILJS PARAMETERS
   * --------------------------------------------------------
   *
   * We deliberately keep the existing variable names as
   * well as subject-specific variables.
   *
   * This gives compatibility with your current template.
   */

  const templateParams = {

    to_email:
      cleanEmail,

    customer_email:
      cleanEmail,

    customer_name:
      cleanName,

    subject:
      cleanSubject,

    reply_message:
      cleanMessage,

    name:
      cleanName,

    email:
      cleanEmail,

    message:
      cleanMessage,

    company_name:
      "Nexletronics",
  };


  console.log(
    "[EMAILJS] Sending customer email",
    {
      serviceId:
        EMAILJS_SERVICE_ID,

      templateId:
        EMAILJS_TEMPLATE_ID,

      recipient:
        cleanEmail,

      subject:
        cleanSubject,
    },
  );


  /*
   * --------------------------------------------------------
   * SEND EMAIL
   * --------------------------------------------------------
   */

  let emailResponse;

  try {

    emailResponse =
      await emailjs.send(
        EMAILJS_SERVICE_ID,

        EMAILJS_TEMPLATE_ID,

        templateParams,

        {
          publicKey:
            EMAILJS_PUBLIC_KEY,
        },
      );

  } catch (
    error
  ) {

    console.error(
      "[EMAILJS] Customer email failed:",
      error,
    );


    if (
      error instanceof Error
    ) {

      throw new Error(
        error.message,
      );

    }


    throw new Error(
      "Unable to send customer email.",
    );

  }


  /*
   * --------------------------------------------------------
   * VERIFY RESPONSE
   * --------------------------------------------------------
   */

  if (
    emailResponse.status !==
    200
  ) {

    console.error(
      "[EMAILJS] Unexpected customer email response:",
      emailResponse,
    );


    throw new Error(
      "The email service returned an unexpected response.",
    );

  }


  console.log(
    "[EMAILJS] Customer email sent successfully",
    {
      recipient:
        cleanEmail,

      subject:
        cleanSubject,
    },
  );


  return {

    success:
      true,

    customerEmail:
      cleanEmail,

    customerName:
      cleanName,

    message:
      "Email sent successfully.",
  };
}


/*
 * ==========================================================
 * DELETE CONTACT
 * ==========================================================
 */

export async function deleteContactMessage(
  id: string,
) {

  if (!id) {

    throw new Error(
      "Contact ID is required.",
    );

  }


  await deleteDoc(
    doc(
      db,
      "contacts",
      id,
    ),
  );
}


/*
 * ==========================================================
 * MAP FIRESTORE DATA
 * ==========================================================
 */

function mapContactMessage(
  id: string,
  data: Record<
    string,
    unknown
  >,
): ContactMessage {

  return {

    id,

    name:
      typeof data.name ===
        "string"
        ? data.name
        : "",

    email:
      typeof data.email ===
        "string"
        ? data.email
        : "",

    phone:
      typeof data.phone ===
        "string"
        ? data.phone
        : "",

    message:
      typeof data.message ===
        "string"
        ? data.message
        : "",

    status:
      isContactStatus(
        data.status,
      )
        ? data.status
        : "new",

    createdAt:
      data.createdAt ??
      null,

    updatedAt:
      data.updatedAt ??
      null,

    repliedAt:
      data.repliedAt ??
      null,

    adminReply:
      typeof data.adminReply ===
        "string"
        ? data.adminReply
        : "",

    repliedBy:
      typeof data.repliedBy ===
        "string"
        ? data.repliedBy
        : undefined,

  };
}


/*
 * ==========================================================
 * STATUS VALIDATOR
 * ==========================================================
 */

function isContactStatus(
  value: unknown,
): value is ContactStatus {

  return (
    value === "new" ||
    value === "read" ||
    value === "replied" ||
    value === "archived"
  );
}


/*
 * ==========================================================
 * EMAIL VALIDATOR
 * ==========================================================
 */

function isValidEmail(
  email: string,
): boolean {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}