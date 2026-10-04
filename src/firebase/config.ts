import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";

import {
  getAuth,
  type Auth,
} from "firebase/auth";


/*
 * ==========================================================
 * FIREBASE CONFIGURATION
 * ==========================================================
 *
 * Firebase is used ONLY for authentication / identity.
 *
 * Application data:
 *   Supabase
 *
 * File storage:
 *   Supabase Storage
 *
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
    "G-QE22GMB7Y",
};


/*
 * ==========================================================
 * SINGLE FIREBASE APP
 * ==========================================================
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
 *
 * Firebase handles:
 *
 * - Signup
 * - Login
 * - Google Login
 * - Password authentication
 * - Firebase UID
 * - Authentication session
 * - Existing email verification flow
 */

export const auth: Auth =
  getAuth(
    firebaseApp,
  );