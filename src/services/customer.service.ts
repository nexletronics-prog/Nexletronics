import { supabase } from "../lib/supabase";

export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role?: "customer" | "admin";
  createdAt?: unknown;
  updatedAt?: unknown;
  orderCount?: number;
  totalSpent?: number;
}

interface ProfileRow {
  firebase_uid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function normalizeProfile(row: ProfileRow): CustomerProfile {
  return {
    uid: row.firebase_uid,
    name: typeof row.name === "string" ? row.name : "Customer",
    email: typeof row.email === "string" ? row.email : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    photoURL: typeof row.photo_url === "string" ? row.photo_url : "",
    role: row.role === "admin" ? "admin" : "customer",
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function saveCustomerProfile(profile: {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
}): Promise<void> {
  if (!profile.uid.trim()) {
    throw new Error("Customer UID is required.");
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        firebase_uid: profile.uid.trim(),
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase(),
        phone: profile.phone?.trim() || "",
        photo_url: profile.photoURL?.trim() || "",
      },
      { onConflict: "firebase_uid" },
    );

  if (error) {
    console.error("Failed to save customer profile:", error);
    throw new Error(error.message);
  }
}

export async function getCustomerById(
  uid: string,
): Promise<CustomerProfile | null> {
  if (!uid.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "firebase_uid,name,email,phone,photo_url,role,created_at,updated_at",
    )
    .eq("firebase_uid", uid.trim())
    .maybeSingle();

  if (error) {
    console.error("Failed to load customer profile:", error);
    throw new Error(error.message);
  }

  return data ? normalizeProfile(data as ProfileRow) : null;
}

export async function getCustomers(): Promise<CustomerProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "firebase_uid,name,email,phone,photo_url,role,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load customers:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeProfile(row as ProfileRow));
}
