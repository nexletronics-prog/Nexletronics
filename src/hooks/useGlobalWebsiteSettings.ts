import {
  useEffect,
  useState,
} from "react";

import {
  defaultGlobalWebsiteSettings,
  subscribeToGlobalWebsiteSettings,
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


  useEffect(() => {

    let mounted = true;


    const unsubscribe =
      subscribeToGlobalWebsiteSettings(

        (nextSettings) => {

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


        (listenerError) => {

          if (!mounted) {
            return;
          }


          console.error(
            "Global settings listener error:",
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


export default useGlobalWebsiteSettings;