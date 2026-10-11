import {
  useContext,
} from "react";

import {
  AuthContext,
} from "../contexts/AuthContext.context";


export function useAuth() {
  const context =
    useContext(
      AuthContext,
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}