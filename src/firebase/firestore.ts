import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./config";

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export async function createContactMessage(
  data: ContactMessage,
) {
  const contactRef = collection(db, "contact_messages");

  const document = await addDoc(contactRef, {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    message: data.message.trim(),
    status: "new",
    createdAt: serverTimestamp(),
  });

  return document.id;
}