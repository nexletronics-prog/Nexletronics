import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import "./index.css";

import App from "./App";

import {
  AuthProvider,
} from "./contexts/AuthContext";

import {
  CartProvider,
} from "./contexts/CartContext";


const root =
  document.getElementById(
    "root",
  );


if (!root) {
  throw new Error(
    "Root element was not found.",
  );
}


createRoot(root).render(
  <StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <CartProvider>

          <App />

        </CartProvider>

      </AuthProvider>

    </BrowserRouter>

  </StrictMode>,
);