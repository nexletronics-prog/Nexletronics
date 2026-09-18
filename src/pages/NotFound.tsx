import {
  ArrowLeft,
  SearchX,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-[#faf9f5] py-24">

      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />


      <div className="container-custom relative text-center">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#D4AF37]/10 text-[#D4AF37]">

          <SearchX
            size={42}
          />

        </div>


        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
          404
        </p>


        <h1 className="mt-3 text-4xl font-black text-neutral-950 sm:text-5xl">
          Page not found
        </h1>


        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-neutral-500 sm:text-base">
          The page you are looking for doesn&apos;t exist or may have
          been moved.
        </p>


        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-7 py-4 text-sm font-black text-white transition hover:bg-neutral-800"
        >
          <ArrowLeft
            size={17}
          />

          Back Home
        </Link>

      </div>

    </section>
  );
}