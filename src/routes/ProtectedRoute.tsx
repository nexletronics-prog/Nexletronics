import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  useAuth,
} from "../hooks/useAuth";


export function ProtectedRoute() {
  const {
    user,
    loading,
  } = useAuth();

  const location =
    useLocation();


  /*
   * ----------------------------------------------------------
   * AUTHENTICATION IS STILL LOADING
   * ----------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }


  /*
   * ----------------------------------------------------------
   * USER IS NOT AUTHENTICATED
   * ----------------------------------------------------------
   */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }


  /*
   * ----------------------------------------------------------
   * USER IS AUTHENTICATED
   * ----------------------------------------------------------
   */

  return <Outlet />;
}


/*
 * Default export
 *
 * This supports:
 *
 * import ProtectedRoute from "./ProtectedRoute";
 *
 * and:
 *
 * import { ProtectedRoute } from "./ProtectedRoute";
 */

export default ProtectedRoute;