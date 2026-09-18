import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  db,
} from "../firebase/config";

import {
  useAuth,
} from "../hooks/useAuth";


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
  ] = useState(true);


  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);


  const [
    roleError,
    setRoleError,
  ] = useState("");


  useEffect(() => {
    let mounted = true;


    async function checkAdminRole() {
      if (
        authLoading
      ) {
        return;
      }


      if (!user) {
        if (mounted) {
          setCheckingRole(
            false,
          );

          setIsAdmin(
            false,
          );
        }

        return;
      }


      try {
        setCheckingRole(
          true,
        );

        setRoleError("");


        const snapshot =
          await getDoc(
            doc(
              db,
              "users",
              user.uid,
            ),
          );


        if (!mounted) {
          return;
        }


        if (!snapshot.exists()) {
          setIsAdmin(
            false,
          );

          setRoleError(
            "Your account does not have an admin profile.",
          );

          return;
        }


        const data =
          snapshot.data();


        setIsAdmin(
          data.role ===
            "admin",
        );
      } catch (error) {
        console.error(
          "Failed to check admin role:",
          error,
        );


        if (mounted) {
          setIsAdmin(
            false,
          );

          setRoleError(
            "Unable to verify your admin permissions.",
          );
        }
      } finally {
        if (mounted) {
          setCheckingRole(
            false,
          );
        }
      }
    }


    void checkAdminRole();


    return () => {
      mounted = false;
    };
  }, [
    user,
    authLoading,
  ]);


  if (
    authLoading ||
    checkingRole
  ) {
    return (
      <LoadingSpinner />
    );
  }


  if (!user) {
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


  if (!isAdmin) {
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


  return (
    <Outlet />
  );
}


export default AdminRoute;