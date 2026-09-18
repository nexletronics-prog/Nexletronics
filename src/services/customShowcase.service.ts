import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  CustomPortfolioCategory,
  CustomPortfolioItem,
  CreateCustomPortfolioData,
  UpdateCustomPortfolioData,
} from "../types/customProject";


/*
 * ==========================================================
 * COLLECTIONS
 * ==========================================================
 */

const PORTFOLIO_COLLECTION =
  "customPortfolio";

const SETTINGS_COLLECTION =
  "customShowcaseSettings";

const SETTINGS_ID =
  "default";


/*
 * ==========================================================
 * SETTINGS
 * ==========================================================
 */

export interface CustomShowcaseSettings {

  websitesEnabled:
    boolean;

  devicesEnabled:
    boolean;

  updatedAt?:
    unknown;
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
 * NORMALIZE PORTFOLIO
 * ==========================================================
 */

function normalizePortfolio(
  id:
    string,

  data:
    Record<
      string,
      unknown
    >,
): CustomPortfolioItem {

  const category:
    CustomPortfolioCategory =
    data.category ===
      "devices"
      ? "devices"
      : "website";


  const gallery =
    Array.isArray(
      data.gallery,
    )
      ? data.gallery.filter(
          (
            item,
          ): item is string =>
            typeof item ===
            "string" &&
            item.trim().length >
              0,
        )
      : [];


  const technologies =
    Array.isArray(
      data.technologies,
    )
      ? data.technologies.filter(
          (
            item,
          ): item is string =>
            typeof item ===
            "string" &&
            item.trim().length >
              0,
        )
      : [];


  return {

    id,

    title:
      typeof data.title ===
      "string"
        ? data.title
        : "Untitled project",

    slug:
      typeof data.slug ===
      "string"
        ? data.slug
        : id,

    category,

    shortDescription:
      typeof data.shortDescription ===
      "string"
        ? data.shortDescription
        : "",

    description:
      typeof data.description ===
      "string"
        ? data.description
        : "",

    coverImage:
      typeof data.coverImage ===
      "string"
        ? data.coverImage
        : "",

    gallery,

    technologies,

    clientIndustry:
      typeof data.clientIndustry ===
      "string"
        ? data.clientIndustry
        : undefined,

    liveUrl:
      typeof data.liveUrl ===
      "string"
        ? data.liveUrl
        : undefined,

    featured:
      data.featured ===
      true,

    published:
      data.published !==
      false,

    sortOrder:
      typeof data.sortOrder ===
      "number" &&
      Number.isFinite(
        data.sortOrder,
      )
        ? data.sortOrder
        : 0,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,

  };
}


/*
 * ==========================================================
 * NORMALIZE SETTINGS
 * ==========================================================
 */

function normalizeSettings(
  data:
    Record<
      string,
      unknown
    > |
    undefined,
): CustomShowcaseSettings {

  if (
    !data
  ) {

    return {
      ...defaultCustomShowcaseSettings,
    };
  }


  return {

    websitesEnabled:
      data.websitesEnabled !==
      false,

    devicesEnabled:
      data.devicesEnabled !==
      false,

    updatedAt:
      data.updatedAt,

  };
}


/*
 * ==========================================================
 * GET SETTINGS
 * ==========================================================
 *
 * Public callers should normally use the realtime listener.
 * The default settings are returned here so the application
 * remains usable when the document has not been created yet.
 * ==========================================================
 */

export async function getCustomShowcaseSettings():
  Promise<
    CustomShowcaseSettings
  > {

  return {
    ...defaultCustomShowcaseSettings,
  };
}


/*
 * ==========================================================
 * REALTIME SETTINGS
 * ==========================================================
 */

export function subscribeCustomShowcaseSettings(
  callback:
    (
      settings:
        CustomShowcaseSettings,
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  const settingsRef =
    doc(
      db,
      SETTINGS_COLLECTION,
      SETTINGS_ID,
    );


  return onSnapshot(

    settingsRef,

    (
      snapshot,
    ) => {

      if (
        !snapshot.exists()
      ) {

        callback(
          {
            ...defaultCustomShowcaseSettings,
          },
        );

        return;
      }


      callback(
        normalizeSettings(
          snapshot.data(),
        ),
      );

    },

    (
      listenerError,
    ) => {

      console.error(
        "Custom showcase settings listener failed:",
        listenerError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            listenerError.message,
          ),
        );
      }

    },
  );
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

  const settingsRef =
    doc(
      db,
      SETTINGS_COLLECTION,
      SETTINGS_ID,
    );


  await setDoc(
    settingsRef,

    {

      websitesEnabled:
        Boolean(
          settings.websitesEnabled,
        ),

      devicesEnabled:
        Boolean(
          settings.devicesEnabled,
        ),

      updatedAt:
        serverTimestamp(),

    },

    {
      merge:
        true,
    },
  );
}


/*
 * ==========================================================
 * REALTIME PORTFOLIO
 * ==========================================================
 */

export function subscribeCustomPortfolio(
  callback:
    (
      items:
        CustomPortfolioItem[],
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  const portfolioRef =
    collection(
      db,
      PORTFOLIO_COLLECTION,
    );


  const portfolioQuery =
    query(
      portfolioRef,

      orderBy(
        "sortOrder",
        "asc",
      ),
    );


  return onSnapshot(

    portfolioQuery,

    (
      snapshot,
    ) => {

      const items =
        snapshot.docs
          .map(
            (
              document,
            ) =>
              normalizePortfolio(
                document.id,
                document.data(),
              ),
          )
          .sort(
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


              return (
                first.sortOrder -
                second.sortOrder
              );

            },
          );


      callback(
        items,
      );

    },

    (
      listenerError,
    ) => {

      console.error(
        "Custom portfolio realtime listener failed:",
        listenerError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            listenerError.message,
          ),
        );
      }

    },
  );
}


/*
 * ==========================================================
 * CREATE PORTFOLIO
 * ==========================================================
 */

export async function createCustomPortfolioItem(
  data:
    CreateCustomPortfolioData,
): Promise<string> {

  const title =
    data.title.trim();


  const slug =
    (
      data.slug?.trim() ||
      title
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-",
        )
        .replace(
          /^-+|-+$/g,
          "",
        )
    );


  const category:
    CustomPortfolioCategory =
    data.category ===
      "devices"
      ? "devices"
      : "website";


  if (
    !title
  ) {

    throw new Error(
      "Showcase title is required.",
    );
  }


  if (
    !data.shortDescription.trim()
  ) {

    throw new Error(
      "Short description is required.",
    );
  }


  if (
    !data.description.trim()
  ) {

    throw new Error(
      "Description is required.",
    );
  }


  if (
    !data.coverImage.trim()
  ) {

    throw new Error(
      "Cover image URL is required.",
    );
  }


  const gallery =
    Array.isArray(
      data.gallery,
    )
      ? data.gallery
          .filter(
            (
              image,
            ) =>
              typeof image ===
                "string" &&
              image.trim().length >
                0,
          )
          .map(
            (
              image,
            ) =>
              image.trim(),
          )
      : [];


  const technologies =
    Array.isArray(
      data.technologies,
    )
      ? data.technologies
          .filter(
            (
              technology,
            ) =>
              typeof technology ===
                "string" &&
              technology.trim().length >
                0,
          )
          .map(
            (
              technology,
            ) =>
              technology.trim(),
          )
      : [];


  const payload:
    Record<
      string,
      unknown
    > = {

    title,

    slug,

    category,

    shortDescription:
      data.shortDescription.trim(),

    description:
      data.description.trim(),

    coverImage:
      data.coverImage.trim(),

    gallery,

    technologies,

    featured:
      data.featured ===
      true,

    published:
      data.published !==
      false,

    sortOrder:
      Number.isFinite(
        data.sortOrder,
      )
        ? data.sortOrder
        : 0,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

  };


  const clientIndustry =
    data.clientIndustry?.trim();


  if (
    clientIndustry
  ) {

    payload.clientIndustry =
      clientIndustry;
  }


  const liveUrl =
    data.liveUrl?.trim();


  if (
    liveUrl
  ) {

    payload.liveUrl =
      liveUrl;
  }


  const document =
    await addDoc(
      collection(
        db,
        PORTFOLIO_COLLECTION,
      ),
      payload,
    );


  return document.id;
}


/*
 * ==========================================================
 * UPDATE PORTFOLIO
 * ==========================================================
 */

export async function updateCustomPortfolioItem(
  id:
    string,

  data:
    UpdateCustomPortfolioData,
): Promise<void> {

  if (
    !id.trim()
  ) {

    throw new Error(
      "Portfolio item ID is required.",
    );
  }


  const payload:
    Record<
      string,
      unknown
    > = {

    updatedAt:
      serverTimestamp(),

  };


  if (
    data.title !==
    undefined
  ) {

    payload.title =
      data.title.trim();
  }


  if (
    data.slug !==
    undefined
  ) {

    payload.slug =
      data.slug.trim();
  }


  if (
    data.category !==
    undefined
  ) {

    payload.category =
      data.category ===
        "devices"
        ? "devices"
        : "website";
  }


  if (
    data.shortDescription !==
    undefined
  ) {

    payload.shortDescription =
      data.shortDescription.trim();
  }


  if (
    data.description !==
    undefined
  ) {

    payload.description =
      data.description.trim();
  }


  if (
    data.coverImage !==
    undefined
  ) {

    payload.coverImage =
      data.coverImage.trim();
  }


  if (
    data.gallery !==
    undefined
  ) {

    payload.gallery =
      data.gallery
        .filter(
          (
            image,
          ) =>
            typeof image ===
              "string" &&
            image.trim().length >
              0,
        )
        .map(
          (
            image,
          ) =>
            image.trim(),
        );
  }


  if (
    data.technologies !==
    undefined
  ) {

    payload.technologies =
      data.technologies
        .filter(
          (
            technology,
          ) =>
            typeof technology ===
              "string" &&
            technology.trim().length >
              0,
        )
        .map(
          (
            technology,
          ) =>
            technology.trim(),
        );
  }


  if (
    data.clientIndustry !==
    undefined
  ) {

    payload.clientIndustry =
      data.clientIndustry
        ?.trim() ||
      "";
  }


  if (
    data.liveUrl !==
    undefined
  ) {

    payload.liveUrl =
      data.liveUrl
        ?.trim() ||
      "";
  }


  if (
    data.featured !==
    undefined
  ) {

    payload.featured =
      Boolean(
        data.featured,
      );
  }


  if (
    data.published !==
    undefined
  ) {

    payload.published =
      Boolean(
        data.published,
      );
  }


  if (
    data.sortOrder !==
    undefined
  ) {

    payload.sortOrder =
      Number(
        data.sortOrder,
      );
  }


  await updateDoc(
    doc(
      db,
      PORTFOLIO_COLLECTION,
      id,
    ),
    payload,
  );
}


/*
 * ==========================================================
 * DELETE
 * ==========================================================
 */

export async function deleteCustomPortfolioItem(
  id:
    string,
): Promise<void> {

  if (
    !id.trim()
  ) {

    throw new Error(
      "Portfolio item ID is required.",
    );
  }


  await deleteDoc(
    doc(
      db,
      PORTFOLIO_COLLECTION,
      id,
    ),
  );
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

  await updateDoc(
    doc(
      db,
      PORTFOLIO_COLLECTION,
      id,
    ),
    {

      published:
        Boolean(
          published,
        ),

      updatedAt:
        serverTimestamp(),

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

  await updateDoc(
    doc(
      db,
      PORTFOLIO_COLLECTION,
      id,
    ),
    {

      featured:
        Boolean(
          featured,
        ),

      updatedAt:
        serverTimestamp(),

    },
  );
}


/*
 * ==========================================================
 * IMAGE UPLOAD
 * ==========================================================
 *
 * IMPORTANT:
 *
 * Firebase Storage is intentionally NOT used here.
 *
 * This project does not currently have Firebase Storage
 * initialized and you do not want to enable paid/billing
 * features.
 *
 * Therefore showcase images are supplied as normal public
 * image URLs.
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


/*
 * ==========================================================
 * MULTIPLE IMAGE UPLOAD
 * ==========================================================
 */

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