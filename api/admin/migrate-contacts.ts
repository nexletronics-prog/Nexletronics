import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  adminAuth,
  adminDb,
} from "../_lib/firebase-admin.mjs";


/*
 * ==========================================================
 * SUPABASE SERVER CLIENT
 * ==========================================================
 */

const supabaseUrl =
  process.env.VITE_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL.",
  );
}


if (!supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY.",
  );
}


const supabase =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    },
  );


/*
 * ==========================================================
 * STRING HELPER
 * ==========================================================
 */

function stringValue(
  value: unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


/*
 * ==========================================================
 * STATUS HELPER
 * ==========================================================
 */

function normalizeStatus(
  value: unknown,
): "new" |
  "read" |
  "replied" |
  "archived" {
  if (
    value ===
    "read"
  ) {
    return "read";
  }


  if (
    value ===
    "replied"
  ) {
    return "replied";
  }


  if (
    value ===
    "archived"
  ) {
    return "archived";
  }


  return "new";
}


/*
 * ==========================================================
 * FIRESTORE TIMESTAMP → ISO
 * ==========================================================
 */

function timestampToIso(
  value: unknown,
): string | null {
  if (
    value &&
    typeof value ===
      "object" &&
    "toDate" in value
  ) {
    const firestoreTimestamp =
      value as {
        toDate?: () => Date;
      };


    if (
      typeof firestoreTimestamp.toDate ===
      "function"
    ) {
      const date =
        firestoreTimestamp.toDate();


      if (
        date instanceof Date &&
        !Number.isNaN(
          date.getTime(),
        )
      ) {
        return date.toISOString();
      }
    }
  }


  if (
    value instanceof Date
  ) {
    if (
      !Number.isNaN(
        value.getTime(),
      )
    ) {
      return value.toISOString();
    }


    return null;
  }


  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    const date =
      new Date(
        value,
      );


    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date.toISOString();
    }
  }


  if (
    typeof value ===
    "number"
  ) {
    const date =
      new Date(
        value,
      );


    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date.toISOString();
    }
  }


  return null;
}


/*
 * ==========================================================
 * HANDLER
 * ==========================================================
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  /*
   * --------------------------------------------------------
   * METHOD
   * --------------------------------------------------------
   */

  if (
    req.method !==
    "POST"
  ) {
    return res.status(
      405,
    ).json({
      success:
        false,

      error:
        "Method not allowed.",
    });
  }


  try {
    /*
     * ------------------------------------------------------
     * FIREBASE AUTHORIZATION
     * ------------------------------------------------------
     */

    const authorization =
      req.headers.authorization;


    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer ",
      )
    ) {
      return res.status(
        401,
      ).json({
        success:
          false,

        error:
          "Firebase authentication required.",
      });
    }


    const idToken =
      authorization
        .slice(7)
        .trim();


    if (
      !idToken
    ) {
      return res.status(
        401,
      ).json({
        success:
          false,

        error:
          "Missing Firebase ID token.",
      });
    }


    /*
     * ------------------------------------------------------
     * VERIFY FIREBASE TOKEN
     * ------------------------------------------------------
     */

    const decodedToken =
      await adminAuth.verifyIdToken(
        idToken,
      );


    /*
     * ------------------------------------------------------
     * ADMIN CHECK
     * ------------------------------------------------------
     */

    if (
      decodedToken.is_admin !==
      true
    ) {
      return res.status(
        403,
      ).json({
        success:
          false,

        error:
          "Admin permissions required.",
      });
    }


    /*
     * ------------------------------------------------------
     * READ FIRESTORE CONTACTS
     * ------------------------------------------------------
     */

    const snapshot =
      await adminDb
        .collection(
          "contacts",
        )
        .get();


    if (
      snapshot.empty
    ) {
      return res.status(
        200,
      ).json({
        success:
          true,

        migrated:
          0,

        message:
          "No Firestore contacts were found.",
      });
    }


    /*
     * ------------------------------------------------------
     * CONVERT FIRESTORE DOCUMENTS
     * ------------------------------------------------------
     */

    const rows =
      snapshot.docs.map(
        (
          document,
        ) => {
          const data =
            document.data();


          const firebaseUid =
            stringValue(
              data.firebaseUid ??
              data.uid ??
              data.userId,
            );


          const status =
            normalizeStatus(
              data.status,
            );


          const createdAt =
            timestampToIso(
              data.createdAt ??
              data.created_at,
            ) ??
            new Date().toISOString();


          const updatedAt =
            timestampToIso(
              data.updatedAt ??
              data.updated_at,
            ) ??
            createdAt;


          const repliedAt =
            timestampToIso(
              data.repliedAt ??
              data.replied_at,
            );


          return {
            id:
              document.id,

            /*
             * Legacy records may not have had a Firebase
             * UID. Keep a deterministic migration identifier
             * so the row can still be preserved.
             */

            firebase_uid:
              firebaseUid ||
              `legacy-${document.id}`,

            name:
              stringValue(
                data.name,
              ),

            email:
              stringValue(
                data.email,
              ).toLowerCase(),

            phone:
              stringValue(
                data.phone,
              ),

            message:
              stringValue(
                data.message,
              ),

            status,

            admin_reply:
              stringValue(
                data.adminReply ??
                data.admin_reply,
              ),

            replied_at:
              repliedAt,

            replied_by:
              stringValue(
                data.repliedBy ??
                data.replied_by,
              ) ||
              null,

            created_at:
              createdAt,

            updated_at:
              updatedAt,
          };
        },
      );


    /*
     * ------------------------------------------------------
     * UPSERT TO SUPABASE
     * ------------------------------------------------------
     */

    const {
      error,
    } =
      await supabase
        .from(
          "contacts",
        )
        .upsert(
          rows,
          {
            onConflict:
              "id",
          },
        );


    if (
      error
    ) {
      throw error;
    }


    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    return res.status(
      200,
    ).json({
      success:
        true,

      migrated:
        rows.length,

      source:
        "Firestore contacts",

      destination:
        "Supabase contacts",
    });

  } catch (
    error
  ) {
    console.error(
      "[CONTACT MIGRATION] Failed:",
      error,
    );


    return res.status(
      500,
    ).json({
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Contact migration failed.",
    });
  }
}