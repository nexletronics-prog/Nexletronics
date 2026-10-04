import {
  createClient,
} from "@supabase/supabase-js";

import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  adminAuth,
  adminDb,
} from "../_lib/firebase-admin.mjs";


const supabaseUrl =
  process.env.VITE_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


if (
  !supabaseUrl
) {
  throw new Error(
    "Missing VITE_SUPABASE_URL.",
  );
}


if (
  !serviceRoleKey
) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY.",
  );
}


const supabase =
  createClient(
    supabaseUrl,
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


function stringValue(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function stringArray(
  value: unknown,
): string[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }


  return [
    ...new Set(
      value
        .filter(
          (
            item,
          ): item is string =>
            typeof item ===
              "string" &&
            item.trim().length >
              0,
        )
        .map(
          (
            item,
          ) =>
            item.trim(),
        ),
    ),
  ];
}


function numberValue(
  value: unknown,
): number {
  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


function timestampToIso(
  value: unknown,
): string | null {
  if (
    value &&
    typeof value ===
      "object" &&
    "toDate" in value
  ) {
    const timestamp =
      value as {
        toDate?: () => Date;
      };


    if (
      typeof timestamp.toDate ===
      "function"
    ) {
      const date =
        timestamp.toDate();


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
    return value.toISOString();
  }


  if (
    typeof value ===
    "string"
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
     * ======================================================
     * AUTH
     * ======================================================
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
     * ======================================================
     * PORTFOLIO
     * ======================================================
     */

    const portfolioSnapshot =
      await adminDb
        .collection(
          "customPortfolio",
        )
        .get();


    const rows =
      portfolioSnapshot.docs.map(
        (
          document,
        ) => {
          const data =
            document.data();


          const category =
            data.category ===
            "devices"
              ? "devices"
              : "website";


          return {
            id:
              document.id,

            title:
              stringValue(
                data.title,
              ) ||
              "Untitled project",

            slug:
              stringValue(
                data.slug,
              ) ||
              document.id,

            category,

            short_description:
              stringValue(
                data.shortDescription,
              ),

            description:
              stringValue(
                data.description,
              ),

            cover_image:
              stringValue(
                data.coverImage,
              ),

            gallery:
              stringArray(
                data.gallery,
              ),

            technologies:
              stringArray(
                data.technologies,
              ),

            client_industry:
              stringValue(
                data.clientIndustry,
              ) ||
              null,

            live_url:
              stringValue(
                data.liveUrl,
              ) ||
              null,

            featured:
              data.featured ===
              true,

            published:
              data.published !==
              false,

            sort_order:
              Number.isFinite(
                data.sortOrder,
              )
                ? Number(
                    data.sortOrder,
                  )
                : 0,

            created_at:
              timestampToIso(
                data.createdAt,
              ) ??
              new Date().toISOString(),

            updated_at:
              timestampToIso(
                data.updatedAt ??
                data.createdAt,
              ) ??
              new Date().toISOString(),
          };
        },
      );


    if (
      rows.length >
      0
    ) {
      const {
        error:
          portfolioError,
      } =
        await supabase
          .from(
            "custom_portfolio",
          )
          .upsert(
            rows,
            {
              onConflict:
                "id",
            },
          );


      if (
        portfolioError
      ) {
        throw portfolioError;
      }
    }


    /*
     * ======================================================
     * SHOWCASE SETTINGS
     * ======================================================
     */

    const settingsRef =
      adminDb
        .collection(
          "customShowcaseSettings",
        )
        .doc(
          "default",
        );


    const settingsSnapshot =
      await settingsRef.get();


    const settingsData =
      settingsSnapshot.exists
        ? settingsSnapshot.data()
        : {};


    const websitesEnabled =
      settingsData?.websitesEnabled !==
      false;


    const devicesEnabled =
      settingsData?.devicesEnabled !==
      false;


    const {
      error:
        settingsError,
    } =
      await supabase
        .from(
          "custom_showcase_settings",
        )
        .upsert(
          {
            id:
              "default",

            websites_enabled:
              websitesEnabled,

            devices_enabled:
              devicesEnabled,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "id",
          },
        );


    if (
      settingsError
    ) {
      throw settingsError;
    }


    /*
     * ======================================================
     * SUCCESS
     * ======================================================
     */

    return res.status(
      200,
    ).json({
      success:
        true,

      portfolio:
        rows.length,

      settings:
        {
          websitesEnabled,

          devicesEnabled,
        },

      source:
        "Firestore customPortfolio + customShowcaseSettings",

      destination:
        "Supabase custom_portfolio + custom_showcase_settings",
    });

  } catch (
    error
  ) {
    console.error(
      "[CUSTOM SHOWCASE MIGRATION] Failed:",
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
          : "Custom showcase migration failed.",
    });
  }
}