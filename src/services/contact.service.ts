import emailjs from "@emailjs/browser";

import {
  auth,
} from "../firebase/config";

import {
  supabase,
} from "../lib/supabase";

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

  firebaseUid?: string;

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
 * SUPABASE ROW
 * ==========================================================
 */

interface ContactRow {
  id: string;

  firebase_uid: string;

  name: string;

  email: string;

  phone: string;

  message: string;

  status: ContactStatus;

  admin_reply: string;

  replied_at: string | null;

  replied_by: string | null;

  created_at: string;

  updated_at: string;
}


/*
 * ==========================================================
 * EMAILJS CONFIG
 * ==========================================================
 */

const EMAILJS_SERVICE_ID =
  String(
    import.meta.env.VITE_EMAILJS_SERVICE_ID ??
      "",
  ).trim();


const EMAILJS_TEMPLATE_ID =
  String(
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ??
      "",
  ).trim();


const EMAILJS_PUBLIC_KEY =
  String(
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY ??
      "",
  ).trim();


/*
 * ==========================================================
 * SELECT COLUMNS
 * ==========================================================
 */

const CONTACT_COLUMNS = `
  id,
  firebase_uid,
  name,
  email,
  phone,
  message,
  status,
  admin_reply,
  replied_at,
  replied_by,
  created_at,
  updated_at
`;


/*
 * ==========================================================
 * ERROR HELPER
 * ==========================================================
 */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }


  return fallback;
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
 * MAP SUPABASE ROW
 * ==========================================================
 */

function mapContactMessage(
  row: ContactRow,
): ContactMessage {
  return {
    id:
      row.id,

    firebaseUid:
      row.firebase_uid,

    name:
      typeof row.name === "string"
        ? row.name
        : "",

    email:
      typeof row.email === "string"
        ? row.email
        : "",

    phone:
      typeof row.phone === "string"
        ? row.phone
        : "",

    message:
      typeof row.message === "string"
        ? row.message
        : "",

    status:
      isContactStatus(
        row.status,
      )
        ? row.status
        : "new",

    createdAt:
      row.created_at ??
      null,

    updatedAt:
      row.updated_at ??
      null,

    repliedAt:
      row.replied_at ??
      null,

    adminReply:
      typeof row.admin_reply ===
        "string"
        ? row.admin_reply
        : "",

    repliedBy:
      typeof row.replied_by ===
        "string"
        ? row.replied_by
        : undefined,
  };
}


/*
 * ==========================================================
 * REQUIRE FIREBASE USER
 * ==========================================================
 */

function requireFirebaseUser() {
  const user =
    auth.currentUser;


  if (!user) {
    throw new Error(
      "Please log in to continue.",
    );
  }


  return user;
}


/*
 * ==========================================================
 * SAVE CUSTOMER ENQUIRY
 * ==========================================================
 *
 * Firebase:
 *   identity
 *
 * Supabase:
 *   application data
 */

export async function saveContact(
  data: ContactData,
) {
  const user =
    requireFirebaseUser();


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


  const contactId =
    crypto.randomUUID();


  const {
    data: inserted,
    error,
  } =
    await supabase
      .from(
        "contacts",
      )
      .insert({
        id:
          contactId,

        firebase_uid:
          user.uid,

        name,

        email,

        phone,

        message,

        status:
          "new",

        admin_reply:
          "",

        replied_at:
          null,

        replied_by:
          null,

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .select(
        CONTACT_COLUMNS,
      )
      .single();


  if (
    error
  ) {
    throw error;
  }


  return {
    id:
      contactId,

    data:
      inserted
        ? mapContactMessage(
            inserted as ContactRow,
          )
        : null,
  };
}


/*
 * ==========================================================
 * GET CONTACT MESSAGES
 * ==========================================================
 *
 * Admin:
 *   receives all contacts through RLS.
 *
 * Customer:
 *   receives only own contacts.
 */

export async function getContactMessages():
  Promise<ContactMessage[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "contacts",
      )
      .select(
        CONTACT_COLUMNS,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  return (
    (data ?? []) as ContactRow[]
  ).map(
    mapContactMessage,
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
): () => void {
  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  const messagesMap =
    new Map<
      string,
      ContactMessage
    >();


  function emit() {
    if (
      stopped
    ) {
      return;
    }


    const messages =
      Array.from(
        messagesMap.values(),
      ).sort(
        (
          first,
          second,
        ) =>
          toTime(
            second.createdAt,
          ) -
          toTime(
            first.createdAt,
          ),
      );


    callback(
      messages,
    );
  }


  void (
    async () => {
      try {

        /*
         * Initial data.
         */

        const initial =
          await getContactMessages();


        if (
          stopped
        ) {
          return;
        }


        messagesMap.clear();


        for (
          const message of
            initial
        ) {
          messagesMap.set(
            message.id,
            message,
          );
        }


        emit();


        /*
         * Realtime channel.
         */

        channel =
          supabase
            .channel(
              `nexletronics-contacts-${Date.now()}`,
            )
            .on(
              "postgres_changes",
              {
                event:
                  "*",

                schema:
                  "public",

                table:
                  "contacts",
              },
              (
                payload,
              ) => {
                if (
                  stopped
                ) {
                  return;
                }


                /*
                 * DELETE
                 */

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
                    messagesMap.delete(
                      oldRow.id,
                    );
                  }


                  emit();

                  return;
                }


                /*
                 * INSERT / UPDATE
                 */

                const row =
                  payload.new as
                    ContactRow;


                if (
                  !row?.id
                ) {
                  return;
                }


                messagesMap.set(
                  row.id,
                  mapContactMessage(
                    row,
                  ),
                );


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
                  const error =
                    new Error(
                      "Unable to connect to the realtime enquiries database.",
                    );


                  console.error(
                    error,
                  );


                  onError?.(
                    error,
                  );
                }
              },
            );

      } catch (
        error
      ) {
        console.error(
          "Supabase contact listener failed:",
          error,
        );


        onError?.(
          error,
        );
      }
    }
  )();


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


/*
 * ==========================================================
 * UPDATE CONTACT STATUS
 * ==========================================================
 */

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
) {
  if (
    !id
  ) {
    throw new Error(
      "Contact ID is required.",
    );
  }


  const updates:
    Record<
      string,
      unknown
    > = {
      status,

      updated_at:
        new Date().toISOString(),
    };


  if (
    status ===
    "replied"
  ) {
    updates.replied_at =
      new Date().toISOString();

    updates.replied_by =
      auth.currentUser?.uid ??
      null;
  }


  const {
    error,
  } =
    await supabase
      .from(
        "contacts",
      )
      .update(
        updates,
      )
      .eq(
        "id",
        id,
      );


  if (
    error
  ) {
    throw error;
  }
}


/*
 * ==========================================================
 * SEND CUSTOMER REPLY
 * ==========================================================
 */

export async function saveContactReply(
  id: string,
  reply: string,
) {
  const cleanReply =
    reply.trim();


  if (
    !cleanReply
  ) {
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
   * ========================================================
   * LOAD ENQUIRY
   * ========================================================
   *
   * Normal customers cannot read other customers'
   * enquiries because Supabase RLS blocks them.
   *
   * Admin can read the row because of is_admin=true.
   */

  const {
    data: contact,
    error: contactError,
  } =
    await supabase
      .from(
        "contacts",
      )
      .select(
        CONTACT_COLUMNS,
      )
      .eq(
        "id",
        id,
      )
      .maybeSingle();


  if (
    contactError
  ) {
    throw contactError;
  }


  if (
    !contact
  ) {
    throw new Error(
      "The enquiry could not be found.",
    );
  }


  const message =
    contact as ContactRow;


  const customerName =
    typeof message.name ===
      "string" &&
    message.name.trim()
      ? message.name.trim()
      : "Customer";


  const customerEmail =
    typeof message.email ===
      "string"
      ? message.email.trim().toLowerCase()
      : "";


  if (
    !customerEmail
  ) {
    throw new Error(
      "The enquiry does not contain a customer email address.",
    );
  }


  if (
    !isValidEmail(
      customerEmail,
    )
  ) {
    throw new Error(
      "The enquiry contains an invalid customer email address.",
    );
  }


  /*
   * ========================================================
   * EMAILJS PARAMETERS
   * ========================================================
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

    subject:
      "Reply from Nexletronics",
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
   * ========================================================
   * SEND EMAIL
   * ========================================================
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
   * ========================================================
   * VERIFY EMAILJS
   * ========================================================
   */

  if (
    emailResponse.status !==
    200
  ) {
    throw new Error(
      "The email service returned an unexpected response.",
    );
  }


  /*
   * ========================================================
   * SAVE REPLY TO SUPABASE
   * ========================================================
   */

  const {
    error: updateError,
  } =
    await supabase
      .from(
        "contacts",
      )
      .update({
        admin_reply:
          cleanReply,

        status:
          "replied",

        replied_at:
          new Date().toISOString(),

        replied_by:
          auth.currentUser?.uid ??
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id,
      );


  if (
    updateError
  ) {
    throw updateError;
  }


  console.log(
    "[EMAILJS] Reply saved successfully",
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
 * Used by CustomerManager.
 *
 * This does not create a contact/enquiry record.
 */

export async function sendCustomerEmail(
  customerEmail: string,
  customerName: string,
  subject: string,
  message: string,
) {
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


  if (
    !cleanEmail
  ) {
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


  if (
    !cleanSubject
  ) {
    throw new Error(
      "Email subject cannot be empty.",
    );
  }


  if (
    !cleanMessage
  ) {
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
      recipient:
        cleanEmail,

      subject:
        cleanSubject,
    },
  );


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


    throw new Error(
      getErrorMessage(
        error,
        "Unable to send customer email.",
      ),
    );
  }


  if (
    emailResponse.status !==
    200
  ) {
    throw new Error(
      "The email service returned an unexpected response.",
    );
  }


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
  if (
    !id
  ) {
    throw new Error(
      "Contact ID is required.",
    );
  }


  const {
    error,
  } =
    await supabase
      .from(
        "contacts",
      )
      .delete()
      .eq(
        "id",
        id,
      );


  if (
    error
  ) {
    throw error;
  }
}


/*
 * ==========================================================
 * TIME
 * ==========================================================
 */

function toTime(
  value: unknown,
): number {
  if (
    value instanceof Date
  ) {
    return value.getTime();
  }


  if (
    typeof value ===
    "string"
  ) {
    const parsed =
      Date.parse(
        value,
      );


    return Number.isNaN(
      parsed,
    )
      ? 0
      : parsed;
  }


  if (
    typeof value ===
    "number"
  ) {
    return value;
  }


  return 0;
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