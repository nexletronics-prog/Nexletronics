import { useState } from "react";
import type { FormEvent } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  saveContact,
} from "../../services/contact.service";

import type {
  ContactData,
} from "../../types/contact";

import {
  Button,
} from "../common/Button";


/*
 * ==========================================================
 * INITIAL FORM
 * ==========================================================
 */

const initialForm: ContactData = {
  name: "",
  email: "",
  phone: "",
  message: "",
};


/*
 * ==========================================================
 * EMAIL VALIDATION
 * ==========================================================
 */

function isValidEmail(
  value: string,
): boolean {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim(),
  );
}


/*
 * ==========================================================
 * REQUIRED VALIDATION
 * ==========================================================
 */

function isRequired(
  value: string,
): boolean {

  return value.trim().length > 0;
}


/*
 * ==========================================================
 * CONTACT FORM
 * ==========================================================
 */

export function ContactForm() {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  const {
    user,
    loading: authLoading,
  } =
    useAuth();


  const [
    form,
    setForm,
  ] =
    useState<ContactData>(
      initialForm,
    );


  const [
    status,
    setStatus,
  ] =
    useState("");


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  /*
   * ========================================================
   * FIELD UPDATE
   * ========================================================
   */

  function update(
    field: keyof ContactData,
    value: string,
  ) {

    setForm(
      (
        current,
      ) => ({
        ...current,

        [field]:
          value,
      }),
    );


    setStatus("");
  }


  /*
   * ========================================================
   * LOGIN
   * ========================================================
   */

  function goToLogin() {

    navigate(
      "/login",
      {
        state: {
          from:
            location.pathname,
        },
      },
    );
  }


  /*
   * ========================================================
   * REGISTER
   * ========================================================
   */

  function goToRegister() {

    navigate(
      "/register",
      {
        state: {
          from:
            location.pathname,
        },
      },
    );
  }


  /*
   * ========================================================
   * SUBMIT
   * ========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setStatus("");


    /*
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    if (!user) {

      setStatus(
        "Please log in to send an enquiry.",
      );

      return;
    }


    /*
     * --------------------------------------------------------
     * VALIDATION
     * --------------------------------------------------------
     */

    if (
      !isRequired(
        form.name,
      )
    ) {

      setStatus(
        "Please enter your name.",
      );

      return;
    }


    if (
      !isValidEmail(
        form.email,
      )
    ) {

      setStatus(
        "Please enter a valid email address.",
      );

      return;
    }


    if (
      !isRequired(
        form.message,
      )
    ) {

      setStatus(
        "Please enter your message.",
      );

      return;
    }


    /*
     * --------------------------------------------------------
     * SEND
     * --------------------------------------------------------
     */

    try {

      setSaving(
        true,
      );


      await saveContact(
        {
          name:
            form.name.trim(),

          email:
            form.email
              .trim()
              .toLowerCase(),

          phone:
            form.phone.trim(),

          message:
            form.message.trim(),
        },
      );


      setForm(
        initialForm,
      );


      setStatus(
        "Message sent successfully. We will get back to you soon.",
      );

    } catch (
      error
    ) {

      console.error(
        "Contact enquiry failed:",
        error,
      );


      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to send your message. Please try again.",
      );

    } finally {

      setSaving(
        false,
      );
    }
  }


  /*
   * ========================================================
   * AUTH LOADING
   * ========================================================
   */

  if (
    authLoading
  ) {

    return (
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8">

        <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />

        <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-neutral-200" />

      </div>
    );
  }


  /*
   * ========================================================
   * LOGIN REQUIRED
   * ========================================================
   *
   * The page remains public, but submitting an enquiry
   * requires authentication.
   */

  if (!user) {

    return (
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8">

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
          Login Required
        </p>


        <h2 className="mt-3 text-2xl font-black text-neutral-950">
          Sign in to contact our team
        </h2>


        <p className="mt-3 leading-7 text-neutral-600">
          Please sign in to your Nexletronics account before
          sending an enquiry. This keeps your requests connected
          to your account.
        </p>


        <div className="mt-6">

          <Button
            type="button"
            onClick={
              goToLogin
            }
          >
            Login to Continue
          </Button>

        </div>


        <p className="mt-5 text-sm text-neutral-500">

          Don't have an account?{" "}

          <button
            type="button"

            onClick={
              goToRegister
            }

            className="font-bold text-[#D4AF37] hover:underline"
          >
            Create one
          </button>

        </p>

      </div>
    );
  }


  /*
   * ========================================================
   * AUTHENTICATED FORM
   * ========================================================
   */

  return (
    <form
      onSubmit={
        handleSubmit
      }

      className="space-y-5"
    >

      {status && (

        <div
          role="status"

          className={[
            "rounded-2xl p-4 text-sm leading-6",

            status.toLowerCase().includes(
              "successfully",
            )
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {
            status
          }
        </div>

      )}


      {/* ==================================================
          NAME
      =================================================== */}

      <div>

        <label
          htmlFor="contact-name"

          className="mb-2 block text-sm font-bold text-neutral-900"
        >
          Name
        </label>


        <input
          id="contact-name"

          type="text"

          value={
            form.name
          }

          onChange={
            (
              event,
            ) =>
              update(
                "name",
                event.target.value,
              )
          }

          placeholder="Your name"

          autoComplete="name"

          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
        />

      </div>


      {/* ==================================================
          EMAIL
      =================================================== */}

      <div>

        <label
          htmlFor="contact-email"

          className="mb-2 block text-sm font-bold text-neutral-900"
        >
          Email Address
        </label>


        <input
          id="contact-email"

          type="email"

          value={
            form.email
          }

          onChange={
            (
              event,
            ) =>
              update(
                "email",
                event.target.value,
              )
          }

          placeholder="Email address"

          autoComplete="email"

          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
        />

      </div>


      {/* ==================================================
          PHONE
      =================================================== */}

      <div>

        <label
          htmlFor="contact-phone"

          className="mb-2 block text-sm font-bold text-neutral-900"
        >
          Phone Number
        </label>


        <input
          id="contact-phone"

          type="tel"

          value={
            form.phone
          }

          onChange={
            (
              event,
            ) =>
              update(
                "phone",
                event.target.value,
              )
          }

          placeholder="Phone number"

          autoComplete="tel"

          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
        />

      </div>


      {/* ==================================================
          MESSAGE
      =================================================== */}

      <div>

        <label
          htmlFor="contact-message"

          className="mb-2 block text-sm font-bold text-neutral-900"
        >
          Message
        </label>


        <textarea
          id="contact-message"

          rows={6}

          value={
            form.message
          }

          onChange={
            (
              event,
            ) =>
              update(
                "message",
                event.target.value,
              )
          }

          placeholder="Tell us about your requirement"

          className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-5 py-4 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
        />

      </div>


      {/* ==================================================
          SIGNED-IN ACCOUNT
      =================================================== */}

      <div className="rounded-2xl bg-neutral-50 p-4">

        <p className="text-xs text-neutral-500">
          Signed in as
        </p>


        <p className="mt-1 break-all text-sm font-bold text-neutral-800">
          {
            user.email
          }
        </p>

      </div>


      {/* ==================================================
          SUBMIT
      =================================================== */}

      <Button
        type="submit"

        disabled={
          saving
        }
      >
        {
          saving
            ? "Sending..."
            : "Send Message"
        }
      </Button>

    </form>
  );
}