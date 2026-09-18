import {
  Bell,
  CheckCircle2,
  Database,
  Globe,
  Lock,
  Save,
  Shield,
  Store,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  saveGlobalWebsiteSettings,
} from "../../../services/globalSettings.service";

import {
  useGlobalWebsiteSettings,
} from "../../../hooks/useGlobalWebsiteSettings";

import type {
  GlobalWebsiteSettings,
} from "../../../types/siteSettings";


/*
 * ==========================================================
 * ADMIN SETTINGS
 * ==========================================================
 *
 * SINGLE SOURCE OF TRUTH
 * ----------------------
 *
 * Firestore:
 *
 *     siteSettings/global
 *
 *
 * REALTIME
 * --------
 *
 * useGlobalWebsiteSettings()
 *
 *
 * SAVE
 * ----
 *
 * saveGlobalWebsiteSettings()
 * ==========================================================
 */

export default function AdminSettings() {

  /*
   * ========================================================
   * FIREBASE SETTINGS
   * ========================================================
   */

  const {
    settings:
      liveSettings,

    loading,

    error:
      realtimeError,

  } =
    useGlobalWebsiteSettings();


  /*
   * ========================================================
   * LOCAL EDITING STATE
   * ========================================================
   *
   * We keep a local copy so typing into fields does not
   * write every keystroke to Firestore.
   */

  const [
    settings,
    setSettings,
  ] =
    useState<GlobalWebsiteSettings>(
      liveSettings,
    );


  /*
   * ========================================================
   * DIRTY STATE
   * ========================================================
   */

  const [
    dirty,
    setDirty,
  ] =
    useState(false);


  /*
   * ========================================================
   * SAVING STATE
   * ========================================================
   */

  const [
    saving,
    setSaving,
  ] =
    useState(false);


  /*
   * ========================================================
   * SAVED MESSAGE
   * ========================================================
   */

  const [
    saved,
    setSaved,
  ] =
    useState(false);


  /*
   * ========================================================
   * SAVE ERROR
   * ========================================================
   */

  const [
    saveError,
    setSaveError,
  ] =
    useState("");


  /*
   * ========================================================
   * REALTIME FIRESTORE → LOCAL FORM
   * ========================================================
   *
   * Do not overwrite unsaved local changes.
   */

  useEffect(() => {

    if (
      !dirty
    ) {

      setSettings(
        liveSettings,
      );

    }

  }, [
    liveSettings,
    dirty,
  ]);


  /*
   * ========================================================
   * UPDATE FIELD
   * ========================================================
   */

  function updateField<
    K extends keyof GlobalWebsiteSettings,
  >(
    field: K,
    value:
      GlobalWebsiteSettings[K],
  ) {

    setSettings(
      (
        current,
      ) => ({

        ...current,

        [field]:
          value,

      }),
    );


    setDirty(
      true,
    );


    setSaved(
      false,
    );


    setSaveError(
      "",
    );
  }


  /*
   * ========================================================
   * SAVE SETTINGS
   * ========================================================
   */

  async function handleSave() {

    try {

      setSaving(
        true,
      );


      setSaved(
        false,
      );


      setSaveError(
        "",
      );


      /*
       * Firestore is the source of truth.
       */

      await saveGlobalWebsiteSettings(
        settings,
      );


      /*
       * The realtime listener will receive the saved
       * document automatically.
       */

      setDirty(
        false,
      );


      setSaved(
        true,
      );

    } catch (
      saveErr
    ) {

      console.error(
        "Failed to save global settings:",
        saveErr,
      );


      setSaveError(
        saveErr instanceof Error
          ? saveErr.message
          : "Unable to save settings.",
      );

    } finally {

      setSaving(
        false,
      );

    }
  }


  /*
   * ========================================================
   * DISCARD UNSAVED CHANGES
   * ========================================================
   */

  function handleDiscard() {

    setSettings(
      liveSettings,
    );


    setDirty(
      false,
    );


    setSaved(
      false,
    );


    setSaveError(
      "",
    );
  }


  /*
   * ========================================================
   * REALTIME STATUS
   * ========================================================
   */

  const realtimeConnected =
    !realtimeError;


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (
      <div className="space-y-8">

        <div>

          <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-10 w-64 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-neutral-100" />

        </div>


        <div className="h-64 animate-pulse rounded-3xl bg-neutral-100" />


        <div className="h-64 animate-pulse rounded-3xl bg-neutral-100" />


        <div className="h-48 animate-pulse rounded-3xl bg-neutral-100" />

      </div>
    );
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="space-y-8">


      {/* ====================================================
          HEADER
      ===================================================== */}

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Administration
        </p>


        <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
          Settings
        </h1>


        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          These settings are stored in Firebase and
          synchronized in real time across connected
          Nexletronics pages.
        </p>

      </div>


      {/* ====================================================
          REALTIME STATUS
      ===================================================== */}

      <div
        className={[
          "rounded-2xl border px-5 py-4",

          realtimeConnected
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50",

        ].join(" ")}
      >

        <div className="flex items-center gap-3">

          <span
            className={[
              "h-2.5 w-2.5 rounded-full",

              realtimeConnected
                ? "bg-green-500"
                : "bg-red-500",

            ].join(" ")}
          />


          <div>

            <p
              className={[
                "text-sm font-black",

                realtimeConnected
                  ? "text-green-700"
                  : "text-red-700",

              ].join(" ")}
            >

              {
                realtimeConnected
                  ? "Live Firebase synchronization active"
                  : "Realtime connection error"
              }

            </p>


            {realtimeError ? (

              <p className="mt-1 text-xs text-red-600">

                {
                  realtimeError.message
                }

              </p>

            ) : (

              <p className="mt-1 text-xs text-green-600">
                Changes are synchronized automatically.
              </p>

            )}

          </div>

        </div>

      </div>


      {/* ====================================================
          SAVE ERROR
      ===================================================== */}

      {saveError && (

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
        >

          <p className="text-sm font-black text-red-700">
            Unable to save settings
          </p>


          <p className="mt-1 text-xs text-red-600">

            {
              saveError
            }

          </p>

        </div>

      )}


      {/* ====================================================
          SAVED
      ===================================================== */}

      {saved && (

        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4"
        >

          <CheckCircle2
            size={
              19
            }
            className="text-green-600"
          />


          <p className="text-sm font-bold text-green-700">
            Settings saved successfully and synchronized.
          </p>

        </div>

      )}


      {/* ====================================================
          GENERAL
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Globe
              size={
                21
              }
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              General
            </h2>


            <p className="mt-1 text-sm text-neutral-500">
              Website branding and business information.
            </p>

          </div>

        </div>


        <div className="mt-7 grid gap-5 sm:grid-cols-2">


          {/* ==================================================
              SITE NAME
          =================================================== */}

          <div>

            <label
              htmlFor="site-name"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Site Name
            </label>


            <input
              id="site-name"
              type="text"
              value={
                settings.companyName
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "companyName",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* ==================================================
              CURRENCY
          =================================================== */}

          <div>

            <label
              htmlFor="currency"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Currency
            </label>


            <select
              id="currency"
              value={
                settings.currency
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "currency",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            >

              <option value="INR">
                INR — Indian Rupee
              </option>


              <option value="USD">
                USD — US Dollar
              </option>


              <option value="EUR">
                EUR — Euro
              </option>


              <option value="GBP">
                GBP — British Pound
              </option>

            </select>

          </div>


          {/* ==================================================
              CONTACT EMAIL
          =================================================== */}

          <div>

            <label
              htmlFor="contact-email"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Contact Email
            </label>


            <input
              id="contact-email"
              type="email"
              value={
                settings.companyEmail
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "companyEmail",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* ==================================================
              PHONE
          =================================================== */}

          <div>

            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Phone
            </label>


            <input
              id="phone"
              type="tel"
              value={
                settings.companyPhone
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "companyPhone",
                  event.target.value,
                )
              }
              placeholder="+91..."
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>

        </div>

      </section>


      {/* ====================================================
          AUTHENTICATION
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Lock
              size={
                21
              }
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              Authentication
            </h2>


            <p className="mt-1 text-sm text-neutral-500">
              Control available customer authentication methods.
            </p>

          </div>

        </div>


        <div className="mt-7 space-y-4">


          {/* ==================================================
              EMAIL LOGIN
          =================================================== */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-5 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="font-bold text-neutral-900">
                Email & Password
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Allow customers to sign in with their email and password.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.emailLogin
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "emailLogin",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>


          {/* ==================================================
              GOOGLE LOGIN
          =================================================== */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-5 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="font-bold text-neutral-900">
                Continue with Google
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Allow customers to use Google authentication.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.googleLogin
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "googleLogin",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>

        </div>

      </section>


      {/* ====================================================
          STORE
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Store
              size={
                21
              }
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              Store
            </h2>


            <p className="mt-1 text-sm text-neutral-500">
              Control shopping and checkout behavior.
            </p>

          </div>

        </div>


        <div className="mt-7">

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-5 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="font-bold text-neutral-900">
                Enable Checkout
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Allow customers to continue from cart to checkout.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.checkoutEnabled
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "checkoutEnabled",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>

        </div>

      </section>


      {/* ====================================================
          SYSTEM
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Shield
              size={
                21
              }
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              System
            </h2>


            <p className="mt-1 text-sm text-neutral-500">
              Operational controls for the platform.
            </p>

          </div>

        </div>


        <div className="mt-7 space-y-4">


          {/* ==================================================
              MAINTENANCE MODE
          =================================================== */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-5 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="font-bold text-neutral-900">
                Maintenance Mode
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Disable public store access while keeping the
                admin portal available.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.maintenanceMode
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "maintenanceMode",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>


          {/* ==================================================
              FIREBASE
          =================================================== */}

          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">

            <Database
              size={
                21
              }
              className="shrink-0 text-[#D4AF37]"
            />


            <div>

              <p className="font-bold text-neutral-900">
                Firebase Database
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Settings are synchronized through Firestore.
              </p>

            </div>

          </div>


          {/* ==================================================
              LIVE SYNCHRONIZATION
          =================================================== */}

          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">

            <Bell
              size={
                21
              }
              className={
                realtimeConnected
                  ? "shrink-0 text-green-600"
                  : "shrink-0 text-red-500"
              }
            />


            <div>

              <p className="font-bold text-neutral-900">
                Live Synchronization
              </p>


              <p className="mt-1 text-xs text-neutral-500">

                {
                  realtimeConnected
                    ? "Changes are pushed to connected listeners automatically."
                    : "Realtime synchronization is currently unavailable."
                }

              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ====================================================
          SAVE BAR
      ===================================================== */}

      <div className="sticky bottom-5 z-20 rounded-3xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">


          <div>

            <p className="text-sm font-bold text-neutral-900">

              {
                dirty
                  ? "Unsaved changes"
                  : "Settings are synchronized"
              }

            </p>


            <p className="mt-1 text-xs text-neutral-500">

              {
                dirty
                  ? "Save your changes to publish them to connected pages."
                  : "Firestore is the current source of truth."
              }

            </p>

          </div>


          <div className="flex gap-3">


            {dirty && (

              <button
                type="button"
                onClick={
                  handleDiscard
                }
                disabled={
                  saving
                }
                className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-700 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
              >
                Discard
              </button>

            )}


            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                saving ||
                !dirty ||
                !realtimeConnected
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Save
                size={
                  17
                }
              />


              {
                saving
                  ? "Saving..."
                  : "Save Settings"
              }

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}