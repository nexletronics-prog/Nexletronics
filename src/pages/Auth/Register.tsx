import { Link } from "react-router-dom";
import RegisterForm from "../../components/forms/RegisterForm";

export default function Register() {
  return (
    <section className="section bg-neutral-50">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black">
          Create account
        </h1>

        <p className="mt-2 text-neutral-500">
          Join Nexletronics.
        </p>

        <div className="mt-7">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already registered?{" "}

          <Link
            to="/login"
            className="font-bold text-[#D4AF37]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}