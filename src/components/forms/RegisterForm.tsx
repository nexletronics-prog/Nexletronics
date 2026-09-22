import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  Button,
} from "../common/Button";

import {
  saveRegistrationConsent,
} from "../../services/consent.service";


/*
 * ==========================================================
 * REGISTER FORM
 * ==========================================================
 */

export function RegisterForm() {
  const {
    register,
  } = useAuth();

  const navigate =
    useNavigate();


  /*
   * ========================================================
   * FORM STATE
   * ========================================================
   */

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    termsAccepted,
    setTermsAccepted,
  ] = useState(false);

  const [
    marketingConsent,
    setMarketingConsent,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  /*
   * ========================================================
   * SUBMIT
   * ========================================================
   */

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");


    /*
     * ------------------------------------------------------
     * BASIC VALIDATION
     * ------------------------------------------------------
     */

    if (
      name.trim().length === 0
    ) {
      setError(
        "Please enter your full name.",
      );

      return;
    }


    if (
      email.trim().length === 0
    ) {
      setError(
        "Please enter your email address.",
      );

      return;
    }


    if (
      password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters.",
      );

      return;
    }


    /*
     * ------------------------------------------------------
     * REQUIRED LEGAL CONSENT
     * ------------------------------------------------------
     */

    if (!termsAccepted) {
      setError(
        "Please accept the Terms & Conditions and Privacy Policy to create your account.",
      );

      return;
    }


    /*
     * ------------------------------------------------------
     * CREATE ACCOUNT
     * ------------------------------------------------------
     */

    try {
      setLoading(true);


      /*
       * Firebase creates the account and returns
       * the actual Firebase User object.
       */
      const firebaseUser =
        await register(
          name.trim(),
          email.trim(),
          password,
        );


      /*
       * ----------------------------------------------------
       * SAVE LEGAL CONSENT
       * ----------------------------------------------------
       *
       * This stores:
       *
       * - Terms acceptance
       * - Privacy Policy acceptance
       * - Necessary data consent
       * - Marketing consent
       * - Terms version
       * - Privacy version
       * - Timestamp
       *
       * under:
       *
       * users/{uid}
       */
      await saveRegistrationConsent(
        firebaseUser.uid,
        marketingConsent,
      );


      /*
       * ----------------------------------------------------
       * SUCCESS
       * ----------------------------------------------------
       */

      navigate(
        "/dashboard",
      );

    } catch (err) {
      console.error(
        "Registration failed:",
        err,
      );


      /*
       * Firebase error handling
       */

      if (
        err &&
        typeof err === "object" &&
        "code" in err
      ) {
        const code =
          String(
            (
              err as {
                code?: unknown;
              }
            ).code,
          );


        if (
          code ===
          "auth/email-already-in-use"
        ) {
          setError(
            "An account with this email already exists.",
          );

          return;
        }


        if (
          code ===
          "auth/invalid-email"
        ) {
          setError(
            "Please enter a valid email address.",
          );

          return;
        }


        if (
          code ===
          "auth/weak-password"
        ) {
          setError(
            "Please choose a stronger password.",
          );

          return;
        }


        if (
          code ===
          "permission-denied"
        ) {
          setError(
            "Your account was created, but consent could not be recorded. Please contact support.",
          );

          return;
        }
      }


      setError(
        "Registration failed. Please try again.",
      );

    } finally {
      setLoading(false);
    }
  }


  /*
   * ========================================================
   * UI
   * ========================================================
   */

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
    >

      {/* ================================================
          ERROR
          ================================================ */}

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-600">
          {error}
        </p>
      )}


      {/* ================================================
          NAME
          ================================================ */}

      <input
        required
        value={name}
        onChange={(event) =>
          setName(
            event.target.value,
          )
        }
        placeholder="Full name"
        autoComplete="name"
        className="w-full rounded-2xl border border-neutral-200 px-5 py-4 outline-none transition focus:border-[#D4AF37]"
      />


      {/* ================================================
          EMAIL
          ================================================ */}

      <input
        type="email"
        required
        value={email}
        onChange={(event) =>
          setEmail(
            event.target.value,
          )
        }
        placeholder="Email"
        autoComplete="email"
        className="w-full rounded-2xl border border-neutral-200 px-5 py-4 outline-none transition focus:border-[#D4AF37]"
      />


      {/* ================================================
          PASSWORD
          ================================================ */}

      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(event) =>
          setPassword(
            event.target.value,
          )
        }
        placeholder="Password"
        autoComplete="new-password"
        className="w-full rounded-2xl border border-neutral-200 px-5 py-4 outline-none transition focus:border-[#D4AF37]"
      />


      {/* ================================================
          REQUIRED TERMS + PRIVACY CONSENT
          ================================================ */}

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">

        <label className="flex cursor-pointer items-start gap-3">

          <input
            type="checkbox"
            checked={
              termsAccepted
            }
            onChange={(
              event,
            ) =>
              setTermsAccepted(
                event.target.checked,
              )
            }
            className="mt-1 h-5 w-5 shrink-0 accent-[#D4AF37]"
          />

          <span className="text-sm leading-6 text-neutral-700">

            I have read and agree to the{" "}

            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#D4AF37] underline"
            >
              Terms & Conditions
            </Link>

            {" "}and{" "}

            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#D4AF37] underline"
            >
              Privacy Policy
            </Link>

            . I understand that Nexletronics may process the information necessary to provide my account, process orders and payments, provide customer support, maintain security, prevent fraud, and meet applicable legal or accounting requirements.

          </span>

        </label>

      </div>


      {/* ================================================
          OPTIONAL MARKETING CONSENT
          ================================================ */}

      <div className="rounded-2xl border border-neutral-200 p-4">

        <label className="flex cursor-pointer items-start gap-3">

          <input
            type="checkbox"
            checked={
              marketingConsent
            }
            onChange={(
              event,
            ) =>
              setMarketingConsent(
                event.target.checked,
              )
            }
            className="mt-1 h-5 w-5 shrink-0 accent-[#D4AF37]"
          />

          <span className="text-sm leading-6 text-neutral-600">

            I would like to receive optional promotional emails, special offers and product updates from Nexletronics.

          </span>

        </label>

      </div>


      {/* ================================================
          MARKETING NOTE
          ================================================ */}

      <p className="text-xs leading-5 text-neutral-500">

        Marketing communication is optional and is not required to create or use your account.

      </p>


      {/* ================================================
          SUBMIT
          ================================================ */}

      <Button
        className="w-full"
        type="submit"
        disabled={loading}
      >
        {
          loading
            ? "Creating..."
            : "Create Account"
        }
      </Button>

    </form>
  );
}


/*
 * ==========================================================
 * DEFAULT EXPORT
 * ==========================================================
 *
 * Register.tsx currently imports:
 *
 * import RegisterForm from "../../components/forms/RegisterForm";
 *
 * So we provide the default export as well.
 */

export default RegisterForm;