import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./config";


/*
 * ==========================================================
 * REGISTER USER
 * ==========================================================
 */

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {

  const cleanName =
    name.trim();

  const cleanEmail =
    email.trim().toLowerCase();


  if (
    cleanName.length <
    2
  ) {

    throw new Error(
      "Please enter your full name.",
    );
  }


  if (
    !cleanEmail
  ) {

    throw new Error(
      "Please enter your email address.",
    );
  }


  if (
    password.length <
    6
  ) {

    throw new Error(
      "Password must contain at least 6 characters.",
    );
  }


  /*
   * Create Firebase Authentication account.
   */

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password,
    );


  /*
   * Set display name.
   */

  await updateProfile(
    credential.user,
    {
      displayName:
        cleanName,
    },
  );


  /*
   * Create customer profile.
   *
   * Public registration can NEVER create an admin.
   */

  await setDoc(
    doc(
      db,
      "users",
      credential.user.uid,
    ),
    {
      uid:
        credential.user.uid,

      name:
        cleanName,

      email:
        cleanEmail,

      role:
        "customer",

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    },
  );


  /*
   * ========================================================
   * SEND FIREBASE EMAIL VERIFICATION
   * ========================================================
   */

  await sendEmailVerification(
    credential.user,
  );


  return credential.user;
}


/*
 * ==========================================================
 * EMAIL / PASSWORD LOGIN
 * ==========================================================
 */

export async function loginUser(
  email: string,
  password: string,
) {

  const cleanEmail =
    email.trim().toLowerCase();


  if (
    !cleanEmail
  ) {

    throw new Error(
      "Please enter your email address.",
    );
  }


  if (
    !password
  ) {

    throw new Error(
      "Please enter your password.",
    );
  }


  const credential =
    await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password,
    );


  /*
   * Firebase may have an old cached user object.
   *
   * Reload to get the current emailVerified state.
   */

  await credential.user.reload();


  const currentUser =
    auth.currentUser;


  if (
    !currentUser
  ) {

    throw new Error(
      "Unable to load your account. Please sign in again.",
    );
  }


  /*
   * Block unverified email/password accounts.
   */

  if (
    !currentUser.emailVerified
  ) {

    /*
     * Keep the account safe, but don't leave the user
     * authenticated in the application.
     */

    await signOut(
      auth,
    );


    throw new Error(
      "Please verify your email address before signing in. Check your inbox for the Firebase verification email.",
    );
  }


  return currentUser;
}


/*
 * ==========================================================
 * GOOGLE LOGIN
 * ==========================================================
 */

export async function loginWithGoogle() {

  const provider =
    new GoogleAuthProvider();


  provider.setCustomParameters({
    prompt:
      "select_account",
  });


  const credential =
    await signInWithPopup(
      auth,
      provider,
    );


  const user =
    credential.user;


  /*
   * Google accounts are normally already email verified.
   *
   * We still make sure the Firebase user reports the
   * current verification state.
   */

  await user.reload();


  /*
   * ========================================================
   * CUSTOMER PROFILE
   * ========================================================
   */

  const userRef =
    doc(
      db,
      "users",
      user.uid,
    );


  const existingSnapshot =
    await getDoc(
      userRef,
    );


  /*
   * NEW GOOGLE USER
   *
   * Create as customer.
   */

  if (
    !existingSnapshot.exists()
  ) {

    await setDoc(
      userRef,
      {
        uid:
          user.uid,

        name:
          user.displayName ??
          "",

        email:
          user.email ??
          "",

        role:
          "customer",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );

  } else {

    /*
     * EXISTING USER
     *
     * Do not modify the role.
     *
     * This keeps existing admins as admins.
     */

    await setDoc(
      userRef,
      {
        uid:
          user.uid,

        name:
          user.displayName ??
          "",

        email:
          user.email ??
          "",

        updatedAt:
          serverTimestamp(),
      },
      {
        merge:
          true,
      },
    );
  }


  return user;
}


/*
 * ==========================================================
 * LOGOUT
 * ==========================================================
 */

export async function logoutUser() {

  await signOut(
    auth,
  );
}