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
    ) => Promise<void>;

  loginWithGoogle:
    () => Promise<void>;

  register:
    (
      name: string,
      email: string,
      password: string,
    ) => Promise<void>;

  logout:
    () => Promise<void>;
}


export const AuthContext =
  createContext<
    AuthContextValue |
    undefined
  >(undefined);


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


  useEffect(() => {
    return onAuthStateChanged(
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
  }, []);


  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        loading,

        login:
          async (
            email,
            password,
          ) => {
            await authService.login(
              email,
              password,
            );
          },


        loginWithGoogle:
          async () => {
            await authService.loginWithGoogle();
          },


        register:
          async (
            name,
            email,
            password,
          ) => {
            await authService.register(
              name,
              email,
              password,
            );
          },


        logout:
          authService.logout,
      }),
      [
        user,
        loading,
      ],
    );


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