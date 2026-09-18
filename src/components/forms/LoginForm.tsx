import {
  useState,
  type FormEvent,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  Button,
} from "../common/Button";


interface LocationState {
  from?: string;
}


function getLoginErrorMessage(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error
  ) {
    const code =
      String(
        (
          error as {
            code?: unknown;
          }
        ).code ?? "",
      );


    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "The email or password is incorrect.";

      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/user-disabled":
        return "This account has been disabled.";

      case "auth/too-many-requests":
        return "Too many login attempts. Please wait and try again.";

      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled in Firebase Authentication.";

      case "auth/popup-blocked":
        return "The Google sign-in popup was blocked by your browser.";

      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";

      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";

      case "auth/network-request-failed":
        return "Could not connect to Firebase Authentication.";

      case "auth/api-key-not-valid":
      case "auth/invalid-api-key":
        return "The Firebase API key is invalid.";

      case "auth/app-not-authorized":
        return "This website is not authorized in the Firebase project.";

      default:
        return `Firebase login failed (${code}).`;
    }
  }


  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }


  return "Unable to sign in. Please try again.";
}


export function LoginForm() {
  const {
    login,
    loginWithGoogle,
  } = useAuth();


  const navigate =
    useNavigate();


  const location =
    useLocation();


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);


  async function handleEmailLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");


    const cleanEmail =
      email.trim()
        .toLowerCase();


    if (!cleanEmail) {
      setError(
        "Please enter your email address.",
      );
      return;
    }


    if (!password) {
      setError(
        "Please enter your password.",
      );
      return;
    }


    try {
      setLoading(true);


      await login(
        cleanEmail,
        password,
      );


      navigateAfterLogin();
    } catch (err) {
      console.error(
        "Email login error:",
        err,
      );


      setError(
        getLoginErrorMessage(
          err,
        ),
      );
    } finally {
      setLoading(false);
    }
  }


  async function handleGoogleLogin() {
    setError("");


    try {
      setGoogleLoading(true);


      await loginWithGoogle();


      navigateAfterLogin();
    } catch (err) {
      console.error(
        "Google login error:",
        err,
      );


      setError(
        getLoginErrorMessage(
          err,
        ),
      );
    } finally {
      setGoogleLoading(false);
    }
  }


  function navigateAfterLogin() {
    const state =
      location.state as
        | LocationState
        | null;


    const destination =
      state?.from &&
      state.from !== "/login"
        ? state.from
        : "/dashboard";


    navigate(
      destination,
      {
        replace: true,
      },
    );
  }


  const busy =
    loading ||
    googleLoading;


  return (
    <div className="space-y-5">

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          {error}
        </div>
      )}


      {/* ==================================================
          GOOGLE
      =================================================== */}

      <Button
        type="button"
        onClick={() =>
          void handleGoogleLogin()
        }
        disabled={
          busy
        }
        className="w-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
      >

        {googleLoading ? (
          "Connecting to Google..."
        ) : (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="mr-2"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.91-4.18 2.91-7.39Z"
              />
              <path
                fill="#34A853"
                d="M12 21.99c2.63 0 4.84-.87 6.45-2.33l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.74 9.74 0 0 0 12 21.99Z"
              />
              <path
                fill="#FBBC05"
                d="M6.54 14.12a5.87 5.87 0 0 1 0-3.79V7.83H3.3a9.75 9.75 0 0 0 0 8.79l3.24-2.5Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.3c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.43 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.33l3.24 2.5C7.31 8.02 9.46 6.3 12 6.3Z"
              />
            </svg>

            Continue with Google
          </>
        )}

      </Button>


      {/* ==================================================
          DIVIDER
      =================================================== */}

      <div className="flex items-center gap-4">

        <div className="h-px flex-1 bg-neutral-200" />

        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          OR
        </span>

        <div className="h-px flex-1 bg-neutral-200" />

      </div>


      {/* ==================================================
          EMAIL LOGIN
      =================================================== */}

      <form
        onSubmit={
          handleEmailLogin
        }
        className="space-y-5"
      >

        <div>

          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-bold text-neutral-800"
          >
            Email
          </label>


          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
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
            disabled={
              busy
            }
            className="w-full rounded-2xl border border-neutral-200 px-5 py-4 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
          />

        </div>


        <div>

          <label
            htmlFor="login-password"
            className="mb-2 block text-sm font-bold text-neutral-800"
          >
            Password
          </label>


          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
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
            placeholder="Your password"
            disabled={
              busy
            }
            className="w-full rounded-2xl border border-neutral-200 px-5 py-4 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
          />

        </div>


        <Button
          className="w-full"
          type="submit"
          disabled={
            busy
          }
        >
          {loading
            ? "Signing in..."
            : "Sign In"}
        </Button>

      </form>

    </div>
  );
}


export default LoginForm;