import {
  supabase,
} from "../lib/supabase";

import type {
  Service,
} from "../types/service";


/*
 * ==========================================================
 * SUPABASE SERVICE ROW
 * ==========================================================
 */

interface SupabaseServiceRow {
  id: string;

  name: string;

  slug: string;

  category: string;

  short_description: string;

  description: string;

  price: number | string | null;

  price_label: string | null;

  image: string | null;

  featured: boolean;

  active: boolean;

  created_at: string;

  updated_at: string;
}


/*
 * ==========================================================
 * SELECT COLUMNS
 * ==========================================================
 */

const SERVICE_COLUMNS = `
  id,
  name,
  slug,
  category,
  short_description,
  description,
  price,
  price_label,
  image,
  featured,
  active,
  created_at,
  updated_at
`;


/*
 * ==========================================================
 * NUMBER HELPER
 * ==========================================================
 */

function parseOptionalNumber(
  value: unknown,
): number | undefined {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return undefined;
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
    return undefined;
  }


  return parsed;
}


/*
 * ==========================================================
 * STRING HELPER
 * ==========================================================
 */

function optionalString(
  value: unknown,
): string | undefined {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return undefined;
  }


  return value;
}


/*
 * ==========================================================
 * MAP SUPABASE → APP
 * ==========================================================
 */

function mapService(
  row: SupabaseServiceRow,
): Service {
  return {
    id:
      row.id,

    name:
      typeof row.name ===
      "string"
        ? row.name
        : "Unnamed service",

    slug:
      typeof row.slug ===
      "string"
        ? row.slug
        : "",

    category:
      typeof row.category ===
      "string"
        ? row.category
        : "Technology Services",

    shortDescription:
      typeof row.short_description ===
      "string"
        ? row.short_description
        : "",

    description:
      typeof row.description ===
      "string"
        ? row.description
        : "",

    price:
      parseOptionalNumber(
        row.price,
      ),

    priceLabel:
      optionalString(
        row.price_label,
      ),

    image:
      optionalString(
        row.image,
      ),

    featured:
      Boolean(
        row.featured,
      ),

    active:
      row.active !==
      false,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * GET SERVICES
 * ==========================================================
 *
 * Public users receive active services through RLS.
 *
 * Admin users receive all services through the admin RLS
 * policy.
 */

export async function getServices():
  Promise<Service[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "services",
      )
      .select(
        SERVICE_COLUMNS,
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
    (
      data ??
      []
    ) as SupabaseServiceRow[]
  ).map(
    mapService,
  );
}


/*
 * ==========================================================
 * GET SINGLE SERVICE
 * ==========================================================
 */

export async function getServiceById(
  id: string,
): Promise<Service | null> {
  if (
    !id.trim()
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "services",
      )
      .select(
        SERVICE_COLUMNS,
      )
      .eq(
        "id",
        id,
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


  return mapService(
    data as SupabaseServiceRow,
  );
}


/*
 * ==========================================================
 * CREATE SERVICE
 * ==========================================================
 */

export async function createService(
  data: Omit<
    Service,
    "id" |
      "createdAt" |
      "updatedAt"
  >,
): Promise<string> {
  const id =
    crypto.randomUUID();


  const {
    error,
  } =
    await supabase
      .from(
        "services",
      )
      .insert({
        id,

        name:
          data.name.trim(),

        slug:
          data.slug.trim(),

        category:
          data.category.trim(),

        short_description:
          data.shortDescription.trim(),

        description:
          data.description.trim(),

        price:
          data.price ??
          null,

        price_label:
          data.priceLabel?.trim() ||
          null,

        image:
          data.image?.trim() ||
          null,

        featured:
          data.featured ??
          false,

        active:
          data.active ??
          true,

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


  return id;
}


/*
 * ==========================================================
 * UPDATE SERVICE
 * ==========================================================
 */

export async function updateService(
  id: string,
  data: Partial<
    Omit<Service, "id">
  >,
): Promise<void> {
  if (
    !id.trim()
  ) {
    throw new Error(
      "Service ID is required.",
    );
  }


  const updates:
    Record<
      string,
      unknown
    > = {};


  if (
    "name" in data
  ) {
    updates.name =
      data.name?.trim() ??
      "";
  }


  if (
    "slug" in data
  ) {
    updates.slug =
      data.slug?.trim() ??
      "";
  }


  if (
    "category" in data
  ) {
    updates.category =
      data.category?.trim() ??
      "Technology Services";
  }


  if (
    "shortDescription" in data
  ) {
    updates.short_description =
      data.shortDescription?.trim() ??
      "";
  }


  if (
    "description" in data
  ) {
    updates.description =
      data.description?.trim() ??
      "";
  }


  if (
    "price" in data
  ) {
    updates.price =
      data.price ??
      null;
  }


  if (
    "priceLabel" in data
  ) {
    updates.price_label =
      data.priceLabel?.trim() ||
      null;
  }


  if (
    "image" in data
  ) {
    updates.image =
      data.image?.trim() ||
      null;
  }


  if (
    "featured" in data
  ) {
    updates.featured =
      Boolean(
        data.featured,
      );
  }


  if (
    "active" in data
  ) {
    updates.active =
      data.active !==
      false;
  }


  updates.updated_at =
    new Date().toISOString();


  const {
    error,
  } =
    await supabase
      .from(
        "services",
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
 * DELETE SERVICE
 * ==========================================================
 */

export async function deleteService(
  id: string,
): Promise<void> {
  if (
    !id.trim()
  ) {
    throw new Error(
      "Service ID is required.",
    );
  }


  const {
    error,
  } =
    await supabase
      .from(
        "services",
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
 * SUPABASE REALTIME SERVICES
 * ==========================================================
 */

export function subscribeToServices(
  onChange: (
    services: Service[],
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


  const servicesMap =
    new Map<
      string,
      Service
    >();


  function emit() {
    if (
      stopped
    ) {
      return;
    }


    const services =
      Array.from(
        servicesMap.values(),
      ).sort(
        (
          first,
          second,
        ) => {
          const firstTime =
            toTime(
              first.createdAt,
            );

          const secondTime =
            toTime(
              second.createdAt,
            );

          return (
            secondTime -
            firstTime
          );
        },
      );


    onChange(
      services,
    );
  }


  void (
    async () => {
      try {

        /*
         * Initial data.
         */

        const initial =
          await getServices();


        if (
          stopped
        ) {
          return;
        }


        servicesMap.clear();


        for (
          const service of
            initial
        ) {
          servicesMap.set(
            service.id,
            service,
          );
        }


        emit();


        /*
         * Realtime.
         */

        channel =
          supabase
            .channel(
              `nexletronics-services-${Date.now()}`,
            )
            .on(
              "postgres_changes",
              {
                event:
                  "*",

                schema:
                  "public",

                table:
                  "services",
              },
              (
                payload,
              ) => {
                if (
                  stopped
                ) {
                  return;
                }


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
                    servicesMap.delete(
                      oldRow.id,
                    );
                  }


                  emit();

                  return;
                }


                const row =
                  payload.new as
                    SupabaseServiceRow;


                if (
                  !row?.id
                ) {
                  return;
                }


                servicesMap.set(
                  row.id,
                  mapService(
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
                      "Unable to connect to the realtime services database.",
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
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load services.",
              );


        console.error(
          "Supabase services realtime initialization failed:",
          error,
        );


        onError?.(
          normalized,
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
 * TIME HELPER
 * ==========================================================
 */

function toTime(
  value: unknown,
): number {
  if (
    value instanceof
    Date
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