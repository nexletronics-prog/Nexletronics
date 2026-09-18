import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getProducts,
} from "../services/firestore/products";

import {
  products as localProducts,
} from "../utils/products";

import type {
  Product,
} from "../types/product";

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  refresh: () => Promise<void>;
}

export function useProducts(): UseProductsResult {
  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    localProducts,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    usingFallback,
    setUsingFallback,
  ] = useState(false);

  const loadProducts =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const firestoreProducts =
          await getProducts();

        /*
         * If Firestore contains products,
         * use those products.
         */

        if (
          firestoreProducts.length > 0
        ) {
          setProducts(
            firestoreProducts,
          );

          setUsingFallback(false);

          return;
        }

        /*
         * Firestore is empty.
         *
         * Keep using the local products so
         * the website remains functional.
         */

        setProducts(
          localProducts,
        );

        setUsingFallback(true);
      } catch (err) {
        console.error(
          "Failed to load Firestore products:",
          err,
        );

        /*
         * Keep the website usable if Firebase
         * is temporarily unavailable.
         */

        setProducts(
          localProducts,
        );

        setUsingFallback(true);

        setError(
          "Unable to load products from Firebase. Showing available products instead.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    usingFallback,
    refresh: loadProducts,
  };
}