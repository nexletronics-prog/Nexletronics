import { supabase } from "../lib/supabase";
import type { GlobalWebsiteSettings } from "../types/siteSettings";

const GLOBAL_TABLE = "global_website_settings";
const GLOBAL_ID = "global";

/*
 * Each realtime subscription gets its own unique channel name.
 * This prevents React development remounts / Strict Mode from
 * reusing a channel that has already been subscribed.
 */
let channelCounter = 0;


export const defaultGlobalWebsiteSettings: GlobalWebsiteSettings = {
  companyName: "Nexletronics",
  companyEmail: "info@nexletronics.com",
  companyPhone: "",
  companyAddress: "",
  footerDescription:
    "Technology, electronics and innovation solutions built for real-world applications.",
  copyrightText: "Nexletronics. All rights reserved.",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  currency: "INR",
  maintenanceMode: false,
  emailLogin: true,
  googleLogin: true,
  checkoutEnabled: true,
};


interface GlobalRow {
  id: string;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  footer_description: string | null;
  copyright_text: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  currency: string | null;
  maintenance_mode: boolean | null;
  email_login: boolean | null;
  google_login: boolean | null;
  checkout_enabled: boolean | null;
  updated_at: string | null;
}


const GLOBAL_COLUMNS = `
  id,
  company_name,
  company_email,
  company_phone,
  company_address,
  footer_description,
  copyright_text,
  instagram_url,
  facebook_url,
  youtube_url,
  linkedin_url,
  currency,
  maintenance_mode,
  email_login,
  google_login,
  checkout_enabled,
  updated_at
`;


function clean(
  value: unknown,
  fallback: string,
): string {
  return typeof value === "string"
    ? value
    : fallback;
}


function normalize(
  row?: Partial<GlobalRow> | null,
): GlobalWebsiteSettings {
  return {
    ...defaultGlobalWebsiteSettings,

    companyName: clean(
      row?.company_name,
      defaultGlobalWebsiteSettings.companyName,
    ),

    companyEmail: clean(
      row?.company_email,
      defaultGlobalWebsiteSettings.companyEmail,
    ),

    companyPhone: clean(
      row?.company_phone,
      defaultGlobalWebsiteSettings.companyPhone,
    ),

    companyAddress: clean(
      row?.company_address,
      defaultGlobalWebsiteSettings.companyAddress,
    ),

    footerDescription: clean(
      row?.footer_description,
      defaultGlobalWebsiteSettings.footerDescription,
    ),

    copyrightText: clean(
      row?.copyright_text,
      defaultGlobalWebsiteSettings.copyrightText,
    ),

    instagramUrl: clean(
      row?.instagram_url,
      defaultGlobalWebsiteSettings.instagramUrl,
    ),

    facebookUrl: clean(
      row?.facebook_url,
      defaultGlobalWebsiteSettings.facebookUrl,
    ),

    youtubeUrl: clean(
      row?.youtube_url,
      defaultGlobalWebsiteSettings.youtubeUrl,
    ),

    linkedinUrl: clean(
      row?.linkedin_url,
      defaultGlobalWebsiteSettings.linkedinUrl,
    ),

    currency: clean(
      row?.currency,
      defaultGlobalWebsiteSettings.currency,
    ),

    maintenanceMode:
      typeof row?.maintenance_mode ===
      "boolean"
        ? row.maintenance_mode
        : defaultGlobalWebsiteSettings.maintenanceMode,

    emailLogin:
      typeof row?.email_login ===
      "boolean"
        ? row.email_login
        : defaultGlobalWebsiteSettings.emailLogin,

    googleLogin:
      typeof row?.google_login ===
      "boolean"
        ? row.google_login
        : defaultGlobalWebsiteSettings.googleLogin,

    checkoutEnabled:
      typeof row?.checkout_enabled ===
      "boolean"
        ? row.checkout_enabled
        : defaultGlobalWebsiteSettings.checkoutEnabled,

    updatedAt:
      row?.updated_at ??
      undefined,
  };
}


function toRow(
  settings: GlobalWebsiteSettings,
) {
  return {
    id: GLOBAL_ID,

    company_name:
      settings.companyName.trim(),

    company_email:
      settings.companyEmail.trim(),

    company_phone:
      settings.companyPhone.trim(),

    company_address:
      settings.companyAddress.trim(),

    footer_description:
      settings.footerDescription.trim(),

    copyright_text:
      settings.copyrightText.trim(),

    instagram_url:
      settings.instagramUrl.trim(),

    facebook_url:
      settings.facebookUrl.trim(),

    youtube_url:
      settings.youtubeUrl.trim(),

    linkedin_url:
      settings.linkedinUrl.trim(),

    currency:
      settings.currency.trim() ||
      "INR",

    maintenance_mode:
      Boolean(
        settings.maintenanceMode,
      ),

    email_login:
      Boolean(
        settings.emailLogin,
      ),

    google_login:
      Boolean(
        settings.googleLogin,
      ),

    checkout_enabled:
      Boolean(
        settings.checkoutEnabled,
      ),
  };
}


/*
 * ==========================================================
 * GET SETTINGS
 * ==========================================================
 */

export async function getGlobalWebsiteSettings(): Promise<GlobalWebsiteSettings> {
  const {
    data,
    error,
  } = await supabase
    .from(
      GLOBAL_TABLE,
    )
    .select(
      GLOBAL_COLUMNS,
    )
    .eq(
      "id",
      GLOBAL_ID,
    )
    .maybeSingle();


  if (
    error
  ) {
    console.error(
      "Failed to load global website settings:",
      error,
    );

    return {
      ...defaultGlobalWebsiteSettings,
    };
  }


  return normalize(
    (data ?? null) as GlobalRow | null,
  );
}


/*
 * ==========================================================
 * REALTIME SUBSCRIPTION
 * ==========================================================
 */

export function subscribeToGlobalWebsiteSettings(
  onChange: (
    settings: GlobalWebsiteSettings,
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): () => void {
  let active = true;


  /*
   * --------------------------------------------------------
   * INITIAL DATABASE LOAD
   * --------------------------------------------------------
   */

  void getGlobalWebsiteSettings()
    .then(
      (
        settings,
      ) => {
        if (
          active
        ) {
          onChange(
            settings,
          );
        }
      },
    )
    .catch(
      (
        error: unknown,
      ) => {
        if (
          !active
        ) {
          return;
        }


        const normalized =
          error instanceof Error
            ? error
            : new Error(
                String(
                  error,
                ),
              );


        onError?.(
          normalized,
        );
      },
    );


  /*
   * --------------------------------------------------------
   * UNIQUE CHANNEL
   * --------------------------------------------------------
   *
   * Never reuse the same channel name for separate React
   * subscriptions.
   */

  channelCounter += 1;


  const channelName =
    `global-website-settings-${GLOBAL_ID}-${channelCounter}`;


  const channel =
    supabase.channel(
      channelName,
    );


  /*
   * --------------------------------------------------------
   * REGISTER REALTIME CALLBACK FIRST
   * --------------------------------------------------------
   */

  channel.on(
    "postgres_changes",

    {
      event: "*",

      schema: "public",

      table: GLOBAL_TABLE,

      filter:
        `id=eq.${GLOBAL_ID}`,
    },

    (
      payload,
    ) => {
      if (
        !active
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
        onChange({
          ...defaultGlobalWebsiteSettings,
        });

        return;
      }


      /*
       * INSERT / UPDATE
       */

      onChange(
        normalize(
          payload.new as GlobalRow,
        ),
      );
    },
  );


  /*
   * --------------------------------------------------------
   * SUBSCRIBE ONLY AFTER .on()
   * --------------------------------------------------------
   */

  void channel.subscribe(
    (
      status,
    ) => {
      if (
        !active
      ) {
        return;
      }


      if (
        status ===
          "CHANNEL_ERROR" ||
        status ===
          "TIMED_OUT"
      ) {
        onError?.(
          new Error(
            `Global settings realtime channel: ${status}.`,
          ),
        );
      }
    },
  );


  /*
   * --------------------------------------------------------
   * CLEANUP
   * --------------------------------------------------------
   */

  return () => {
    active = false;


    void supabase.removeChannel(
      channel,
    );
  };
}


/*
 * ==========================================================
 * SAVE SETTINGS
 * ==========================================================
 */

export async function saveGlobalWebsiteSettings(
  settings: GlobalWebsiteSettings,
): Promise<void> {
  if (
    !settings
  ) {
    throw new Error(
      "Global website settings are required.",
    );
  }


  const {
    error,
  } =
    await supabase
      .from(
        GLOBAL_TABLE,
      )
      .upsert(
        toRow(
          settings,
        ),
      );


  if (
    error
  ) {
    console.error(
      "Failed to save global website settings:",
      error,
    );

    throw new Error(
      error.message,
    );
  }
}