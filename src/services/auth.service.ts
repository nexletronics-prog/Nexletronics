import {
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
} from "../firebase/auth";


export const authService = {
  register:
    registerUser,

  login:
    loginUser,

  loginWithGoogle:
    loginWithGoogle,

  logout:
    logoutUser,
};


/*
 * ==========================================================
 * NAMED SERVICE FUNCTIONS
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


/*
 * This is the export GoogleSignInButton.tsx expects.
 */

export async function loginWithGoogleAccount() {
  return loginWithGoogle();
}


/*
 * Keep this alias too so existing LoginForm code continues
 * to work.
 */

export async function googleLogin() {
  return loginWithGoogle();
}


export async function logout() {
  return logoutUser();
}