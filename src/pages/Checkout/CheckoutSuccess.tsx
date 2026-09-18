import {
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


export default function CheckoutSuccess() {
  return (
    <section className="relative overflow-hidden bg-[#faf9f5] py-24">

      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-neutral-200/50 blur-3xl" />


      <div className="container-custom relative">

        <div className="mx-auto max-w-2xl text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#D4AF37]/10 text-[#D4AF37]">

            <CheckCircle2
              size={48}
            />

          </div>


          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
            Nexletronics
          </p>


          <h1 className="mt-4 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Order placed successfully
          </h1>


          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
            Thank you for choosing Nexletronics. Your order request has
            been received successfully.
          </p>


          <div className="mx-auto mt-8 flex max-w-md items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <ShoppingBag
                size={20}
              />

            </div>

            <div>

              <p className="text-sm font-black text-neutral-950">
                What&apos;s next?
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Our team will process the request and follow up with the
                next steps.
              </p>

            </div>

          </div>


          <div className="mt-8 flex flex-wrap justify-center gap-3">

            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white transition hover:bg-[#b99622]"
            >
              Continue Shopping

              <ArrowRight
                size={17}
              />
            </Link>


            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-7 py-4 text-sm font-black text-neutral-900 transition hover:border-[#D4AF37]"
            >
              Back Home
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}