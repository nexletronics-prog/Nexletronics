import {
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  RefreshCw,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import GoogleSignInButton from "./GoogleSignInButton";

import {
  register,
} from "../../services/auth.service";

import {
  auth,
} from "../../firebase/config";

import {
  sendEmailVerification,
} from "firebase/auth";


/*
 * ==========================================================
 * REGISTER FORM
 * ==========================================================
 */

function RegisterForm() {

  const navigate =
    useNavigate();


  /*
   * ========================================================
   * REGISTRATION STATE
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
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  /*
   * ========================================================
   * PASSWORD VISIBILITY
   * ========================================================
   */

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  /*
   * ========================================================
   * UI STATE
   * ========================================================
   */

  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    checkingVerification,
    setCheckingVerification,
  ] = useState(false);


  const [
    resending,
    setResending,
  ] = useState(false);


  const [
    verificationSent,
    setVerificationSent,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  /*
   * ========================================================
   * FIREBASE ERROR MESSAGE
   * ========================================================
   */

  function getFirebaseErrorMessage(
    errorValue: unknown,
  ): string {

    if (
      errorValue &&
      typeof errorValue ===
        "object" &&
      "code" in errorValue
    ) {

      const code =
        String(
          (
            errorValue as {
              code?: unknown;
            }
          ).code ??
            "",
        );


      switch (
        code
      ) {

        case "auth/email-already-in-use":

          return (
            "An account with this email already exists. Please sign in instead."
          );


        case "auth/invalid-email":

          return (
            "Please enter a valid email address."
          );


        case "auth/weak-password":

          return (
            "Please choose a stronger password."
          );


        case "auth/operation-not-allowed":

          return (
            "Email/password registration is not enabled in Firebase Authentication."
          );


        case "auth/network-request-failed":

          return (
            "Could not connect to Firebase Authentication."
          );


        case "auth/too-many-requests":

          return (
            "Too many requests. Please wait a moment and try again."
          );


        default:

          break;
      }
    }


    if (
      errorValue instanceof
        Error &&
      errorValue.message.trim()
    ) {

      return errorValue.message;
    }


    return (
      "Unable to create your account. Please try again."
    );
  }


  /*
   * ========================================================
   * REGISTER
   * ========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    setError(
      "",
    );


    setSuccess(
      "",
    );


    /*
     * Basic validation.
     */

    const cleanName =
      name.trim();


    const cleanEmail =
      email.trim()
        .toLowerCase();


    if (
      cleanName.length <
      2
    ) {

      setError(
        "Please enter your full name.",
      );


      return;
    }


    if (
      !cleanEmail
    ) {

      setError(
        "Please enter your email address.",
      );


      return;
    }


    if (
      password.length <
      6
    ) {

      setError(
        "Password must contain at least 6 characters.",
      );


      return;
    }


    if (
      password !==
      confirmPassword
    ) {

      setError(
        "Passwords do not match.",
      );


      return;
    }


    try {

      setLoading(
        true,
      );


      /*
       * register() creates the Firebase account,
       * customer Firestore profile and sends the
       * Firebase verification email.
       */

      await register(
        cleanName,
        cleanEmail,
        password,
      );


      /*
       * The user remains signed in temporarily,
       * but we do NOT send them to the dashboard yet.
       */

      setVerificationSent(
        true,
      );


      setSuccess(
        `Verification email sent to ${cleanEmail}.`,
      );

    } catch (
      registrationError
    ) {

      console.error(
        "Registration error:",
        registrationError,
      );


      setError(
        getFirebaseErrorMessage(
          registrationError,
        ),
      );

    } finally {

      setLoading(
        false,
      );
    }
  }


  /*
   * ========================================================
   * CHECK EMAIL VERIFICATION
   * ========================================================
   */

  async function checkVerification() {

    setError(
      "",
    );


    setSuccess(
      "",
    );


    try {

      setCheckingVerification(
        true,
      );


      const user =
        auth.currentUser;


      if (
        !user
      ) {

        setError(
          "Your registration session has expired. Please create your account again.",
        );


        return;
      }


      /*
       * Reload the Firebase user to get the newest
       * emailVerified value.
       */

      await user.reload();


      const currentUser =
        auth.currentUser;


      if (
        !currentUser
      ) {

        setError(
          "Unable to reload your account. Please sign in again.",
        );


        return;
      }


      if (
        currentUser.emailVerified
      ) {

        setSuccess(
          "Your email has been verified successfully.",
        );


        /*
         * Give the state a moment to show success.
         */

        window.setTimeout(
          () => {

            navigate(
              "/dashboard",
              {
                replace:
                  true,
              },
            );

          },
          500,
        );


        return;
      }


      setError(
        "Your email is not verified yet. Please click the verification link in your email and then try again.",
      );

    } catch (
      verificationError
    ) {

      console.error(
        "Email verification check failed:",
        verificationError,
      );


      setError(
        getFirebaseErrorMessage(
          verificationError,
        ),
      );

    } finally {

      setCheckingVerification(
        false,
      );
    }
  }


  /*
   * ========================================================
   * RESEND VERIFICATION EMAIL
   * ========================================================
   */

  async function resendVerificationEmail() {

    setError(
      "",
    );


    setSuccess(
      "",
    );


    try {

      setResending(
        true,
      );


      const user =
        auth.currentUser;


      if (
        !user
      ) {

        setError(
          "Your registration session has expired. Please create your account again.",
        );


        return;
      }


      /*
       * If already verified, don't resend.
       */

      await user.reload();


      const currentUser =
        auth.currentUser;


      if (
        !currentUser
      ) {

        setError(
          "Unable to load your account.",
        );


        return;
      }


      if (
        currentUser.emailVerified
      ) {

        setSuccess(
          "Your email is already verified.",
        );


        return;
      }


      await sendEmailVerification(
        currentUser,
      );


      setSuccess(
        `A new verification email was sent to ${currentUser.email ?? email}.`,
      );

    } catch (
      resendError
    ) {

      console.error(
        "Resend verification email failed:",
        resendError,
      );


      setError(
        getFirebaseErrorMessage(
          resendError,
        ),
      );

    } finally {

      setResending(
        false,
      );
    }
  }


  /*
   * ========================================================
   * VERIFICATION SCREEN
   * ========================================================
   */

  if (
    verificationSent
  ) {

    const displayEmail =
      email.trim();


    return (
      <div className="space-y-6">

        {/* ==================================================
            ICON
        =================================================== */}

        <div className="flex justify-center">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">

            <MailCheck
              className="h-10 w-10"
            />

          </div>

        </div>


        {/* ==================================================
            TITLE
        =================================================== */}

        <div className="text-center">

          <h2 className="text-2xl font-black text-neutral-950">
            Check your email
          </h2>


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            We sent a verification link to
          </p>


          <p className="mt-1 break-all font-bold text-[#9b7e1d]">
            {
              displayEmail
            }
          </p>

        </div>


        {/* ==================================================
            INFORMATION
        =================================================== */}

        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#faf9f5] p-5 text-sm leading-6 text-neutral-600">

          <p>
            Open the email from Nexletronics and click
            the verification link.
          </p>


          <p className="mt-3 text-xs text-neutral-500">
            After verifying your email, return here and
            click the button below.
          </p>

        </div>


        {/* ==================================================
            ERRORS
        =================================================== */}

        {error && (

          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {
              error
            }
          </div>

        )}


        {/* ==================================================
            SUCCESS
        =================================================== */}

        {success && (

          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
          >
            {
              success
            }
          </div>

        )}


        {/* ==================================================
            CHECK VERIFICATION
        =================================================== */}

        <button
          type="button"
          onClick={() =>
            void checkVerification()
          }
          disabled={
            checkingVerification ||
            resending
          }
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b99622] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >

          {checkingVerification && (

            <Loader2
              className="h-4 w-4 animate-spin"
            />

          )}


          {
            checkingVerification
              ? "Checking..."
              : "I've verified my email"
          }

        </button>


        {/* ==================================================
            RESEND
        =================================================== */}

        <button
          type="button"
          onClick={() =>
            void resendVerificationEmail()
          }
          disabled={
            checkingVerification ||
            resending
          }
          className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#9b7e1d] disabled:cursor-not-allowed disabled:opacity-50"
        >

          {resending ? (

            <Loader2
              className="h-4 w-4 animate-spin"
            />

          ) : (

            <RefreshCw
              className="h-4 w-4"
            />

          )}


          {
            resending
              ? "Sending..."
              : "Resend verification email"
          }

        </button>


        {/* ==================================================
            LOGIN
        =================================================== */}

        <p className="text-center text-sm text-neutral-500">

          Already have an account?{" "}

          <Link
            to="/login"
            className="font-semibold text-[#D4AF37] hover:underline"
          >
            Sign in
          </Link>

        </p>

      </div>
    );
  }


  /*
   * ========================================================
   * REGISTRATION FORM
   * ========================================================
   */

  return (
    <div>

      {error && (

        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {
            error
          }
        </div>

      )}


      <GoogleSignInButton
        onError={
          setError
        }
      />


      <div className="my-6 flex items-center gap-4">

        <div className="h-px flex-1 bg-neutral-200" />

        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Or create with email
        </span>

        <div className="h-px flex-1 bg-neutral-200" />

      </div>


      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5"
      >

        {/* =================================================
            NAME
        ================================================== */}

        <div>

          <label
            htmlFor="register-name"
            className="mb-2 block text-xs font-semibold text-neutral-700"
          >
            Full name
          </label>


          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={
              name
            }
            onChange={(
              event,
            ) =>
              setName(
                event.target.value,
              )
            }
            placeholder="Your name"
            required
            disabled={
              loading
            }
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-[#D4AF37] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />

        </div>


        {/* =================================================
            EMAIL
        ================================================== */}

        <div>

          <label
            htmlFor="register-email"
            className="mb-2 block text-xs font-semibold text-neutral-700"
          >
            Email address
          </label>


          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={
              email
            }
            onChange={(
              event,
            ) =>
              setEmail(
                event.target.value,
              )
            }
            placeholder="you@example.com"
            required
            disabled={
              loading
            }
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-[#D4AF37] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />

        </div>


        {/* =================================================
            PASSWORD
        ================================================== */}

        <div>

          <label
            htmlFor="register-password"
            className="mb-2 block text-xs font-semibold text-neutral-700"
          >
            Password
          </label>


          <div className="relative">

            <input
              id="register-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              value={
                password
              }
              onChange={(
                event,
              ) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder="At least 6 characters"
              required
              disabled={
                loading
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-[#D4AF37] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />


            <button
              type="button"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowPassword(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700"
            >

              {showPassword ? (

                <EyeOff
                  className="h-4 w-4"
                />

              ) : (

                <Eye
                  className="h-4 w-4"
                />

              )}

            </button>

          </div>

        </div>


        {/* =================================================
            CONFIRM PASSWORD
        ================================================== */}

        <div>

          <label
            htmlFor="register-confirm-password"
            className="mb-2 block text-xs font-semibold text-neutral-700"
          >
            Confirm password
          </label>


          <div className="relative">

            <input
              id="register-confirm-password"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              value={
                confirmPassword
              }
              onChange={(
                event,
              ) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder="Repeat your password"
              required
              disabled={
                loading
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-[#D4AF37] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />


            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowConfirmPassword(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700"
            >

              {showConfirmPassword ? (

                <EyeOff
                  className="h-4 w-4"
                />

              ) : (

                <Eye
                  className="h-4 w-4"
                />

              )}

            </button>

          </div>

        </div>


        {/* =================================================
            CREATE ACCOUNT
        ================================================== */}

        <button
          type="submit"
          disabled={
            loading
          }
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading && (

            <Loader2
              className="h-4 w-4 animate-spin"
            />

          )}


          {loading
            ? "Creating account..."
            : "Create account"}

        </button>


        {/* =================================================
            LOGIN
        ================================================== */}

        <p className="text-center text-sm text-neutral-500">

          Already have an account?{" "}

          <Link
            to="/login"
            className="font-semibold text-[#D4AF37] hover:underline"
          >
            Sign in
          </Link>

        </p>

      </form>

    </div>
  );
}


export default RegisterForm;