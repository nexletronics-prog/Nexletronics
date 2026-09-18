import {
  ArrowRight,
  Cpu,
  CircuitBoard,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


const highlights = [
  {
    icon: CircuitBoard,
    title: "Electronics",
    text: "Practical hardware for real-world projects and applications.",
  },
  {
    icon: Cpu,
    title: "Embedded Systems",
    text: "Connected devices, firmware and intelligent embedded solutions.",
  },
  {
    icon: Layers3,
    title: "Technology",
    text: "Integrated solutions combining hardware, software and product thinking.",
  },
];


export function AboutPreview() {
  return (
    <section className="relative overflow-hidden bg-[#faf9f5] py-24 sm:py-28">

      {/* ==================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#D4AF37]/8 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-neutral-200/50 blur-3xl" />


      <div className="container-custom relative">

        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">

          {/* =================================================
              BRAND VISUAL
          ================================================== */}

          <div className="relative mx-auto w-full max-w-xl">

            <div className="absolute inset-8 rounded-[3rem] bg-[#D4AF37]/15 blur-3xl" />


            <div className="relative overflow-hidden rounded-[3rem] border border-[#D4AF37]/25 bg-neutral-950 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.12)]">

              <div className="relative min-h-[470px] overflow-hidden rounded-[2.5rem] bg-neutral-950">

                {/* Circuit background */}

                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(212,175,55,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.18) 1px, transparent 1px)",
                    backgroundSize:
                      "42px 42px",
                  }}
                />


                {/* Decorative nodes */}

                <div className="absolute left-8 top-10 h-3 w-3 rounded-full bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.7)]" />

                <div className="absolute right-12 top-32 h-2 w-2 rounded-full bg-[#D4AF37]" />

                <div className="absolute bottom-24 left-16 h-2 w-2 rounded-full bg-[#D4AF37]" />

                <div className="absolute bottom-12 right-10 h-3 w-3 rounded-full bg-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.6)]" />


                {/* Main brand */}

                <div className="relative flex h-full min-h-[470px] flex-col items-center justify-center px-8 text-center">

                  <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[#D4AF37]/30 bg-[#D4AF37]/10 shadow-[0_0_80px_rgba(212,175,55,0.12)]">

                    <span className="text-6xl font-black text-[#D4AF37]">
                      N
                    </span>

                  </div>


                  <p className="mt-8 text-3xl font-black tracking-[0.18em] text-white">
                    NEXLETRONICS
                  </p>


                  <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-400">
                    Technology • Electronics • Innovation
                  </p>


                  <div className="mt-10 flex flex-wrap justify-center gap-2">

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-300">
                      Hardware
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-300">
                      Embedded
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-300">
                      Solutions
                    </span>

                  </div>

                </div>


                {/* Bottom status bar */}

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                        <ShieldCheck size={18} />
                      </span>

                      <div>

                        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#D4AF37]">
                          Reliability
                        </p>

                        <p className="mt-0.5 text-xs text-neutral-400">
                          Built with purpose
                        </p>

                      </div>

                    </div>


                    <span className="text-xs font-black tracking-[0.15em] text-neutral-500">
                      NXL
                    </span>

                  </div>

                </div>

              </div>

            </div>


            {/* Floating badge */}

            <div className="absolute -bottom-5 -right-4 hidden rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-xl sm:block">

              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9b7e1d]">
                Our Approach
              </p>

              <p className="mt-1 text-sm font-black text-neutral-950">
                Simple. Useful. Scalable.
              </p>

            </div>

          </div>


          {/* =================================================
              CONTENT
          ================================================== */}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-white px-4 py-2">

              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />

              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                About Nexletronics
              </span>

            </div>


            <h2 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              Building technology
              <span className="text-[#D4AF37]">
                {" "}with purpose.
              </span>
            </h2>


            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              Nexletronics brings together electronics, software and
              product thinking to develop technology that is practical,
              understandable and useful.
            </p>


            <p className="mt-4 max-w-2xl leading-8 text-neutral-500">
              From individual components and development boards to
              connected systems and custom solutions, our focus is on
              helping people turn ideas into working technology.
            </p>


            {/* =================================================
                HIGHLIGHTS
            ================================================== */}

            <div className="mt-9 grid gap-4 sm:grid-cols-3">

              {highlights.map(
                ({
                  icon: Icon,
                  title,
                  text,
                }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg"
                  >

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                      <Icon size={20} />

                    </div>


                    <h3 className="mt-5 text-sm font-black text-neutral-950">
                      {title}
                    </h3>


                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      {text}
                    </p>

                  </div>
                ),
              )}

            </div>


            {/* =================================================
                CTA
            ================================================== */}

            <div className="mt-9 flex flex-wrap items-center gap-5">

              <Link
                to="/about"
                className="group inline-flex items-center gap-3 rounded-full bg-neutral-950 px-7 py-4 text-sm font-black text-white transition hover:bg-neutral-800"
              >

                Learn More About Us

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />

              </Link>


              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-sm font-black text-[#9b7e1d] transition hover:text-[#D4AF37]"
              >
                Start a Conversation
                <ArrowRight size={16} />
              </Link>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


export default AboutPreview;