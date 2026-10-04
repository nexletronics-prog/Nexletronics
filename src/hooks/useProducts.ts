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


export function useProducts():
  UseProductsResult {

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      localProducts,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const [
    usingFallback,
    setUsingFallback,
  ] =
    useState(false);


  const loadProducts =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);


        try {
          const supabaseProducts =
            await getProducts();


          if (
            supabaseProducts.length >
            0
          ) {
            setProducts(
              supabaseProducts,
            );

            setUsingFallback(
              false,
            );

            return;
          }


          /*
           * Keep the existing local fallback so the
           * website remains usable when Supabase has
           * no products yet.
           */

          setProducts(
            localProducts,
          );

          setUsingFallback(
            true,
          );
        } catch (
          err
        ) {
          console.error(
            "Failed to load Supabase products:",
            err,
          );


          setProducts(
            localProducts,
          );

          setUsingFallback(
            true,
          );


          setError(
            "Unable to load products from Supabase. Showing available products instead.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadProducts();
  }, [
    loadProducts,
  ]);


  return {
    products,

    loading,

    error,

    usingFallback,

    refresh:
      loadProducts,
  };
}