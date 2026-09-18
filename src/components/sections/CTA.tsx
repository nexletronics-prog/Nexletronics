import {
  ArrowRight,
  Cpu,
  Mail,
  Sparkles,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


export function CTA() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-28">

      {/* ==================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-neutral-100 blur-3xl" />

        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-[#D4AF37]/5 blur-3xl" />

      </div>


      <div className="container-custom relative">

        {/* ==================================================
            MAIN CTA
        =================================================== */}

        <div className="relative overflow-hidden rounded-[2.5rem] bg-neutral-950 px-7 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.18)] sm:px-12 sm:py-16 lg:px-16 lg:py-20">

          {/* Circuit pattern */}

          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(212,175,55,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.12) 1px, transparent 1px)",
              backgroundSize:
                "42px 42px",
            }}
          />


          {/* Gold glow */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#D4AF37]/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />


          <div className="relative grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">

            {/* =================================================
                LEFT
            ================================================== */}

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2">

                <Sparkles
                  size={14}
                  className="text-[#D4AF37]"
                />

                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  Let&apos;s Build
                </span>

              </div>


              <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Have a
                <span className="text-[#D4AF37]">
                  {" "}technology idea?
                </span>
              </h2>


              <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
                Tell us what you are building. Whether you need
                electronics, embedded systems, development hardware
                or a custom technology solution, let&apos;s explore
                the next step together.
              </p>


              {/* Buttons */}

              <div className="mt-9 flex flex-wrap gap-4">

                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#b99622]"
                >
                  Start a Conversation

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>


                <Link
                  to="/products"
                  className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:bg-white/10"
                >
                  Explore Products
                </Link>

              </div>

            </div>


            {/* =================================================
                RIGHT
            ================================================== */}

            <div className="w-full max-w-sm">

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                  <Cpu
                    size={25}
                  />

                </div>


                <h3 className="mt-6 text-xl font-black text-white">
                  Built for real projects
                </h3>


                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  Practical technology, dependable products and
                  solutions designed around what you actually need.
                </p>


                <div className="mt-6 h-px bg-white/10" />


                <div className="mt-5 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                    <Mail
                      size={18}
                    />

                  </div>


                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
                      Contact
                    </p>

                    <p className="mt-1 text-sm font-bold text-white">
                      Let&apos;s discuss your idea
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              BOTTOM BRAND LINE
          =================================================== */}

          <div className="relative mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
              Nexletronics • Technology • Electronics • Innovation
            </p>


            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />

              <span className="text-xs font-bold text-neutral-500">
                Ready when you are
              </span>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


export default CTA;