import {
  onAuthStateChanged,
} from "firebase/auth";

import {
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

import {
  AuthContext,
  type AuthContextValue,
} from "./AuthContext.context";


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
    useState<
      Awaited<
        ReturnType<
          typeof authService["login"]
        >
      > |
      null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /*
   * ========================================================
   * FIREBASE AUTH STATE LISTENER
   * ========================================================
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
                  currentUser.email ??
                  null,
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
             * Ensure Supabase authentication role/profile.
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
              result.success !==
                true
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
             * claims.
             */

            await currentUser.getIdToken(
              true,
            );


            /*
             * ------------------------------------------------
             * ENSURE SUPABASE PROFILE
             * ------------------------------------------------
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
             * Expose the authenticated Firebase user.
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
             * Do not expose a partially configured user.
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