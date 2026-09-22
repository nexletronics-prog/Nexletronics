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
  ] = useState<User | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /*
   * ========================================================
   * FIREBASE AUTH STATE LISTENER
   * ========================================================
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (
          currentUser,
        ) => {
          setUser(
            currentUser,
          );

          setLoading(
            false,
          );
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
         * Current Firebase user
         */
        user,

        /*
         * Initial authentication loading
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