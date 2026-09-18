import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  provider?: string;
  role?: "customer" | "admin";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function createUserProfile(
  user: UserProfile,
) {
  if (!user.uid) {
    throw new Error(
      "User UID is required.",
    );
  }

  const userRef = doc(
    db,
    "users",
    user.uid,
  );

  const existingUser =
    await getDoc(userRef);

  if (existingUser.exists()) {
    await updateDoc(userRef, {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      photoURL: user.photoURL ?? "",
      provider: user.provider ?? "password",
      updatedAt: serverTimestamp(),
    });

    return;
  }

  await setDoc(userRef, {
    uid: user.uid,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    photoURL: user.photoURL ?? "",
    provider: user.provider ?? "password",
    role: "customer",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(
  uid: string,
) {
  if (!uid) {
    throw new Error(
      "User UID is required.",
    );
  }

  const userRef = doc(
    db,
    "users",
    uid,
  );

  const snapshot =
    await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateUserProfile(
  uid: string,
  data: {
    name?: string;
    phone?: string;
    photoURL?: string;
  },
) {
  if (!uid) {
    throw new Error(
      "User UID is required.",
    );
  }

  const userRef = doc(
    db,
    "users",
    uid,
  );

  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}