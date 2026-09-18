export default function About() {
  return (
    <div className="bg-white">

      <section className="gradient-hero py-20 sm:py-24">
        <div className="container-custom">

          <p className="font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            About Nexletronics
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl">
            Technology built around people and practical problems.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
            Nexletronics brings together electronics, software and product
            thinking to create technology that is useful, dependable and
            practical.
          </p>

        </div>
      </section>


      <section className="section">
        <div className="container-custom">

          <div className="grid gap-8 lg:grid-cols-2">

            <article className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Who we are
              </p>

              <h2 className="mt-4 text-3xl font-black text-neutral-950">
                Building useful technology.
              </h2>

              <p className="mt-5 leading-8 text-neutral-600">
                Nexletronics is focused on electronics and technology
                solutions that combine hardware, software and thoughtful
                product design.
              </p>

            </article>


            <article className="rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-8 sm:p-10">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Our approach
              </p>

              <h2 className="mt-4 text-3xl font-black text-neutral-950">
                Practical first. Always improving.
              </h2>

              <p className="mt-5 leading-8 text-neutral-600">
                We start with the real requirement, build a practical
                solution, validate it and continuously improve it.
              </p>

            </article>

          </div>


          <div className="mt-8 rounded-[2rem] bg-neutral-950 p-8 text-white sm:p-10">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Nexletronics
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Electronics • Embedded • Technology • Innovation
            </h2>

            <p className="mt-5 max-w-3xl leading-8 text-neutral-300">
              Our goal is to make technology understandable, useful and
              scalable—from individual products and development hardware to
              complete technology solutions.
            </p>

          </div>

        </div>
      </section>

    </div>
  );
}