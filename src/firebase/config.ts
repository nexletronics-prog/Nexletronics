import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app";

import {
  getAuth,
  type Auth,
} from "firebase/auth";

import {
  getFirestore,
  type Firestore,
} from "firebase/firestore";

import {
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";


/*
 * ==========================================================
 * FIREBASE CONFIGURATION
 * ==========================================================
 */

const firebaseConfig = {
  apiKey:
    "AIzaSyAnnhAFGSJIwZ20JsofHPJZoGlUz4s8550",

  authDomain:
    "nexletronics-81270.firebaseapp.com",

  databaseURL:
    "https://nexletronics-81270-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "nexletronics-81270",

  storageBucket:
    "nexletronics-81270.firebasestorage.app",

  messagingSenderId:
    "971410879495",

  appId:
    "1:971410879495:web:bf2c75e3973652dc4de6a2",

  measurementId:
    "G-QE22GMB7YJ",
};


/*
 * ==========================================================
 * SINGLE FIREBASE APP INSTANCE
 * ==========================================================
 *
 * IMPORTANT:
 *
 * Never call initializeApp() anywhere else in src/.
 *
 * This prevents:
 *
 * FirebaseError:
 * Firebase App named '[DEFAULT]' already exists...
 *
 */

export const firebaseApp: FirebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        firebaseConfig,
      );


/*
 * ==========================================================
 * FIREBASE AUTHENTICATION
 * ==========================================================
 */

export const auth: Auth =
  getAuth(
    firebaseApp,
  );


/*
 * ==========================================================
 * FIRESTORE
 * ==========================================================
 */

export const db: Firestore =
  getFirestore(
    firebaseApp,
  );


/*
 * ==========================================================
 * FIREBASE STORAGE
 * ==========================================================
 */

export const storage: FirebaseStorage =
  getStorage(
    firebaseApp,
  );


/*
 * ==========================================================
 * FIREBASE CLOUD FUNCTIONS
 * ==========================================================
 *
 * Functions are deployed in the same region as the secure
 * order function.
 *
 */

export const functions: Functions =
  getFunctions(
    firebaseApp,
    "asia-south1",
  );


/*
 * ==========================================================
 * LOCAL FUNCTIONS EMULATOR
 * ==========================================================
 *
 * The emulator is used only while running the Vite
 * development server.
 *
 * Production/Vercel builds use the deployed Cloud Function.
 *
 */

const isDevelopment =
  import.meta.env.DEV;


if (isDevelopment) {
  connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    5001,
  );
}