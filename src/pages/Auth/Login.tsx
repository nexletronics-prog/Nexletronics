import {
  Link,
} from "react-router-dom";

import {
  LoginForm,
} from "../../components/forms/LoginForm";


export default function Login() {
  return (
    <section className="section bg-[#faf9f5]">

      <div className="container-custom">

        <div className="mx-auto max-w-md">

          <div className="mb-8 text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
              Nexletronics Account
            </p>

            <h1 className="mt-3 text-4xl font-black text-neutral-950">
              Welcome back
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Sign in to your Nexletronics account.
            </p>

          </div>


          <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-xl sm:p-9">

            <LoginForm />

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-bold text-neutral-400">
                OR
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <p className="text-center text-sm text-neutral-500">
              New here?{" "}
              <Link
                to="/register"
                className="font-black text-[#9b7e1d] transition hover:text-[#D4AF37]"
              >
                Create an account
              </Link>
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}