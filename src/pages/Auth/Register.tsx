import {
  Link,
} from "react-router-dom";

import RegisterForm from "../../components/forms/RegisterForm";


export default function Register() {
  return (
    <section className="section bg-[#faf9f5]">

      <div className="container-custom">

        <div className="mx-auto max-w-md">

          {/* ==================================================
              HEADER
          =================================================== */}

          <div className="mb-8 text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
              Nexletronics Account
            </p>


            <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950">
              Create account
            </h1>


            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Join Nexletronics and start exploring our technology
              products and services.
            </p>

          </div>


          {/* ==================================================
              FORM
          =================================================== */}

          <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-xl sm:p-9">

            <RegisterForm />


            <p className="mt-7 text-center text-sm text-neutral-500">

              Already registered?{" "}

              <Link
                to="/login"
                className="font-black text-[#9b7e1d] transition hover:text-[#D4AF37]"
              >
                Sign in
              </Link>

            </p>

          </div>


          {/* ==================================================
              SECURITY NOTE
          =================================================== */}

          <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
            Your account information is securely handled by
            Nexletronics authentication.
          </p>

        </div>

      </div>

    </section>
  );
}