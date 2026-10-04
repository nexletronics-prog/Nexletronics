import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  auth,
} from "../firebase/config";

import {
  authService,
} from "../services/auth.service";

import {
  saveCustomerProfile,
} from "../services/customer.service";


/*
 * ==========================================================
 * AUTH CONTEXT TYPE
 * ==========================================================
 */

interface AuthContextValue {
  user:
    | User
    | null;

  loading:
    boolean;

  login:
    (
      email: string,
      password: string,
    ) => Promise<User>;

  loginWithGoogle:
    () => Promise<User>;

  register:
    (
      name: string,
      email: string,
      password: string,
    ) => Promise<User>;

  logout:
    () => Promise<void>;
}


/*
 * ==========================================================
 * CONTEXT
 * ==========================================================
 */

export const AuthContext =
  createContext<
    AuthContextValue |
    undefined
  >(undefined);


/*
 * ==========================================================
 * PROVIDER
 * ==========================================================
 */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /*
   * ========================================================
   * FIREBASE AUTH STATE LISTENER
   * ========================================================
   *
   * Firebase remains the only authentication system.
   *
   * After Firebase authentication succeeds:
   *
   * 1. Ensure the Firebase token contains the Supabase
   *    authentication/admin claims through the backend.
   * 2. Refresh the Firebase token.
   * 3. Ensure the Supabase profile exists.
   * 4. Expose the authenticated Firebase user.
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          currentUser,
        ) => {
          /*
           * ------------------------------------------------
           * NO USER
           * ------------------------------------------------
           */

          if (!currentUser) {
            setUser(
              null,
            );

            setLoading(
              false,
            );

            return;
          }


          /*
           * ------------------------------------------------
           * USER EXISTS
           * ------------------------------------------------
           */

          try {
            console.log(
              "[AUTH] Firebase user detected",
              {
                uid:
                  currentUser.uid,

                email:
                  currentUser.email ?? null,
              },
            );


            /*
             * Get the current Firebase ID token.
             */

            const idToken =
              await currentUser.getIdToken(
                false,
              );


            /*
             * Ask the Vercel backend to ensure:
             *
             * role = authenticated
             * is_admin = true / false
             *
             * and the Supabase profile exists.
             */

            const response =
              await fetch(
                "/api/auth/ensure-supabase-role",
                {
                  method:
                    "POST",

                  headers: {
                    Authorization:
                      `Bearer ${idToken}`,

                    "Content-Type":
                      "application/json",
                  },
                },
              );


            /*
             * Read JSON safely.
             */

            let result:
              {
                success?: boolean;
                uid?: string;
                role?: string;
                is_admin?: boolean;
                error?: string;
              } = {};

            try {
              result =
                await response.json();
            } catch {
              result = {};
            }


            /*
             * Backend failure.
             */

            if (
              !response.ok ||
              result.success !== true
            ) {
              throw new Error(
                result.error ??
                  `Supabase authentication setup failed with status ${response.status}.`,
              );
            }


            /*
             * ------------------------------------------------
             * FORCE TOKEN REFRESH
             * ------------------------------------------------
             *
             * The backend may have changed Firebase custom
             * claims. Refresh the ID token so Supabase sees
             * the current claims immediately.
             */

            await currentUser.getIdToken(
              true,
            );


            /*
             * ------------------------------------------------
             * ENSURE SUPABASE PROFILE
             * ------------------------------------------------
             *
             * IMPORTANT:
             *
             * Do NOT pass "provider" here.
             *
             * saveCustomerProfile() intentionally accepts:
             *   uid
             *   name
             *   email
             *   phone
             *   photoURL
             *
             * The provider value is handled by the backend
             * authentication bridge.
             */

            await saveCustomerProfile({
              uid:
                currentUser.uid,

              name:
                currentUser.displayName?.trim() ||
                "Customer",

              email:
                currentUser.email?.trim() ||
                "",

              phone:
                "",

              photoURL:
                currentUser.photoURL?.trim() ||
                "",
            });


            console.log(
              "[AUTH] Supabase authentication bridge ready",
              {
                uid:
                  currentUser.uid,

                role:
                  result.role ??
                  "authenticated",

                is_admin:
                  result.is_admin ??
                  false,
              },
            );


            /*
             * Now expose the Firebase user to the rest
             * of the application.
             */

            setUser(
              currentUser,
            );
          } catch (
            error
          ) {
            console.error(
              "[AUTH] Supabase authentication bridge failed:",
              error,
            );


            /*
             * Do not expose a partially configured
             * authenticated user to the application.
             */

            setUser(
              null,
            );
          } finally {
            setLoading(
              false,
            );
          }
        },
      );


    return unsubscribe;
  }, []);


  /*
   * ========================================================
   * CONTEXT VALUE
   * ========================================================
   */

  const value =
    useMemo<AuthContextValue>(
      () => ({
        /*
         * Current Firebase user.
         */
        user,

        /*
         * Authentication loading state.
         */
        loading,


        /*
         * ==================================================
         * EMAIL LOGIN
         * ==================================================
         */

        login:
          async (
            email,
            password,
          ) => {
            const loggedInUser =
              await authService.login(
                email,
                password,
              );

            return loggedInUser;
          },


        /*
         * ==================================================
         * GOOGLE LOGIN
         * ==================================================
         */

        loginWithGoogle:
          async () => {
            const googleUser =
              await authService.loginWithGoogle();

            return googleUser;
          },


        /*
         * ==================================================
         * REGISTRATION
         * ==================================================
         */

        register:
          async (
            name,
            email,
            password,
          ) => {
            const registeredUser =
              await authService.register(
                name,
                email,
                password,
              );

            return registeredUser;
          },


        /*
         * ==================================================
         * LOGOUT
         * ==================================================
         */

        logout:
          authService.logout,
      }),
      [
        user,
        loading,
      ],
    );


  /*
   * ========================================================
   * PROVIDER
   * ========================================================
   */

  return (
    <AuthContext.Provider
      value={
        value
      }
    >
      {
        children
      }
    </AuthContext.Provider>
  );
}
