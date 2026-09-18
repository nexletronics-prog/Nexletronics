import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";


/*
 * ==========================================================
 * CUSTOMER PROFILE
 * ==========================================================
 */

export interface CustomerProfile {
  uid: string;

  name: string;

  email: string;

  phone?: string;

  photoURL?: string;

  createdAt?: unknown;

  updatedAt?: unknown;

  orderCount?: number;

  totalSpent?: number;
}


/*
 * ==========================================================
 * SAVE CUSTOMER PROFILE
 * ==========================================================
 */

export async function saveCustomerProfile(
  profile: {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    photoURL?: string;
  },
): Promise<void> {
  if (!profile.uid) {
    throw new Error(
      "Customer UID is required.",
    );
  }


  await setDoc(
    doc(
      db,
      "users",
      profile.uid,
    ),
    {
      uid:
        profile.uid,

      name:
        profile.name.trim(),

      email:
        profile.email.trim()
          .toLowerCase(),

      phone:
        profile.phone?.trim() ||
        "",

      photoURL:
        profile.photoURL ||
        "",

      updatedAt:
        serverTimestamp(),

      /*
       * merge:true means an existing customer's
       * createdAt value is preserved.
       */

    },
    {
      merge: true,
    },
  );
}


/*
 * ==========================================================
 * GET SINGLE CUSTOMER
 * ==========================================================
 */

export async function getCustomerById(
  uid: string,
): Promise<CustomerProfile | null> {
  if (!uid) {
    return null;
  }


  const snapshot =
    await getDoc(
      doc(
        db,
        "users",
        uid,
      ),
    );


  if (!snapshot.exists()) {
    return null;
  }


  const data =
    snapshot.data();


  return {
    uid:
      snapshot.id,

    name:
      typeof data.name ===
      "string"
        ? data.name
        : "Customer",

    email:
      typeof data.email ===
      "string"
        ? data.email
        : "",

    phone:
      typeof data.phone ===
      "string"
        ? data.phone
        : "",

    photoURL:
      typeof data.photoURL ===
      "string"
        ? data.photoURL
        : "",

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}


/*
 * ==========================================================
 * GET ALL CUSTOMERS
 * ==========================================================
 */

export async function getCustomers(): Promise<
  CustomerProfile[]
> {
  const customersQuery =
    query(
      collection(
        db,
        "users",
      ),
      orderBy(
        "createdAt",
        "desc",
      ),
    );


  const snapshot =
    await getDocs(
      customersQuery,
    );


  return snapshot.docs.map(
    (
      document,
    ) => {

      const data =
        document.data();


      return {
        uid:
          document.id,

        name:
          typeof data.name ===
          "string"
            ? data.name
            : "Customer",

        email:
          typeof data.email ===
          "string"
            ? data.email
            : "",

        phone:
          typeof data.phone ===
          "string"
            ? data.phone
            : "",

        photoURL:
          typeof data.photoURL ===
          "string"
            ? data.photoURL
            : "",

        createdAt:
          data.createdAt,

        updatedAt:
          data.updatedAt,
      };
    },
  );
}