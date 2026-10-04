import { supabase } from "../lib/supabase";

import {
  subscribeToOrders,
} from "./order.service";

import { getCustomers } from "./customer.service";

import {
  subscribeContactMessages,
} from "./contact.service";

import {
  getAllPrintingOrders,
} from "./printing.service";

import type { PrintingOrder } from "../types/printing";


/*
 * ==========================================================
 * REALTIME DOCUMENT
 * ==========================================================
 *
 * Compatibility shape used by existing admin pages.
 *
 * Firebase Authentication is used only for identity.
 * Application data and realtime updates come from Supabase.
 */

export interface RealtimeDocument<
  T = Record<string, unknown>,
> {
  id: string;
  data: T;
}


type RealtimeErrorHandler = (
  error: Error,
) => void;


/*
 * ==========================================================
 * TABLE ALIASES
 * ==========================================================
 */

const TABLE_ALIASES: Record<string, string> = {
  users: "profiles",
  threeDPrintOrders: "printing_orders",
};


function resolveTableName(
  collectionName: string,
): string {
  return (
    TABLE_ALIASES[collectionName] ??
    collectionName
  );
}


/*
 * ==========================================================
 * ERROR NORMALIZER
 * ==========================================================
 */

function normalizeError(
  error: unknown,
  fallback: string,
): Error {
  if (error instanceof Error) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message ===
      "string"
  ) {
    return new Error(
      (error as { message: string }).message,
    );
  }

  return new Error(fallback);
}


/*
 * ==========================================================
 * GENERIC ROW MAPPER
 * ==========================================================
 */

function mapSupabaseRow<T>(
  row: Record<string, unknown>,
): T {
  return row as T;
}


/*
 * ==========================================================
 * SPECIALIZED REALTIME COLLECTIONS
 * ==========================================================
 */

function subscribeSpecialCollection<T>(
  collectionName: string,
  onChange: (
    items: RealtimeDocument<T>[],
  ) => void,
  onError?: RealtimeErrorHandler,
): (() => void) | null {
  switch (collectionName) {
    case "orders": {
      return subscribeToOrders(
        (orders) => {
          onChange(
            orders.map((order) => ({
              id: order.id,
              data: order as T,
            })),
          );
        },
        onError,
      );
    }

    case "contacts": {
      return subscribeContactMessages(
        (contacts) => {
          onChange(
            contacts.map((contact) => ({
              id: contact.id,
              data: contact as unknown as T,
            })),
          );
        },
        (error: unknown) => {
          onError?.(
            normalizeError(
              error,
              "Unable to load contact messages.",
            ),
          );
        },
      );
    }

    case "users": {
      let active = true;

      const load = async () => {
        try {
          const customers = await getCustomers();

          if (!active) {
            return;
          }

          onChange(
            customers.map((customer) => ({
              id: customer.uid,

              data: {
                uid: customer.uid,

                firebase_uid:
                  customer.uid,

                name:
                  customer.name,

                email:
                  customer.email,

                phone:
                  customer.phone,

                photoURL:
                  customer.photoURL,

                role:
                  customer.role,

                createdAt:
                  customer.createdAt,

                updatedAt:
                  customer.updatedAt,
              } as T,
            })),
          );
        } catch (error: unknown) {
          if (active) {
            onError?.(
              normalizeError(
                error,
                "Unable to load customers.",
              ),
            );
          }
        }
      };

      void load();

      const channel = supabase
        .channel(
          `realtime-profiles-${Date.now()}`,
        )
        .on(
          "postgres_changes",
          {
            event: "*",

            schema: "public",

            table: "profiles",
          },
          () => {
            void load();
          },
        )
        .subscribe(
          (
            status,
            error: unknown,
          ) => {
            if (!active) {
              return;
            }

            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT"
            ) {
              onError?.(
                normalizeError(
                  error,
                  "Realtime customer connection failed.",
                ),
              );
            }
          },
        );

      return () => {
        active = false;

        void supabase.removeChannel(
          channel,
        );
      };
    }

    case "threeDPrintOrders": {
      let active = true;

      const load = async () => {
        try {
          const orders: PrintingOrder[] =
            await getAllPrintingOrders();

          if (!active) {
            return;
          }

          onChange(
            orders.map((order) => ({
              id: order.id,
              data: order as T,
            })),
          );
        } catch (error: unknown) {
          if (active) {
            onError?.(
              normalizeError(
                error,
                "Unable to load 3D printing orders.",
              ),
            );
          }
        }
      };

      void load();

      const channel = supabase
        .channel(
          `realtime-printing-orders-${Date.now()}`,
        )
        .on(
          "postgres_changes",
          {
            event: "*",

            schema: "public",

            table: "printing_orders",
          },
          () => {
            void load();
          },
        )
        .subscribe(
          (
            status,
            error: unknown,
          ) => {
            if (!active) {
              return;
            }

            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT"
            ) {
              onError?.(
                normalizeError(
                  error,
                  "Realtime 3D printing connection failed.",
                ),
              );
            }
          },
        );

      return () => {
        active = false;

        void supabase.removeChannel(
          channel,
        );
      };
    }

    default:
      return null;
  }
}


/*
 * ==========================================================
 * REALTIME COLLECTION
 * ==========================================================
 */

export function subscribeToCollection<
  T = Record<string, unknown>,
>(
  collectionName: string,

  onChange: (
    items: RealtimeDocument<T>[],
  ) => void,

  options?: {
    constraints?: unknown[];

    onError?: RealtimeErrorHandler;
  },
): () => void {
  const specialized =
    subscribeSpecialCollection<T>(
      collectionName,

      onChange,

      options?.onError,
    );

  if (specialized) {
    return specialized;
  }

  const tableName =
    resolveTableName(
      collectionName,
    );

  let active =
    true;


  const load =
    async () => {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              tableName,
            )
            .select(
              "*",
            );

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        const items =
          (
            data ??
            []
          ).map(
            (row) => ({
              id:
                typeof row.id ===
                  "string"
                  ? row.id
                  : String(
                      row.id ??
                        "",
                    ),

              data:
                mapSupabaseRow<T>(
                  row as Record<
                    string,
                    unknown
                  >,
                ),
            }),
          );

        onChange(
          items,
        );
      } catch (
        error: unknown
      ) {
        if (!active) {
          return;
        }

        const normalized =
          normalizeError(
            error,

            `Unable to load ${collectionName}.`,
          );

        console.error(
          `Supabase realtime collection failed for "${collectionName}":`,
          normalized,
        );

        options?.onError?.(
          normalized,
        );
      }
    };


  void load();


  const channel =
    supabase
      .channel(
        `realtime-${tableName}-${Date.now()}`,
      )
      .on(
        "postgres_changes",

        {
          event:
            "*",

          schema:
            "public",

          table:
            tableName,
        },

        () => {
          void load();
        },
      )
      .subscribe(
        (
          status,
          error: unknown,
        ) => {
          if (!active) {
            return;
          }

          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            options?.onError?.(
              normalizeError(
                error,

                `Realtime ${collectionName} connection failed.`,
              ),
            );
          }
        },
      );


  return () => {
    active = false;

    void supabase.removeChannel(
      channel,
    );
  };
}


/*
 * ==========================================================
 * ORDERED REALTIME COLLECTION
 * ==========================================================
 */

export function subscribeToOrderedCollection<
  T = Record<string, unknown>,
>(
  collectionName: string,

  orderField: string,

  onChange: (
    items: RealtimeDocument<T>[],
  ) => void,

  onError?: RealtimeErrorHandler,
): () => void {
  const handleChange = (
    items: RealtimeDocument<T>[],
  ) => {
    const sorted =
      [
        ...items,
      ].sort(
        (
          first,
          second,
        ) => {
          const firstValue =
            (
              first.data as Record<
                string,
                unknown
              >
            )[orderField];

          const secondValue =
            (
              second.data as Record<
                string,
                unknown
              >
            )[orderField];


          const firstTime =
            firstValue instanceof
              Date

              ? firstValue.getTime()

              : typeof firstValue ===
                  "string"

                ? Date.parse(
                    firstValue,
                  )

                : typeof firstValue ===
                    "number"

                  ? firstValue

                  : 0;


          const secondTime =
            secondValue instanceof
              Date

              ? secondValue.getTime()

              : typeof secondValue ===
                  "string"

                ? Date.parse(
                    secondValue,
                  )

                : typeof secondValue ===
                    "number"

                  ? secondValue

                  : 0;


          return (
            secondTime -
            firstTime
          );
        },
      );


    onChange(
      sorted,
    );
  };


  return subscribeToCollection<T>(
    collectionName,

    handleChange,

    {
      onError,
    },
  );
}


/*
 * ==========================================================
 * REALTIME DOCUMENT
 * ==========================================================
 */

export function subscribeToDocument<
  T = Record<string, unknown>,
>(
  collectionName: string,

  documentId: string,

  onChange: (
    value: T | null,
  ) => void,

  onError?: RealtimeErrorHandler,
): () => void {
  let active =
    true;


  const tableName =
    resolveTableName(
      collectionName,
    );


  const load =
    async () => {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              tableName,
            )
            .select(
              "*",
            )
            .eq(
              "id",
              documentId,
            )
            .maybeSingle();


        if (error) {
          throw error;
        }


        if (!active) {
          return;
        }


        onChange(
          data
            ? (
                data as T
              )
            : null,
        );
      } catch (
        error: unknown
      ) {
        if (!active) {
          return;
        }


        onError?.(
          normalizeError(
            error,

            `Unable to load ${collectionName}/${documentId}.`,
          ),
        );
      }
    };


  void load();


  const channel =
    supabase
      .channel(
        `realtime-${tableName}-${documentId}-${Date.now()}`,
      )
      .on(
        "postgres_changes",

        {
          event:
            "*",

          schema:
            "public",

          table:
            tableName,

          filter:
            `id=eq.${documentId}`,
        },

        () => {
          void load();
        },
      )
      .subscribe(
        (
          status,
          error: unknown,
        ) => {
          if (!active) {
            return;
          }


          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              normalizeError(
                error,

                `Realtime ${collectionName}/${documentId} connection failed.`,
              ),
            );
          }
        },
      );


  return () => {
    active = false;

    void supabase.removeChannel(
      channel,
    );
  };
}