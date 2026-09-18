/*
 * ==========================================================
 * FIREBASE COMPATIBILITY EXPORT
 * ==========================================================
 *
 * IMPORTANT:
 *
 * This file MUST NOT call initializeApp().
 *
 * The Firebase app is initialized ONLY in:
 *
 *     src/firebase/config.ts
 *
 * This file simply re-exports the shared Firebase services.
 *
 */


export {
  firebaseApp,
  auth,
  db,
  storage,
} from "./firebase/config";