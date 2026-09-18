import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  ShoppingCart,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  useCart,
} from "../../contexts/CartContext";

import {
  useGlobalWebsiteSettings,
} from "../../hooks/useGlobalWebsiteSettings";


/*
 * ==========================================================
 * NAVIGATION
 * ==========================================================
 */

interface NavLinkItem {
  label:
    string;

  path:
    string;
}


const NAV_LINKS:
  NavLinkItem[] = [

  {
    label:
      "Home",

    path:
      "/",
  },

  {
    label:
      "About",

    path:
      "/about",
  },

  {
    label:
      "Products",

    path:
      "/products",
  },

  {
    label:
      "3D Printing",

    path:
      "/3d-printing",
  },

  {
    label:
      "Custom Solutions",

    path:
      "/custom-solutions",
  },

  {
    label:
      "Contact",

    path:
      "/contact",
  },

];


/*
 * ==========================================================
 * NAVBAR
 * ==========================================================
 */

export function Navbar() {

  const {
    user,
    logout,
  } =
    useAuth();


  const {
    cartItems,
  } =
    useCart();


  const totalItems =
    useMemo(
      () =>
        Array.isArray(
          cartItems,
        )
          ? cartItems.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.quantity,
              0,
            )
          : 0,

      [
        cartItems,
      ],
    );


  const {
    settings,
  } =
    useGlobalWebsiteSettings();


  const navigate =
    useNavigate();


  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(
      false,
    );


  /*
   * ========================================================
   * LOGOUT
   * ========================================================
   */

  async function handleLogout() {

    try {

      await logout();


      setMobileOpen(
        false,
      );


      navigate(
        "/",
      );

    } catch (
      error
    ) {

      console.error(
        "Logout failed:",
        error,
      );

    }
  }


  /*
   * ========================================================
   * BRAND
   * ========================================================
   */

  const companyName =
    settings.companyName.trim() ||
    "Nexletronics";


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (

    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">

      <div className="container-custom flex h-20 items-center justify-between gap-6">

        {/* ==================================================
            BRAND
        =================================================== */}

        <Link
          to="/"

          onClick={() =>
            setMobileOpen(
              false,
            )
          }

          className="text-2xl font-black tracking-tight text-[#D4AF37]"

          aria-label={
            companyName
          }
        >

          {
            companyName
          }

        </Link>


        {/* ==================================================
            DESKTOP NAVIGATION
        =================================================== */}

        <nav className="hidden items-center gap-7 md:flex">

          {
            NAV_LINKS.map(
              (
                link,
              ) => (

                <NavLink
                  key={
                    link.path
                  }

                  to={
                    link.path
                  }

                  end={
                    link.path ===
                    "/"
                  }

                  className={({
                    isActive,
                  }) =>
                    `text-sm font-semibold transition ${
                      isActive
                        ? "text-[#D4AF37]"
                        : "text-neutral-700 hover:text-[#D4AF37]"
                    }`
                  }
                >

                  {
                    link.label
                  }

                </NavLink>

              ),
            )
          }


          {/* =================================================
              CART
          ================================================== */}

          <Link
            to="/cart"

            className="relative flex items-center gap-2 text-sm font-semibold text-neutral-700 transition hover:text-[#D4AF37]"

            aria-label={
              `Shopping cart${
                totalItems >
                0
                  ? `, ${totalItems} items`
                  : ""
              }`
            }
          >

            <ShoppingCart
              size={19}
            />

            Cart


            {totalItems >
              0 && (

              <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-black text-white">

                {
                  totalItems
                }

              </span>

            )}

          </Link>


          {/* =================================================
              AUTH
          ================================================== */}

          {user ? (

            <>

              <NavLink
                to="/dashboard"

                className={({
                  isActive,
                }) =>
                  `text-sm font-semibold transition ${
                    isActive
                      ? "text-[#D4AF37]"
                      : "text-neutral-700 hover:text-[#D4AF37]"
                  }`
                }
              >

                Dashboard

              </NavLink>


              <button
                type="button"

                onClick={() =>
                  void handleLogout()
                }

                className="text-sm font-semibold text-neutral-700 transition hover:text-red-600"
              >

                Logout

              </button>

            </>

          ) : (

            <Link
              to="/login"

              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >

              Login

            </Link>

          )}

        </nav>


        {/* ==================================================
            MOBILE MENU BUTTON
        =================================================== */}

        <button
          type="button"

          onClick={() =>
            setMobileOpen(
              (
                value,
              ) =>
                !value,
            )
          }

          className="rounded-lg p-2 text-neutral-800 transition hover:bg-neutral-100 md:hidden"

          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }

          aria-expanded={
            mobileOpen
          }
        >

          {mobileOpen ? (

            <X
              size={24}
            />

          ) : (

            <Menu
              size={24}
            />

          )}

        </button>

      </div>


      {/* ====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      {mobileOpen && (

        <div className="border-t border-neutral-200 bg-white md:hidden">

          <nav className="container-custom flex flex-col gap-1 py-4">

            {
              NAV_LINKS.map(
                (
                  link,
                ) => (

                  <NavLink
                    key={
                      link.path
                    }

                    to={
                      link.path
                    }

                    end={
                      link.path ===
                      "/"
                    }

                    onClick={() =>
                      setMobileOpen(
                        false,
                      )
                    }

                    className={({
                      isActive,
                    }) =>
                      `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#D4AF37]/10 text-[#9b7e1d]"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`
                    }
                  >

                    {
                      link.label
                    }

                  </NavLink>

                ),
              )
            }


            {/* MOBILE CART */}

            <Link
              to="/cart"

              onClick={() =>
                setMobileOpen(
                  false,
                )
              }

              className="rounded-xl px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >

              Cart

              {
                totalItems >
                0
                  ? ` (${totalItems})`
                  : ""
              }

            </Link>


            {/* MOBILE AUTH */}

            {user ? (

              <>

                <Link
                  to="/dashboard"

                  onClick={() =>
                    setMobileOpen(
                      false,
                    )
                  }

                  className="rounded-xl px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >

                  Dashboard

                </Link>


                <button
                  type="button"

                  onClick={() =>
                    void handleLogout()
                  }

                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >

                  Logout

                </button>

              </>

            ) : (

              <Link
                to="/login"

                onClick={() =>
                  setMobileOpen(
                    false,
                  )
                }

                className="mt-2 rounded-full bg-neutral-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
              >

                Login

              </Link>

            )}

          </nav>

        </div>

      )}

    </header>
  );
}


export default Navbar;