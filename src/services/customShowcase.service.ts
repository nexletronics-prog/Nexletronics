import {
  supabase,
} from "../lib/supabase";

import type {
  CustomPortfolioCategory,
  CustomPortfolioItem,
  CreateCustomPortfolioData,
  UpdateCustomPortfolioData,
} from "../types/customProject";


/*
 * ==========================================================
 * TABLES
 * ==========================================================
 */

const PORTFOLIO_TABLE =
  "custom_portfolio";

const SETTINGS_TABLE =
  "custom_showcase_settings";

const SETTINGS_ID =
  "default";


/*
 * ==========================================================
 * SETTINGS
 * ==========================================================
 */

export interface CustomShowcaseSettings {
  websitesEnabled: boolean;

  devicesEnabled: boolean;

  updatedAt?: unknown;
}


export const defaultCustomShowcaseSettings:
  CustomShowcaseSettings = {
    websitesEnabled:
      true,

    devicesEnabled:
      true,
  };


/*
 * ==========================================================
 * DATABASE TYPES
 * ==========================================================
 */

interface PortfolioRow {
  id: string;

  title: string;

  slug: string;

  category: string;

  short_description: string;

  description: string;

  cover_image: string;

  gallery: string[] | null;

  technologies: string[] | null;

  client_industry: string | null;

  live_url: string | null;

  featured: boolean;

  published: boolean;

  sort_order: number;

  created_at: string;

  updated_at: string;
}


interface SettingsRow {
  id: string;

  websites_enabled: boolean;

  devices_enabled: boolean;

  updated_at: string;
}


/*
 * ==========================================================
 * COLUMNS
 * ==========================================================
 */

const PORTFOLIO_COLUMNS = `
  id,
  title,
  slug,
  category,
  short_description,
  description,
  cover_image,
  gallery,
  technologies,
  client_industry,
  live_url,
  featured,
  published,
  sort_order,
  created_at,
  updated_at
`;


const SETTINGS_COLUMNS = `
  id,
  websites_enabled,
  devices_enabled,
  updated_at
`;


/*
 * ==========================================================
 * STRING
 * ==========================================================
 */

function cleanString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/*
 * ==========================================================
 * ARRAY
 * ==========================================================
 */

function cleanStringArray(
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


/*
 * ==========================================================
 * CATEGORY
 * ==========================================================
 */

function normalizeCategory(
  value: unknown,
): CustomPortfolioCategory {
  return value ===
    "devices"
    ? "devices"
    : "website";
}


/*
 * ==========================================================
 * PORTFOLIO NORMALIZER
 * ==========================================================
 */

function normalizePortfolio(
  row: PortfolioRow,
): CustomPortfolioItem {
  return {
    id:
      row.id,

    title:
      cleanString(
        row.title,
      ) ||
      "Untitled project",

    slug:
      cleanString(
        row.slug,
      ) ||
      row.id,

    category:
      normalizeCategory(
        row.category,
      ),

    shortDescription:
      cleanString(
        row.short_description,
      ),

    description:
      cleanString(
        row.description,
      ),

    coverImage:
      cleanString(
        row.cover_image,
      ),

    gallery:
      cleanStringArray(
        row.gallery,
      ),

    technologies:
      cleanStringArray(
        row.technologies,
      ),

    clientIndustry:
      cleanString(
        row.client_industry,
      ) ||
      undefined,

    liveUrl:
      cleanString(
        row.live_url,
      ) ||
      undefined,

    featured:
      row.featured ===
      true,

    published:
      row.published !==
      false,

    sortOrder:
      Number.isFinite(
        row.sort_order,
      )
        ? row.sort_order
        : 0,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * SETTINGS NORMALIZER
 * ==========================================================
 */

function normalizeSettings(
  row:
    | SettingsRow
    | null
    | undefined,
): CustomShowcaseSettings {
  if (
    !row
  ) {
    return {
      ...defaultCustomShowcaseSettings,
    };
  }


  return {
    websitesEnabled:
      row.websites_enabled !==
      false,

    devicesEnabled:
      row.devices_enabled !==
      false,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * SORT PORTFOLIO
 * ==========================================================
 */

function sortPortfolio(
  items:
    CustomPortfolioItem[],
): CustomPortfolioItem[] {
  return [
    ...items,
  ].sort(
    (
      first,
      second,
    ) => {
      if (
        first.featured !==
        second.featured
      ) {
        return first.featured
          ? -1
          : 1;
      }


      if (
        first.sortOrder !==
        second.sortOrder
      ) {
        return (
          first.sortOrder -
          second.sortOrder
        );
      }


      return (
        toTime(
          first.createdAt,
        ) -
        toTime(
          second.createdAt,
        )
      );
    },
  );
}


/*
 * ==========================================================
 * GET SETTINGS
 * ==========================================================
 */

export async function getCustomShowcaseSettings():
  Promise<CustomShowcaseSettings> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        SETTINGS_TABLE,
      )
      .select(
        SETTINGS_COLUMNS,
      )
      .eq(
        "id",
        SETTINGS_ID,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  return normalizeSettings(
    data as
      | SettingsRow
      | null,
  );
}


/*
 * ==========================================================
 * REALTIME SETTINGS
 * ==========================================================
 */

export function subscribeCustomShowcaseSettings(
  callback: (
    settings:
      CustomShowcaseSettings,
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): () => void {
  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadSettings() {
    try {
      const settings =
        await getCustomShowcaseSettings();


      if (
        !stopped
      ) {
        callback(
          settings,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load showcase settings.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadSettings();


  channel =
    supabase
      .channel(
        `custom-showcase-settings-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            SETTINGS_TABLE,

          filter:
            `id=eq.${SETTINGS_ID}`,
        },
        () => {
          void loadSettings();
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
            onError?.(
              new Error(
                "Unable to connect to showcase settings.",
              ),
            );
          }
        },
      );


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
 * SAVE SETTINGS
 * ==========================================================
 */

export async function saveCustomShowcaseSettings(
  settings:
    CustomShowcaseSettings,
): Promise<void> {
  const {
    error,
  } =
    await supabase
      .from(
        SETTINGS_TABLE,
      )
      .upsert(
        {
          id:
            SETTINGS_ID,

          websites_enabled:
            Boolean(
              settings.websitesEnabled,
            ),

          devices_enabled:
            Boolean(
              settings.devicesEnabled,
            ),

          updated_at:
            new Date().toISOString(),
        },
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
}


/*
 * ==========================================================
 * GET PORTFOLIO
 * ==========================================================
 */

export async function getCustomPortfolio():
  Promise<CustomPortfolioItem[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        PORTFOLIO_TABLE,
      )
      .select(
        PORTFOLIO_COLUMNS,
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  const items =
    (
      data ??
      []
    ) as PortfolioRow[];


  return sortPortfolio(
    items.map(
      normalizePortfolio,
    ),
  );
}


/*
 * ==========================================================
 * GET SINGLE PORTFOLIO ITEM
 * ==========================================================
 */

export async function getCustomPortfolioItem(
  id:
    string,
): Promise<
  CustomPortfolioItem |
  null
> {
  const cleanId =
    cleanString(
      id,
    );


  if (
    !cleanId
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        PORTFOLIO_TABLE,
      )
      .select(
        PORTFOLIO_COLUMNS,
      )
      .eq(
        "id",
        cleanId,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  if (
    !data
  ) {
    return null;
  }


  return normalizePortfolio(
    data as PortfolioRow,
  );
}


/*
 * ==========================================================
 * REALTIME PORTFOLIO
 * ==========================================================
 */

export function subscribeCustomPortfolio(
  callback: (
    items:
      CustomPortfolioItem[],
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): () => void {
  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadPortfolio() {
    try {
      const items =
        await getCustomPortfolio();


      if (
        !stopped
      ) {
        callback(
          items,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load showcase portfolio.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadPortfolio();


  channel =
    supabase
      .channel(
        `custom-portfolio-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            PORTFOLIO_TABLE,
        },
        () => {
          void loadPortfolio();
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
            onError?.(
              new Error(
                "Unable to connect to showcase portfolio.",
              ),
            );
          }
        },
      );


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
 * CREATE PORTFOLIO ITEM
 * ==========================================================
 */

export async function createCustomPortfolioItem(
  data:
    CreateCustomPortfolioData,
): Promise<string> {
  const title =
    cleanString(
      data.title,
    );


  if (
    !title
  ) {
    throw new Error(
      "Showcase title is required.",
    );
  }


  const shortDescription =
    cleanString(
      data.shortDescription,
    );


  if (
    !shortDescription
  ) {
    throw new Error(
      "Short description is required.",
    );
  }


  const description =
    cleanString(
      data.description,
    );


  if (
    !description
  ) {
    throw new Error(
      "Description is required.",
    );
  }


  const coverImage =
    cleanString(
      data.coverImage,
    );


  if (
    !coverImage
  ) {
    throw new Error(
      "Cover image URL is required.",
    );
  }


  const slug =
    cleanString(
      data.slug,
    ) ||
    title
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "");


  const category =
    normalizeCategory(
      data.category,
    );


  const portfolioId =
    crypto.randomUUID();


  const gallery =
    cleanStringArray(
      data.gallery,
    );


  const technologies =
    cleanStringArray(
      data.technologies,
    );


  const sortOrder =
    Number.isFinite(
      data.sortOrder,
    )
      ? Number(
          data.sortOrder,
        )
      : 0;


  const {
    error,
  } =
    await supabase
      .from(
        PORTFOLIO_TABLE,
      )
      .insert({
        id:
          portfolioId,

        title,

        slug,

        category,

        short_description:
          shortDescription,

        description,

        cover_image:
          coverImage,

        gallery,

        technologies,

        client_industry:
          cleanString(
            data.clientIndustry,
          ) ||
          null,

        live_url:
          cleanString(
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
          sortOrder,

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });


  if (
    error
  ) {
    throw error;
  }


  return portfolioId;
}


/*
 * ==========================================================
 * UPDATE PORTFOLIO ITEM
 * ==========================================================
 */

export async function updateCustomPortfolioItem(
  id:
    string,

  data:
    UpdateCustomPortfolioData,
): Promise<void> {
  const cleanId =
    cleanString(
      id,
    );


  if (
    !cleanId
  ) {
    throw new Error(
      "Portfolio item ID is required.",
    );
  }


  const updates:
    Record<
      string,
      unknown
    > = {};


  if (
    data.title !==
    undefined
  ) {
    updates.title =
      cleanString(
        data.title,
      );
  }


  if (
    data.slug !==
    undefined
  ) {
    updates.slug =
      cleanString(
        data.slug,
      );
  }


  if (
    data.category !==
    undefined
  ) {
    updates.category =
      normalizeCategory(
        data.category,
      );
  }


  if (
    data.shortDescription !==
    undefined
  ) {
    updates.short_description =
      cleanString(
        data.shortDescription,
      );
  }


  if (
    data.description !==
    undefined
  ) {
    updates.description =
      cleanString(
        data.description,
      );
  }


  if (
    data.coverImage !==
    undefined
  ) {
    updates.cover_image =
      cleanString(
        data.coverImage,
      );
  }


  if (
    data.gallery !==
    undefined
  ) {
    updates.gallery =
      cleanStringArray(
        data.gallery,
      );
  }


  if (
    data.technologies !==
    undefined
  ) {
    updates.technologies =
      cleanStringArray(
        data.technologies,
      );
  }


  if (
    data.clientIndustry !==
    undefined
  ) {
    updates.client_industry =
      cleanString(
        data.clientIndustry,
      ) ||
      null;
  }


  if (
    data.liveUrl !==
    undefined
  ) {
    updates.live_url =
      cleanString(
        data.liveUrl,
      ) ||
      null;
  }


  if (
    data.featured !==
    undefined
  ) {
    updates.featured =
      Boolean(
        data.featured,
      );
  }


  if (
    data.published !==
    undefined
  ) {
    updates.published =
      Boolean(
        data.published,
      );
  }


  if (
    data.sortOrder !==
    undefined
  ) {
    updates.sort_order =
      Number(
        data.sortOrder,
      );
  }


  updates.updated_at =
    new Date().toISOString();


  const {
    error,
  } =
    await supabase
      .from(
        PORTFOLIO_TABLE,
      )
      .update(
        updates,
      )
      .eq(
        "id",
        cleanId,
      );


  if (
    error
  ) {
    throw error;
  }
}


/*
 * ==========================================================
 * DELETE PORTFOLIO ITEM
 * ==========================================================
 */

export async function deleteCustomPortfolioItem(
  id:
    string,
): Promise<void> {
  const cleanId =
    cleanString(
      id,
    );


  if (
    !cleanId
  ) {
    throw new Error(
      "Portfolio item ID is required.",
    );
  }


  const {
    error,
  } =
    await supabase
      .from(
        PORTFOLIO_TABLE,
      )
      .delete()
      .eq(
        "id",
        cleanId,
      );


  if (
    error
  ) {
    throw error;
  }
}


/*
 * ==========================================================
 * PUBLISHED
 * ==========================================================
 */

export async function setCustomPortfolioPublished(
  id:
    string,

  published:
    boolean,
): Promise<void> {
  await updateCustomPortfolioItem(
    id,
    {
      published:
        Boolean(
          published,
        ),
    },
  );
}


/*
 * ==========================================================
 * FEATURED
 * ==========================================================
 */

export async function setCustomPortfolioFeatured(
  id:
    string,

  featured:
    boolean,
): Promise<void> {
  await updateCustomPortfolioItem(
    id,
    {
      featured:
        Boolean(
          featured,
        ),
    },
  );
}


/*
 * ==========================================================
 * IMAGE UPLOAD
 * ==========================================================
 *
 * Existing project deliberately does not use Firebase
 * Storage for showcase images.
 *
 * Keep this behaviour unchanged.
 * ==========================================================
 */

export async function uploadCustomShowcaseImage(
  _file:
    File,

  _category:
    CustomPortfolioCategory,

  _folder =
    "gallery",
): Promise<string> {
  throw new Error(
    "Direct showcase image uploads are disabled. Add a public image URL instead.",
  );
}


export async function uploadCustomShowcaseImages(
  _files:
    File[],

  _category:
    CustomPortfolioCategory,
): Promise<string[]> {
  throw new Error(
    "Direct showcase image uploads are disabled. Add public image URLs instead.",
  );
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