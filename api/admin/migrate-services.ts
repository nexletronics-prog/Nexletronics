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
 * ENVIRONMENT
 * ==========================================================
 */

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


if (
  !supabaseUrl
) {
  throw new Error(
    "Missing SUPABASE_URL.",
  );
}


if (
  !supabaseServiceRoleKey
) {
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
 * HELPERS
 * ==========================================================
 */

function stringValue(
  value: unknown,
): string | null {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return null;
  }


  return value.trim();
}


function numberValue(
  value: unknown,
): number | null {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }


  const parsed =
    typeof value ===
      "number"
      ? value
      : Number(
          value,
        );


  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return null;
  }


  return parsed;
}


function booleanValue(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}


function timestampToIso(
  value: unknown,
): string | null {
  if (
    value &&
    typeof value ===
      "object" &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate ===
      "function"
  ) {
    return (
      (
        value as {
          toDate: () => Date;
        }
      ).toDate()
    ).toISOString();
  }


  if (
    value instanceof
    Date
  ) {
    return value.toISOString();
  }


  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    const parsed =
      new Date(
        value,
      );


    if (
      !Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return parsed.toISOString();
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
     * FIREBASE AUTHENTICATION
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
     * VERIFY ADMIN
     * ------------------------------------------------------
     */

    const decodedToken =
      await adminAuth.verifyIdToken(
        idToken,
      );


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
     * READ FIRESTORE SERVICES
     * ------------------------------------------------------
     */

    const snapshot =
      await adminDb
        .collection(
          "services",
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
          "No Firestore services were found.",
      });
    }


    /*
     * ------------------------------------------------------
     * CONVERT
     * ------------------------------------------------------
     */

    const rows =
      snapshot.docs.map(
        (
          document,
        ) => {
          const data =
            document.data();


          return {
            id:
              document.id,

            name:
              stringValue(
                data.name,
              ) ??
              "Unnamed service",

            slug:
              stringValue(
                data.slug,
              ) ??
              "",

            category:
              stringValue(
                data.category,
              ) ??
              "Technology Services",

            short_description:
              stringValue(
                data.shortDescription,
              ) ??
              "",

            description:
              stringValue(
                data.description,
              ) ??
              "",

            price:
              numberValue(
                data.price,
              ),

            price_label:
              stringValue(
                data.priceLabel,
              ),

            image:
              stringValue(
                data.image,
              ),

            featured:
              booleanValue(
                data.featured,
                false,
              ),

            active:
              booleanValue(
                data.active,
                true,
              ),

            created_at:
              timestampToIso(
                data.createdAt,
              ) ??
              new Date().toISOString(),

            updated_at:
              timestampToIso(
                data.updatedAt,
              ) ??
              new Date().toISOString(),
          };
        },
      );


    /*
     * ------------------------------------------------------
     * UPSERT
     * ------------------------------------------------------
     */

    const {
      error,
    } =
      await supabase
        .from(
          "services",
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
        "Firestore services",

      destination:
        "Supabase services",
    });

  } catch (
    error
  ) {
    console.error(
      "[SERVICE MIGRATION] Failed:",
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
          : "Service migration failed.",
    });
  }
}