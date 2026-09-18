import {
  ArrowRight,
  LogOut,
  ShoppingBag,
  UserCircle,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";


export default function Dashboard() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();


  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );
    }
  }


  return (
    <section className="bg-white py-12 sm:py-16">

      <div className="container-custom">

        {/* HEADER */}

        <div className="rounded-[2rem] bg-neutral-950 p-7 text-white sm:p-10">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Dashboard
          </p>


          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Welcome,{" "}
            {user?.displayName ||
              user?.email ||
              "User"}
          </h1>


          <p className="mt-4 max-w-2xl leading-7 text-neutral-400">
            Manage your account and continue exploring Nexletronics.
          </p>

        </div>


        {/* ACCOUNT */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-sm">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <UserCircle
                  size={24}
                />

              </div>


              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                  Account
                </p>

                <h2 className="mt-1 text-xl font-black text-neutral-950">
                  Your Profile
                </h2>

              </div>

            </div>


            <div className="mt-7 rounded-2xl bg-[#faf9f5] p-5">

              <p className="text-xs font-semibold text-neutral-400">
                Signed in as
              </p>

              <p className="mt-2 break-all font-bold text-neutral-950">
                {user?.email ||
                  "Unknown"}
              </p>

            </div>

          </div>


          <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-sm">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <ShoppingBag
                  size={24}
                />

              </div>


              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                  Store
                </p>

                <h2 className="mt-1 text-xl font-black text-neutral-950">
                  Continue Shopping
                </h2>

              </div>

            </div>


            <p className="mt-5 text-sm leading-7 text-neutral-500">
              Browse the latest electronics, development boards,
              sensors and technology products.
            </p>


            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-white transition hover:bg-[#b99622]"
            >
              Browse Products

              <ArrowRight
                size={16}
              />
            </Link>

          </div>

        </div>


        {/* ACCOUNT ACTIONS */}

        <div className="mt-8 rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-black text-neutral-950">
                Account Actions
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Sign out of your Nexletronics account.
              </p>

            </div>


            <button
              type="button"
              onClick={
                handleLogout
              }
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-black text-red-600 transition hover:bg-red-50"
            >

              <LogOut
                size={17}
              />

              Logout

            </button>

          </div>

        </div>

      </div>

    </section>
  );
}