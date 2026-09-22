import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  loginUser,
  logoutUser,
  registerUser,
} from "../firebase/auth";

import {
  auth,
} from "../firebase/config";

/*
 * ==========================================================
 * AUTH SERVICE
 * ==========================================================
 */

/*
 * Google sign-in
 *
 * This is implemented here so the rest of the application
 * can use one consistent auth service.
 */
export async function loginWithGoogleAccount() {
  const provider =
    new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const credential =
    await signInWithPopup(
      auth,
      provider,
    );

  return credential.user;
}

/*
 * Compatibility alias.
 *
 * This is used by AuthContext.
 */
export async function loginWithGoogle() {
  return loginWithGoogleAccount();
}

/*
 * Main auth service object.
 */
export const authService = {
  register: registerUser,
  login: loginUser,
  loginWithGoogle,
  logout: logoutUser,
};

/*
 * ==========================================================
 * NAMED HELPERS
 * ==========================================================
 */

export async function register(
  name: string,
  email: string,
  password: string,
) {
  return registerUser(
    name,
    email,
    password,
  );
}

export async function login(
  email: string,
  password: string,
) {
  return loginUser(
    email,
    password,
  );
}

export async function logout() {
  return logoutUser();
}