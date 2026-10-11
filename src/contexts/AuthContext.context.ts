import {
  createContext,
} from "react";

import type {
  User,
} from "firebase/auth";


/*
 * ==========================================================
 * AUTH CONTEXT TYPE
 * ==========================================================
 */

export interface AuthContextValue {
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
 * AUTH CONTEXT
 * ==========================================================
 */

export const AuthContext =
  createContext<
    AuthContextValue |
    undefined
  >(undefined);