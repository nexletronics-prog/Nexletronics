import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import LoadingSpinner
  from "../components/common/LoadingSpinner";

import {
  useAuth,
} from "../hooks/useAuth";

import {
  getCustomerById,
} from "../services/customer.service";


/*
 * ==========================================================
 * ADMIN ROUTE
 * ==========================================================
 *
 * Firebase:
 *   Authentication / identity only
 *
 * Supabase:
 *   Application role
 *
 * Security:
 *   Frontend role check controls navigation/UX.
 *   Supabase RLS/backend policies must enforce the actual
 *   administrative permissions.
 *
 */


export function AdminRoute() {

  const {
    user,
    loading: authLoading,
  } = useAuth();


  const location =
    useLocation();


  const [
    checkingRole,
    setCheckingRole,
  ] =
    useState(true);


  const [
    isAdmin,
    setIsAdmin,
  ] =
    useState(false);


  const [
    roleError,
    setRoleError,
  ] =
    useState("");


  useEffect(
    () => {

      let mounted =
        true;


      async function checkAdminRole() {

        /*
         * ----------------------------------------------------
         * WAIT FOR FIREBASE AUTH
         * ----------------------------------------------------
         */

        if (
          authLoading
        ) {
          return;
        }


        /*
         * ----------------------------------------------------
         * NOT LOGGED IN
         * ----------------------------------------------------
         */

        if (
          !user
        ) {

          if (
            mounted
          ) {

            setCheckingRole(
              false,
            );

            setIsAdmin(
              false,
            );

            setRoleError(
              "",
            );
          }

          return;
        }


        /*
         * ----------------------------------------------------
         * LOAD PROFILE FROM SUPABASE
         * ----------------------------------------------------
         */

        try {

          setCheckingRole(
            true,
          );

          setRoleError(
            "",
          );

          setIsAdmin(
            false,
          );


          const profile =
            await getCustomerById(
              user.uid,
            );


          if (
            !mounted
          ) {
            return;
          }


          /*
           * Supabase is the source of truth for the application
           * role.
           */

          const admin =
            profile?.role ===
            "admin";


          setIsAdmin(
            admin,
          );


          if (
            !admin
          ) {

            setRoleError(
              profile
                ? "Your account does not have admin permissions."
                : "Your account profile was not found.",
            );
          }

        } catch (
          error
        ) {

          console.error(
            "Failed to verify admin role from Supabase:",
            error,
          );


          if (
            mounted
          ) {

            setIsAdmin(
              false,
            );


            setRoleError(
              error instanceof Error
                ? error.message
                : "Unable to verify your admin permissions.",
            );
          }

        } finally {

          if (
            mounted
          ) {

            setCheckingRole(
              false,
            );
          }
        }
      }


      void checkAdminRole();


      return () => {

        mounted =
          false;
      };

    },
    [
      user,
      authLoading,
    ],
  );


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    authLoading ||
    checkingRole
  ) {

    return (
      <LoadingSpinner />
    );
  }


  /*
   * ========================================================
   * LOGIN REQUIRED
   * ========================================================
   */

  if (
    !user
  ) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }


  /*
   * ========================================================
   * ADMIN REQUIRED
   * ========================================================
   */

  if (
    !isAdmin
  ) {

    console.warn(
      roleError ||
        "Non-admin user attempted to access admin route.",
    );


    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  /*
   * ========================================================
   * AUTHORIZED
   * ========================================================
   */

  return (
    <Outlet />
  );
}


export default AdminRoute;