import type {
  ReactNode,
} from "react";

import {
  Navbar,
} from "./Navbar";

import Footer from "./Footer";

import {
  useGlobalWebsiteSettings,
} from "../../hooks/useGlobalWebsiteSettings";


interface PageLayoutProps {
  children: ReactNode;
}


/*
 * ==========================================================
 * MAINTENANCE SCREEN
 * ==========================================================
 */

function MaintenanceScreen() {

  return (
    <main className="min-h-screen bg-neutral-950 text-white">

      <div className="flex min-h-screen items-center justify-center px-6 py-20">

        <div className="w-full max-w-2xl text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#D4AF37] text-3xl font-black text-white">
            N
          </div>


          <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
            Nexletronics
          </p>


          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            We’ll be right back.
          </h1>


          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-neutral-400">
            Our website is temporarily unavailable while
            we perform maintenance and improvements.
          </p>


          <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-neutral-300">

            <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />

            Nexletronics is under maintenance

          </div>

        </div>

      </div>

    </main>
  );
}


/*
 * ==========================================================
 * PUBLIC PAGE LAYOUT
 * ==========================================================
 */

export default function PageLayout({
  children,
}: PageLayoutProps) {

  const {
    settings,
    loading,
  } =
    useGlobalWebsiteSettings();


  /*
   * While Firebase is loading, keep rendering the public
   * site instead of flashing the maintenance screen.
   */

  if (
    !loading &&
    settings.maintenanceMode === true
  ) {

    return (
      <MaintenanceScreen />
    );
  }


  return (
    <div className="flex min-h-screen flex-col bg-white">

      <Navbar />


      <main className="min-h-0 flex-1">
        {children}
      </main>


      <Footer />

    </div>
  );
}


export {
  PageLayout,
};