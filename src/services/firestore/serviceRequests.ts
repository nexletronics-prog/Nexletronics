import {
  addDoc,
  collection,
  orderBy,
  query,
  serverTimestamp,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase";

export type ServiceType =
  | "3d-printing"
  | "custom-project"
  | "software";

export interface CreateServiceRequestData {
  userId?: string;

  name: string;

  email: string;

  phone: string;

  serviceType: ServiceType;

  title: string;

  description: string;

  budget?: string;

  deadline?: string;
}

export async function createServiceRequest(
  data: CreateServiceRequestData,
) {
  if (!data.name.trim()) {
    throw new Error(
      "Name is required.",
    );
  }

  if (!data.email.trim()) {
    throw new Error(
      "Email is required.",
    );
  }

  if (!data.description.trim()) {
    throw new Error(
      "Project description is required.",
    );
  }

  const requestsRef =
    collection(
      db,
      "serviceRequests",
    );

  const document =
    await addDoc(
      requestsRef,
      {
        ...data,

        status: "pending",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );

  return document.id;
}

export async function getUserServiceRequests(
  userId: string,
) {
  if (!userId) {
    return [];
  }

  const requestsRef =
    collection(
      db,
      "serviceRequests",
    );

  const requestsQuery =
    query(
      requestsRef,
      where(
        "userId",
        "==",
        userId,
      ),
      orderBy(
        "createdAt",
        "desc",
      ),
    );

  const snapshot =
    await getDocs(
      requestsQuery,
    );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    }),
  );
}