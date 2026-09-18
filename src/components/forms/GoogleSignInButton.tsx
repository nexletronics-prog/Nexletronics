import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { loginWithGoogleAccount } from "../../services/auth.service";

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
}

function GoogleSignInButton({
  onError,
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    onError?.("");

    try {
      await loginWithGoogleAccount();

      navigate("/dashboard");
    } catch (err: unknown) {
      const firebaseError = err as {
        code?: string;
      };

      let message =
        "Unable to sign in with Google. Please try again.";

      switch (firebaseError.code) {
        case "auth/popup-closed-by-user":
          message =
            "Google sign-in was cancelled.";
          break;

        case "auth/popup-blocked":
          message =
            "Your browser blocked the Google sign-in popup. Please allow popups for this site.";
          break;

        case "auth/account-exists-with-different-credential":
          message =
            "An account already exists with this email using another sign-in method.";
          break;

        case "auth/unauthorized-domain":
          message =
            "This website domain is not authorized in Firebase Authentication.";
          break;

        case "auth/operation-not-allowed":
          message =
            "Google authentication is not enabled in Firebase.";
          break;
      }

      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.35 12.21c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.23Z"
          />
          <path
            fill="#34A853"
            d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
          />
          <path
            fill="#FBBC05"
            d="M6.54 13.58A5.85 5.85 0 0 1 6.23 12c0-.55.11-1.09.31-1.58V7.89H3.3A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.05 4.11l3.24-2.53Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.39c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.47 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.11 9.46 6.39 12 6.39Z"
          />
        </svg>
      )}

      {loading
        ? "Connecting to Google..."
        : "Continue with Google"}
    </button>
  );
}

export default GoogleSignInButton;