import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Info,
  Send,
  Wrench,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  createCustomProject,
} from "../../services/customProject.service";

import type {
  CustomProjectType,
} from "../../types/customProject";


/*
 * ==========================================================
 * PROJECT TYPES
 * ==========================================================
 */

const projectTypes:
  Array<{
    value:
      CustomProjectType;

    label:
      string;

    description:
      string;

    icon:
      typeof Globe;
  }> = [

  {
    value:
      "website",

    label:
      "Custom Website",

    description:
      "Business website, portfolio, e-commerce or web application.",

    icon:
      Globe,
  },

  {
    value:
      "custom-devices",

    label:
      "Custom devices",

    description:
      "Turn an idea into a physical product, electronic device or custom prototype.",

    icon:
      Wrench,
  },

];


/*
 * ==========================================================
 * INITIAL FORM
 * ==========================================================
 */

const initialForm = {

  projectType:
    "website" as CustomProjectType,

  title:
    "",

  description:
    "",

  requirements:
    "",

  budgetLabel:
    "",

  timeline:
    "",

  phone:
    "",

};


/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function CustomProjectRequest() {

  const navigate =
    useNavigate();


  const [
    searchParams,
  ] =
    useSearchParams();


  const {
    user,
    loading:
      authLoading,
  } =
    useAuth();


  /*
   * ========================================================
   * GET PROJECT TYPE FROM URL
   * ========================================================
   */

  const requestedType =
    searchParams.get(
      "type",
    );


  const initialProjectType:
    CustomProjectType =
    requestedType ===
      "custom-devices"
      ? "custom-devices"
      : "website";


  /*
   * ========================================================
   * FORM
   * ========================================================
   */

  const [
    form,
    setForm,
  ] =
    useState(
      () => ({
        ...initialForm,

        projectType:
          initialProjectType,
      }),
    );


  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false,
    );


  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * KEEP URL + FORM IN SYNC
   * ========================================================
   */

  function setProjectType(
    value:
      CustomProjectType,
  ) {

    setForm(
      (
        current,
      ) => ({

        ...current,

        projectType:
          value,

      }),
    );


    const nextParams =
      new URLSearchParams(
        searchParams,
      );


    nextParams.set(
      "type",
      value,
    );


    navigate(
      `/custom-solutions/request?${nextParams.toString()}`,
      {
        replace:
          true,
      },
    );


    setError(
      "",
    );
  }


  /*
   * ========================================================
   * SELECTED TYPE
   * ========================================================
   */

  const selectedType =
    useMemo(
      () =>
        projectTypes.find(
          (
            type,
          ) =>
            type.value ===
            form.projectType,
        ),

      [
        form.projectType,
      ],
    );


  /*
   * ========================================================
   * FIELD
   * ========================================================
   */

  function updateField(
    field:
      keyof typeof initialForm,

    value:
      string,
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


    setError(
      "",
    );
  }


  /*
   * ========================================================
   * SUBMIT
   * ========================================================
   */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    setError(
      "",
    );


    if (
      !user
    ) {

      navigate(
        "/login",
        {
          state: {
            from:
              `/custom-solutions/request?type=${form.projectType}`,
          },
        },
      );


      return;
    }


    const title =
      form.title.trim();


    const description =
      form.description.trim();


    const phone =
      form.phone.trim();


    if (
      !title
    ) {

      setError(
        "Please enter a project title.",
      );


      return;
    }


    if (
      !description
    ) {

      setError(
        "Please describe your project.",
      );


      return;
    }


    if (
      !phone
    ) {

      setError(
        "Please enter your phone number.",
      );


      return;
    }


    if (
      !user.email
    ) {

      setError(
        "Your account does not have an email address.",
      );


      return;
    }


    try {

      setSubmitting(
        true,
      );


      const projectId =
        await createCustomProject(
          {

            userId:
              user.uid,

            customerName:
              user.displayName?.trim() ||
              "Nexletronics Customer",

            customerEmail:
              user.email
                .trim()
                .toLowerCase(),

            customerPhone:
              phone,

            projectType:
              form.projectType,

            title,

            description,

            requirements:
              form.requirements.trim(),

            budgetLabel:
              form.budgetLabel.trim(),

            timeline:
              form.timeline.trim(),

            currency:
              "INR",

          },
        );


      navigate(
        `/custom-solutions/projects/${projectId}`,
      );

    } catch (
      submitError
    ) {

      console.error(
        "Custom project creation failed:",
        submitError,
      );


      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create your project.",
      );

    } finally {

      setSubmitting(
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

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto max-w-5xl px-6 py-20">

          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />

          <div className="mt-5 h-12 w-96 animate-pulse rounded bg-neutral-200" />

          <div className="mt-8 h-96 animate-pulse rounded-3xl bg-neutral-100" />

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * LOGIN REQUIRED
   * ========================================================
   */

  if (
    !user
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20">

          <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Info
                size={28}
              />

            </div>


            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Custom Solutions
            </p>


            <h1 className="mt-3 text-3xl font-black text-neutral-950 sm:text-4xl">
              Sign in to start your project
            </h1>


            <p className="mx-auto mt-4 max-w-xl leading-7 text-neutral-600">
              Sign in to connect your project, messages and
              quotations to your Nexletronics account.
            </p>


            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <button
                type="button"

                onClick={() =>
                  navigate(
                    "/login",
                    {
                      state: {
                        from:
                          `/custom-solutions/request?type=${form.projectType}`,
                      },
                    },
                  )
                }

                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white transition hover:bg-[#b99622]"
              >

                Login to Continue

                <ArrowRight
                  size={16}
                />

              </button>


              <Link
                to="/custom-solutions"

                className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-7 py-4 text-sm font-bold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#9b7e1d]"
              >

                Back

              </Link>

            </div>

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * MAIN FORM
   * ========================================================
   */

  return (

    <main className="min-h-screen bg-[#faf9f5]">

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-10 lg:py-16">

        <Link
          to="/custom-solutions"

          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 transition hover:text-[#D4AF37]"
        >

          <ArrowLeft
            size={16}
          />

          Back to Custom Solutions

        </Link>


        <div className="mt-8 max-w-3xl">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Start a Project
          </p>


          <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Tell us what you want to build.
          </h1>


          <p className="mt-4 text-base leading-7 text-neutral-600">
            Tell us about your website or custom device.
            We will discuss the requirements with you before
            preparing the final quotation.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }

          className="mt-10 space-y-7"
        >

          {/* =================================================
              TYPE
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black tracking-[0.18em] text-[#D4AF37]">
              01
            </p>


            <h2 className="mt-3 text-2xl font-black text-neutral-950">
              What are you building?
            </h2>


            <p className="mt-2 text-sm text-neutral-500">
              Choose the option closest to your project.
            </p>


            <div className="mt-7 grid gap-4 md:grid-cols-2">

              {
                projectTypes.map(
                  (
                    type,
                  ) => {

                    const Icon =
                      type.icon;


                    const selected =
                      form.projectType ===
                      type.value;


                    return (

                      <button
                        key={
                          type.value
                        }

                        type="button"

                        onClick={() =>
                          setProjectType(
                            type.value,
                          )
                        }

                        className={[
                          "rounded-3xl border p-6 text-left transition",
                          selected
                            ? "border-[#D4AF37] bg-[#D4AF37]/5 ring-4 ring-[#D4AF37]/10"
                            : "border-neutral-200 bg-white hover:border-[#D4AF37]/50 hover:bg-neutral-50",
                        ].join(" ")}
                      >

                        <div className="flex items-start gap-5">

                          <div
                            className={[
                              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                              selected
                                ? "bg-[#D4AF37] text-white"
                                : "bg-neutral-100 text-neutral-500",
                            ].join(" ")}
                          >

                            <Icon
                              size={25}
                            />

                          </div>


                          <div>

                            <h3 className="text-lg font-black text-neutral-950">

                              {
                                type.label
                              }

                            </h3>


                            <p className="mt-2 text-sm leading-6 text-neutral-500">

                              {
                                type.description
                              }

                            </p>

                          </div>

                        </div>

                      </button>
                    );
                  },
                )
              }

            </div>


            {selectedType && (

              <div className="mt-5 rounded-2xl bg-[#faf9f5] px-5 py-4 text-sm text-neutral-600">

                Selected:

                <span className="ml-1 font-black text-neutral-950">

                  {
                    selectedType.label
                  }

                </span>

              </div>

            )}

          </section>


          {/* =================================================
              PROJECT INFORMATION
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black tracking-[0.18em] text-[#D4AF37]">
              02
            </p>


            <h2 className="mt-3 text-2xl font-black text-neutral-950">
              Project information
            </h2>


            <div className="mt-7 space-y-5">

              <div>

                <label
                  htmlFor="custom-project-title"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Project Title
                </label>


                <input
                  id="custom-project-title"

                  type="text"

                  required

                  value={
                    form.title
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      updateField(
                        "title",
                        event.target.value,
                      )
                  }

                  placeholder={
                    form.projectType ===
                    "website"
                      ? "e.g. E-commerce website for an electronics business"
                      : "e.g. Smart custom IoT device"
                  }

                  className="w-full rounded-2xl border border-neutral-200 px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />

              </div>


              <div>

                <label
                  htmlFor="custom-project-description"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  What do you want to build?
                </label>


                <textarea
                  id="custom-project-description"

                  required

                  rows={6}

                  value={
                    form.description
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                  }

                  placeholder={
                    form.projectType ===
                    "website"
                      ? "Describe the website, pages, features, users and business goal..."
                      : "Describe the device, electronics, sensors, controls and what you want it to do..."
                  }

                  className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-4 text-sm leading-6 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />

              </div>


              <div>

                <label
                  htmlFor="custom-project-requirements"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Requirements
                </label>


                <textarea
                  id="custom-project-requirements"

                  rows={5}

                  value={
                    form.requirements
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      updateField(
                        "requirements",
                        event.target.value,
                      )
                  }

                  placeholder={
                    form.projectType ===
                    "website"
                      ? "Technology preferences, integrations, login system, payment gateway, admin panel, etc."
                      : "Components, connectivity, enclosure, battery, PCB, sensors, mobile app, dashboard, etc."
                  }

                  className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-4 text-sm leading-6 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />

              </div>

            </div>

          </section>


          {/* =================================================
              BUDGET
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black tracking-[0.18em] text-[#D4AF37]">
              03
            </p>


            <h2 className="mt-3 text-2xl font-black text-neutral-950">
              Budget and timeline
            </h2>


            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="custom-project-budget"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Budget
                </label>


                <input
                  id="custom-project-budget"

                  type="text"

                  value={
                    form.budgetLabel
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      updateField(
                        "budgetLabel",
                        event.target.value,
                      )
                  }

                  placeholder="e.g. ₹25,000 – ₹50,000"

                  className="w-full rounded-2xl border border-neutral-200 px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />

              </div>


              <div>

                <label
                  htmlFor="custom-project-timeline"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Expected Timeline
                </label>


                <input
                  id="custom-project-timeline"

                  type="text"

                  value={
                    form.timeline
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      updateField(
                        "timeline",
                        event.target.value,
                      )
                  }

                  placeholder="e.g. 4–6 weeks"

                  className="w-full rounded-2xl border border-neutral-200 px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />

              </div>

            </div>

          </section>


          {/* =================================================
              CONTACT
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black tracking-[0.18em] text-[#D4AF37]">
              04
            </p>


            <h2 className="mt-3 text-2xl font-black text-neutral-950">
              Contact details
            </h2>


            <div className="mt-7">

              <label
                htmlFor="custom-project-phone"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Phone Number
              </label>


              <input
                id="custom-project-phone"

                type="tel"

                required

                value={
                  form.phone
                }

                onChange={
                  (
                    event,
                  ) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                }

                placeholder="Your phone number"

                className="w-full rounded-2xl border border-neutral-200 px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
              />


              <p className="mt-2 text-xs text-neutral-400">
                We will use this number for project discussions.
              </p>

            </div>

          </section>


          {/* =================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
            >

              {
                error
              }

            </div>

          )}


          {/* =================================================
              SUBMIT
          ================================================== */}

          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="max-w-xl text-xs leading-5 text-neutral-400">
              Your project is private to you and the Nexletronics team.
            </p>


            <button
              type="submit"

              disabled={
                submitting
              }

              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-black text-white transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >

              <Send
                size={16}
              />


              {
                submitting
                  ? "Creating Project..."
                  : "Submit Project"
              }

            </button>

          </div>

        </form>

      </div>

    </main>
  );
}