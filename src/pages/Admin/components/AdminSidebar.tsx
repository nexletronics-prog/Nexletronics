import {
  Boxes,
  FileText,
  Globe,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  authService,
} from "../../../services/auth.service";


/*
 * ==========================================================
 * ADMIN NAVIGATION
 * ==========================================================
 */

const links = [

  {
    label:
      "Dashboard",

    path:
      "/admin",

    icon:
      LayoutDashboard,

    end:
      true,
  },


  {
    label:
      "Products",

    path:
      "/admin/products",

    icon:
      Boxes,
  },


  {
    label:
      "Orders",

    path:
      "/admin/orders",

    icon:
      ShoppingBag,
  },


  {
    label:
      "Customers",

    path:
      "/admin/customers",

    icon:
      Users,
  },


  {
    label:
      "3D Printing",

    path:
      "/admin/3d-printing",

    icon:
      Printer,
  },


  {
    label:
      "Custom Solutions",

    path:
      "/admin/custom-solutions",

    icon:
      ImagePlus,
  },


  {
    label:
      "Showcase",

    path:
      "/admin/custom-solutions/showcase",

    icon:
      ImagePlus,
  },


  {
    label:
      "Enquiries",

    path:
      "/admin/contacts",

    icon:
      FileText,
  },


  {
    label:
      "Website",

    path:
      "/admin/website",

    icon:
      Globe,
  },


  {
    label:
      "Settings",

    path:
      "/admin/settings",

    icon:
      Settings,
  },

];


/*
 * ==========================================================
 * ADMIN SIDEBAR
 * ==========================================================
 */

export default function AdminSidebar() {

  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    );


  const navigate =
    useNavigate();


  /*
   * ========================================================
   * LOGOUT
   * ========================================================
   */

  async function logout() {

    try {

      await authService.logout();

    } catch (
      error
    ) {

      console.error(
        "Logout failed:",
        error,
      );

    } finally {

      navigate(
        "/login",
        {
          replace:
            true,
        },
      );

    }
  }


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (

    <>

      {/* ====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37] font-black text-white">

            N

          </div>


          <span className="font-black text-neutral-950">

            Nexletronics

          </span>

        </div>


        <button
          type="button"

          onClick={() =>
            setOpen(
              true,
            )
          }

          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200"

          aria-label="Open admin menu"
        >

          <Menu
            size={20}
          />

        </button>

      </div>


      {/* ====================================================
          MOBILE BACKDROP
      ===================================================== */}

      {open && (

        <button
          type="button"

          aria-label="Close menu"

          onClick={() =>
            setOpen(
              false,
            )
          }

          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />

      )}


      {/* ====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-200",

          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",

        ].join(
          " ",
        )}
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex h-20 items-center justify-between border-b border-neutral-200 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] font-black text-white">

              N

            </div>


            <div>

              <p className="font-black text-neutral-950">

                Nexletronics

              </p>


              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">

                Admin Panel

              </p>

            </div>

          </div>


          <button
            type="button"

            onClick={() =>
              setOpen(
                false,
              )
            }

            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 lg:hidden"

            aria-label="Close admin menu"
          >

            <X
              size={18}
            />

          </button>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">

            Management

          </p>


          <div className="space-y-1">

            {
              links.map(
                ({
                  label,
                  path,
                  icon:
                    Icon,
                  end,
                }) => (

                  <NavLink
                    key={
                      path
                    }

                    to={
                      path
                    }

                    end={
                      end
                    }

                    onClick={() =>
                      setOpen(
                        false,
                      )
                    }

                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",

                        isActive
                          ? "bg-[#D4AF37]/10 text-[#9b7e1d]"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950",

                      ].join(
                        " ",
                      )
                    }
                  >

                    {({
                      isActive,
                    }) => (

                      <>

                        <Icon
                          size={18}

                          className={
                            isActive
                              ? "text-[#D4AF37]"
                              : "text-neutral-400"
                          }
                        />


                        <span>

                          {
                            label
                          }

                        </span>

                      </>

                    )}

                  </NavLink>

                ),
              )
            }

          </div>

        </nav>


        {/* =================================================
            BOTTOM
        ================================================== */}

        <div className="border-t border-neutral-200 p-4">

          <NavLink
            to="/"

            target="_blank"

            rel="noreferrer"

            className="mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
          >

            <Globe
              size={18}
              className="text-neutral-400"
            />

            View Website

          </NavLink>


          <button
            type="button"

            onClick={() =>
              void logout()
            }

            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >

            <LogOut
              size={18}
            />

            Logout

          </button>

        </div>

      </aside>


      {/* ====================================================
          MOBILE SPACER
      ===================================================== */}

      <div className="h-16 lg:hidden" />

    </>

  );
}