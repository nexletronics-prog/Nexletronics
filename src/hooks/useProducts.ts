import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getProducts,
} from "../services/product.service";

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

interface ProductLoadResult {
  products: Product[];
  usingFallback: boolean;
  error: string | null;
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

  /*
   * Fetching is kept separate from state updates.
   * This avoids triggering the set-state-in-effect rule.
   */

  const fetchProducts = useCallback(
    async (): Promise<ProductLoadResult> => {
      try {
        const supabaseProducts =
          await getProducts();

        if (
          supabaseProducts.length > 0
        ) {
          return {
            products: supabaseProducts,
            usingFallback: false,
            error: null,
          };
        }

        return {
          products: localProducts,
          usingFallback: true,
          error: null,
        };
      } catch (err) {
        console.error(
          "Failed to load Supabase products:",
          err,
        );

        return {
          products: localProducts,
          usingFallback: true,
          error:
            "Unable to load products from Supabase. Showing available products instead.",
        };
      }
    },
    [],
  );

  /*
   * Initial product loading.
   * State updates happen after the asynchronous fetch completes.
   */

  useEffect(() => {
    let cancelled = false;

    void fetchProducts().then(
      (result) => {
        if (cancelled) {
          return;
        }

        setProducts(
          result.products,
        );

        setUsingFallback(
          result.usingFallback,
        );

        setError(
          result.error,
        );

        setLoading(
          false,
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [
    fetchProducts,
  ]);

  /*
   * Manual refresh.
   */

  const refresh = useCallback(
    async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const result =
        await fetchProducts();

      setProducts(
        result.products,
      );

      setUsingFallback(
        result.usingFallback,
      );

      setError(
        result.error,
      );

      setLoading(false);
    },
    [
      fetchProducts,
    ],
  );

  return {
    products,
    loading,
    error,
    usingFallback,
    refresh,
  };
}