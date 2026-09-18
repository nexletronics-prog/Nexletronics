import {
  useEffect,
  useState,
} from "react";

import {
  defaultHomepageSettings,
  subscribeToHomepageSettings,
} from "../services/siteSettings.service";

import type {
  HomepageSettings,
} from "../types/siteSettings";


export default function useHomepageSettings() {

  const [
    settings,
    setSettings,
  ] = useState<HomepageSettings>(
    defaultHomepageSettings,
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


  useEffect(() => {

    let mounted = true;


    const unsubscribe =
      subscribeToHomepageSettings(

        (
          nextSettings,
        ) => {

          if (!mounted) {
            return;
          }


          setSettings(
            nextSettings,
          );


          setLoading(
            false,
          );


          setError(
            null,
          );
        },


        (
          listenerError,
        ) => {

          if (!mounted) {
            return;
          }


          console.error(
            "Homepage settings realtime error:",
            listenerError,
          );


          setError(
            listenerError,
          );


          setLoading(
            false,
          );
        },
      );


    return () => {

      mounted = false;

      unsubscribe();

    };

  }, []);


  return {
    settings,
    loading,
    error,
  };
}