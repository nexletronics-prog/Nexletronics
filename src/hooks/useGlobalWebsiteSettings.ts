import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  defaultGlobalWebsiteSettings,
  getGlobalWebsiteSettings,
} from "../services/globalSettings.service";

import type {
  GlobalWebsiteSettings,
} from "../types/siteSettings";


export function useGlobalWebsiteSettings() {

  const [
    settings,
    setSettings,
  ] = useState<GlobalWebsiteSettings>(
    defaultGlobalWebsiteSettings,
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<Error | null>(
    null,
  );


  const loadSettings =
    useCallback(
      async () => {

        try {

          const nextSettings =
            await getGlobalWebsiteSettings();

          setSettings(
            nextSettings,
          );

          setError(
            null,
          );

        } catch (
          listenerError
        ) {

          const normalizedError =
            listenerError instanceof Error
              ? listenerError
              : new Error(
                  String(
                    listenerError,
                  ),
                );

          console.error(
            "Global website settings load error:",
            normalizedError,
          );

          setError(
            normalizedError,
          );

        } finally {

          setLoading(
            false,
          );
        }
      },
      [],
    );


  useEffect(() => {

    let mounted = true;


    const initialLoad =
      async () => {

        try {

          const nextSettings =
            await getGlobalWebsiteSettings();

          if (!mounted) {
            return;
          }

          setSettings(
            nextSettings,
          );

          setError(
            null,
          );

        } catch (
          listenerError
        ) {

          if (!mounted) {
            return;
          }

          const normalizedError =
            listenerError instanceof Error
              ? listenerError
              : new Error(
                  String(
                    listenerError,
                  ),
                );

          console.error(
            "Global website settings load error:",
            normalizedError,
          );

          setError(
            normalizedError,
          );

        } finally {

          if (mounted) {
            setLoading(
              false,
            );
          }
        }
      };


    void initialLoad();


    /*
     * Refresh settings whenever the visitor returns
     * to the tab/window. This replaces the previous
     * WebSocket realtime dependency for this table.
     */
    const handleFocus =
      () => {

        if (!mounted) {
          return;
        }

        void loadSettings();
      };


    const handleVisibilityChange =
      () => {

        if (
          !mounted ||
          document.visibilityState !==
            "visible"
        ) {
          return;
        }

        void loadSettings();
      };


    window.addEventListener(
      "focus",
      handleFocus,
    );


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );


    return () => {

      mounted = false;

      window.removeEventListener(
        "focus",
        handleFocus,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };

  }, [
    loadSettings,
  ]);


  return {
    settings,
    loading,
    error,
  };
}


export default useGlobalWebsiteSettings;