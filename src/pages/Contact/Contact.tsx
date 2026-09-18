import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import {
  ContactForm,
} from "../../components/forms/ContactForm";


export default function Contact() {
  return (
    <div className="bg-white">

      <section className="relative overflow-hidden bg-[#faf9f5] py-20 sm:py-24">

        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="container-custom relative">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
            Contact
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl">
            Let&apos;s talk about your project.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
            Send us your requirement and our team can follow up with the
            next steps.
          </p>

        </div>

      </section>


      <section className="section">

        <div className="container-custom grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">

          {/* LEFT */}

          <div>

            <div className="space-y-4">

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Mail
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black text-neutral-950">
                      Email
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      Contact us through the website enquiry form.
                    </p>
                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Phone
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black text-neutral-950">
                      Phone
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      Share your contact number and our team can follow up.
                    </p>
                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    <MapPin
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black text-neutral-950">
                      Technology
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      Electronics • Embedded • Software • Innovation
                    </p>
                  </div>

                </div>

              </div>

            </div>


            <div className="mt-6 rounded-[2rem] bg-neutral-950 p-7 text-white">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <MessageCircle
                  size={22}
                />
              </div>

              <h2 className="mt-6 text-2xl font-black">
                Tell us what you&apos;re building.
              </h2>

              <p className="mt-3 leading-7 text-neutral-400">
                Give us enough context to understand the requirement and
                we can work from there.
              </p>

            </div>

          </div>


          {/* RIGHT */}

          <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-sm md:p-10">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
              Send an enquiry
            </p>

            <h2 className="mt-3 text-3xl font-black text-neutral-950">
              Contact our team
            </h2>

            <div className="mt-8">
              <ContactForm />
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}