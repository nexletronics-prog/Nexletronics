import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  Service,
} from "../types/service";


/*
 * ==========================================================
 * COLLECTION
 * ==========================================================
 */

const servicesCollection =
  collection(
    db,
    "services",
  );


/*
 * ==========================================================
 * MAP SERVICE
 * ==========================================================
 */

function mapService(
  id: string,
  data: Partial<Service>,
): Service {
  return {
    id,

    name:
      data.name ??
      "Unnamed service",

    slug:
      data.slug ??
      "",

    category:
      data.category ??
      "Technology Services",

    shortDescription:
      data.shortDescription ??
      "",

    description:
      data.description ??
      "",

    price:
      data.price,

    priceLabel:
      data.priceLabel,

    image:
      data.image,

    featured:
      data.featured ??
      false,

    active:
      data.active ??
      true,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}


/*
 * ==========================================================
 * GET SERVICES
 * ==========================================================
 */

export async function getServices(): Promise<Service[]> {
  const snapshot =
    await getDocs(
      servicesCollection,
    );

  return snapshot.docs.map(
    (
      document,
    ) =>
      mapService(
        document.id,
        document.data() as Partial<Service>,
      ),
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
  if (!id) {
    return null;
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        "services",
        id,
      ),
    );

  if (!snapshot.exists()) {
    return null;
  }

  return mapService(
    snapshot.id,
    snapshot.data() as Partial<Service>,
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
    "id" | "createdAt" | "updatedAt"
  >,
): Promise<string> {
  const document =
    await addDoc(
      servicesCollection,
      {
        ...data,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );

  return document.id;
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
  if (!id) {
    throw new Error(
      "Service ID is required.",
    );
  }

  await updateDoc(
    doc(
      db,
      "services",
      id,
    ),
    {
      ...data,

      updatedAt:
        serverTimestamp(),
    },
  );
}


/*
 * ==========================================================
 * DELETE SERVICE
 * ==========================================================
 */

export async function deleteService(
  id: string,
): Promise<void> {
  if (!id) {
    throw new Error(
      "Service ID is required.",
    );
  }

  await deleteDoc(
    doc(
      db,
      "services",
      id,
    ),
  );
}