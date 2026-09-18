import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";


/*
 * ==========================================================
 * REALTIME DOCUMENT
 * ==========================================================
 */

export interface RealtimeDocument<
  T = DocumentData,
> {
  id: string;

  data: T;
}


/*
 * ==========================================================
 * REALTIME COLLECTION
 * ==========================================================
 *
 * Keeps a Firestore collection synchronized with the UI.
 *
 * Automatically receives:
 *
 *   create
 *   update
 *   delete
 *
 * events.
 */

export function subscribeToCollection<
  T = DocumentData,
>(
  collectionName: string,

  onChange: (
    items: RealtimeDocument<T>[],
  ) => void,

  options?: {
    constraints?: QueryConstraint[];

    onError?: (
      error: Error,
    ) => void;
  },
): Unsubscribe {

  const collectionRef =
    collection(
      db,
      collectionName,
    ) as CollectionReference;


  const firestoreQuery =
    options?.constraints &&
    options.constraints.length > 0
      ? query(
          collectionRef,
          ...options.constraints,
        )
      : collectionRef;


  return onSnapshot(

    firestoreQuery,

    (snapshot) => {

      const items =
        snapshot.docs.map(
          (
            document,
          ) => {

            return {
              id:
                document.id,

              data:
                document.data() as T,
            };
          },
        );


      onChange(
        items,
      );
    },

    (error) => {

      console.error(
        `Realtime listener failed for collection "${collectionName}":`,
        error,
      );


      options?.onError?.(
        error,
      );
    },
  );
}


/*
 * ==========================================================
 * ORDERED REALTIME COLLECTION
 * ==========================================================
 *
 * Newest records first.
 */

export function subscribeToOrderedCollection<
  T = DocumentData,
>(
  collectionName: string,

  orderField: string,

  onChange: (
    items: RealtimeDocument<T>[],
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {

  return subscribeToCollection<T>(
    collectionName,

    onChange,

    {
      constraints: [
        orderBy(
          orderField,
          "desc",
        ),
      ],

      onError,
    },
  );
}


/*
 * ==========================================================
 * REALTIME DOCUMENT
 * ==========================================================
 *
 * Useful for individual Firestore documents such as:
 *
 *   siteSettings/global
 *   siteSettings/homepage
 *   products/<id>
 *   orders/<id>
 */

export function subscribeToDocument<
  T = DocumentData,
>(
  collectionName: string,

  documentId: string,

  onChange: (
    value: T | null,
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {

  const documentRef =
    doc(
      db,
      collectionName,
      documentId,
    ) as DocumentReference;


  return onSnapshot(

    documentRef,

    (snapshot) => {

      if (!snapshot.exists()) {

        onChange(
          null,
        );

        return;
      }


      onChange(
        snapshot.data() as T,
      );
    },

    (error) => {

      console.error(
        `Realtime listener failed for document "${collectionName}/${documentId}":`,
        error,
      );


      onError?.(
        error,
      );
    },
  );
}