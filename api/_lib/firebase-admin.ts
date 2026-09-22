import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getFirestore,
} from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID;

const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL;

const privateKey =
  process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  throw new Error(
    "Missing FIREBASE_PROJECT_ID",
  );
}

if (!clientEmail) {
  throw new Error(
    "Missing FIREBASE_CLIENT_EMAIL",
  );
}

if (!privateKey) {
  throw new Error(
    "Missing FIREBASE_PRIVATE_KEY",
  );
}

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey:
            privateKey.replace(
              /\\n/g,
              "\n",
            ),
        }),
      });

export const adminAuth =
  getAuth(firebaseAdminApp);

export const adminDb =
  getFirestore(firebaseAdminApp);