import {
  Cpu,
  Headphones,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";


const features = [
  {
    number: "01",
    title: "Innovation",
    description:
      "Modern technology designed around practical customer needs, from concept to usable solution.",
    icon: Lightbulb,
  },
  {
    number: "02",
    title: "Reliability",
    description:
      "Products and solutions focused on quality, dependable performance and long-term usability.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Support",
    description:
      "A customer-first approach from initial enquiry through implementation and continued support.",
    icon: Headphones,
  },
];


export function Features() {
  return (
    <section className="relative overflow-hidden bg-white py-24">

      {/* Background decoration */}

      <div className="pointer-events-none absolute -right-40 top-10 h-80 w-80 rounded-full bg-[#D4AF37]/8 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-neutral-100 blur-3xl" />


      <div className="container-custom relative">

        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-4 py-2">

              <Sparkles
                size={14}
                className="text-[#D4AF37]"
              />

              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Why Nexletronics
              </span>

            </div>


            <h2 className="mt-5 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              Technology that solves
              <span className="text-[#D4AF37]">
                {" "}real problems.
              </span>
            </h2>


            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600">
              We combine electronics, embedded technology and practical
              engineering thinking to create solutions that are useful,
              dependable and ready for the real world.
            </p>

          </div>


          <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm lg:flex">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-950 text-[#D4AF37]">
              <Cpu size={21} />
            </div>

            <div>

              <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                NEXLETRONICS
              </p>

              <p className="mt-1 text-sm font-bold text-neutral-900">
                Built for builders
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            FEATURE CARDS
        =================================================== */}

        <div className="mt-12 grid gap-5 lg:grid-cols-3">

          {features.map(
            ({
              number,
              title,
              description,
              icon: Icon,
            }) => (
              <article
                key={number}
                className="group relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[0_25px_70px_rgba(30,30,30,0.10)] sm:p-8"
              >

                {/* Gold accent */}

                <div className="absolute left-0 top-0 h-1 w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />


                <div className="flex items-start justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] transition duration-300 group-hover:bg-[#D4AF37] group-hover:text-white">

                    <Icon size={25} />

                  </div>


                  <span className="text-5xl font-black leading-none text-neutral-100 transition duration-300 group-hover:text-[#D4AF37]/15">
                    {number}
                  </span>

                </div>


                <h3 className="mt-8 text-2xl font-black text-neutral-950">
                  {title}
                </h3>


                <p className="mt-4 leading-7 text-neutral-600">
                  {description}
                </p>


                <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">

                  <span className="h-px w-7 bg-[#D4AF37]" />

                  Nexletronics

                </div>

              </article>
            ),
          )}

        </div>


        {/* ==================================================
            BOTTOM TECHNOLOGY STRIP
        =================================================== */}

        <div className="mt-8 overflow-hidden rounded-[2rem] bg-neutral-950">

          <div className="grid md:grid-cols-3">

            <div className="flex items-center gap-4 border-b border-white/10 p-6 md:border-b-0 md:border-r">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Zap size={20} />
              </div>

              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#D4AF37]">
                  Fast
                </p>

                <p className="mt-1 text-sm text-neutral-300">
                  Practical solutions without unnecessary complexity.
                </p>

              </div>

            </div>


            <div className="flex items-center gap-4 border-b border-white/10 p-6 md:border-b-0 md:border-r">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Cpu size={20} />
              </div>

              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#D4AF37]">
                  Smart
                </p>

                <p className="mt-1 text-sm text-neutral-300">
                  Electronics and technology designed with purpose.
                </p>

              </div>

            </div>


            <div className="flex items-center gap-4 p-6">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <ShieldCheck size={20} />
              </div>

              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#D4AF37]">
                  Dependable
                </p>

                <p className="mt-1 text-sm text-neutral-300">
                  Focused on quality, reliability and real-world use.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


export default Features;