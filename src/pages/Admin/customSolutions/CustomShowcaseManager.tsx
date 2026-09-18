import {
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
} from "react-router-dom";

import type {
  CustomPortfolioCategory,
  CustomPortfolioItem,
  CreateCustomPortfolioData,
} from "../../../types/customProject";

import {
  createCustomPortfolioItem,
  deleteCustomPortfolioItem,
  saveCustomShowcaseSettings,
  setCustomPortfolioFeatured,
  setCustomPortfolioPublished,
  subscribeCustomPortfolio,
  subscribeCustomShowcaseSettings,
  updateCustomPortfolioItem,
} from "../../../services/customShowcase.service";

import type {
  CustomShowcaseSettings,
} from "../../../services/customShowcase.service";


/*
 * ==========================================================
 * FORM
 * ==========================================================
 */

interface PortfolioFormState {

  title:
    string;

  slug:
    string;

  category:
    CustomPortfolioCategory;

  shortDescription:
    string;

  description:
    string;

  coverImage:
    string;

  galleryText:
    string;

  technologies:
    string;

  clientIndustry:
    string;

  liveUrl:
    string;

  featured:
    boolean;

  published:
    boolean;

  sortOrder:
    string;
}


/*
 * ==========================================================
 * DEFAULT
 * ==========================================================
 */

const defaultForm:
  PortfolioFormState = {

  title:
    "",

  slug:
    "",

  category:
    "website",

  shortDescription:
    "",

  description:
    "",

  coverImage:
    "",

  galleryText:
    "",

  technologies:
    "",

  clientIndustry:
    "",

  liveUrl:
    "",

  featured:
    false,

  published:
    true,

  sortOrder:
    "0",

};


/*
 * ==========================================================
 * SLUG
 * ==========================================================
 */

function createSlug(
  value:
    string,
): string {

  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "");
}


/*
 * ==========================================================
 * FORM FROM ITEM
 * ==========================================================
 */

function formFromItem(
  item:
    CustomPortfolioItem,
): PortfolioFormState {

  return {

    title:
      item.title,

    slug:
      item.slug,

    category:
      item.category,

    shortDescription:
      item.shortDescription,

    description:
      item.description,

    coverImage:
      item.coverImage,

    galleryText:
      item.gallery.join(
        "\n",
      ),

    technologies:
      item.technologies.join(
        ", ",
      ),

    clientIndustry:
      item.clientIndustry ??
      "",

    liveUrl:
      item.liveUrl ??
      "",

    featured:
      item.featured,

    published:
      item.published,

    sortOrder:
      String(
        item.sortOrder,
      ),

  };
}


/*
 * ==========================================================
 * ERROR
 * ==========================================================
 */

function getErrorMessage(
  error:
    unknown,

  fallback:
    string,
): string {

  if (
    error instanceof Error
  ) {

    return error.message;
  }


  return fallback;
}


/*
 * ==========================================================
 * SWITCH
 * ==========================================================
 */

function Switch({
  checked,
  onChange,
  disabled =
    false,
}: {
  checked:
    boolean;

  onChange:
    (
      value:
        boolean,
    ) => void;

  disabled?:
    boolean;
}) {

  return (

    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }

      disabled={
        disabled
      }

      onClick={() =>
        onChange(
          !checked,
        )
      }

      className={[
        "relative h-7 w-12 rounded-full transition",
        checked
          ? "bg-[#D4AF37]"
          : "bg-neutral-300",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "",
      ].join(" ")}
    >

      <span
        className={[
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
          checked
            ? "left-6"
            : "left-1",
        ].join(" ")}
      />

    </button>
  );
}


/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function CustomShowcaseManager() {

  const [
    items,
    setItems,
  ] =
    useState<
      CustomPortfolioItem[]
    >([]);


  const [
    settings,
    setSettings,
  ] =
    useState<
      CustomShowcaseSettings
    >(
      {
        websitesEnabled:
          true,

        devicesEnabled:
          true,
      },
    );


  const [
    category,
    setCategory,
  ] =
    useState<
      CustomPortfolioCategory
    >(
      "website",
    );


  const [
    formOpen,
    setFormOpen,
  ] =
    useState(
      false,
    );


  const [
    selectedItem,
    setSelectedItem,
  ] =
    useState<
      CustomPortfolioItem |
      null
    >(null);


  const [
    form,
    setForm,
  ] =
    useState<
      PortfolioFormState
    >(
      defaultForm,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );


  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      string |
      null
    >(null);


  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  const [
    success,
    setSuccess,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * PORTFOLIO REALTIME
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeCustomPortfolio(

          (
            nextItems,
          ) => {

            setItems(
              nextItems,
            );

            setLoading(
              false,
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Showcase listener failed:",
              listenerError,
            );


            setError(
              getErrorMessage(
                listenerError,
                "Unable to load showcase.",
              ),
            );


            setLoading(
              false,
            );

          },
        );


      return () =>
        unsubscribe();

    },
    [],
  );


  /*
   * ========================================================
   * SETTINGS REALTIME
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeCustomShowcaseSettings(

          (
            nextSettings,
          ) => {

            setSettings(
              nextSettings,
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Showcase settings listener failed:",
              listenerError,
            );


            setError(
              getErrorMessage(
                listenerError,
                "Unable to load showcase settings.",
              ),
            );

          },
        );


      return () =>
        unsubscribe();

    },
    [],
  );


  /*
   * ========================================================
   * CURRENT ITEMS
   * ========================================================
   */

  const currentItems =
    useMemo(
      () =>
        items.filter(
          (
            item,
          ) =>
            item.category ===
            category,
        ),

      [
        items,
        category,
      ],
    );


  /*
   * ========================================================
   * OPEN NEW
   * ========================================================
   */

  function openNew() {

    setSelectedItem(
      null,
    );


    setForm(
      {
        ...defaultForm,

        category,
      },
    );


    setFormOpen(
      true,
    );


    setError(
      "",
    );


    setSuccess(
      "",
    );
  }


  /*
   * ========================================================
   * OPEN EDIT
   * ========================================================
   */

  function openEdit(
    item:
      CustomPortfolioItem,
  ) {

    setSelectedItem(
      item,
    );


    setForm(
      formFromItem(
        item,
      ),
    );


    setFormOpen(
      true,
    );


    setError(
      "",
    );


    setSuccess(
      "",
    );
  }


  /*
   * ========================================================
   * CLOSE
   * ========================================================
   */

  function closeForm() {

    if (
      saving
    ) {

      return;
    }


    setFormOpen(
      false,
    );


    setSelectedItem(
      null,
    );


    setForm(
      defaultForm,
    );
  }


  /*
   * ========================================================
   * SAVE
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


    setSuccess(
      "",
    );


    const title =
      form.title.trim();


    const slug =
      form.slug.trim() ||
      createSlug(
        title,
      );


    const shortDescription =
      form.shortDescription.trim();


    const description =
      form.description.trim();


    const coverImage =
      form.coverImage.trim();


    const gallery =
      form.galleryText
        .split(
          /\r?\n/,
        )
        .map(
          (
            value,
          ) =>
            value.trim(),
        )
        .filter(
          Boolean,
        );


    const technologies =
      form.technologies
        .split(",")
        .map(
          (
            value,
          ) =>
            value.trim(),
        )
        .filter(
          Boolean,
        );


    const sortOrder =
      Number(
        form.sortOrder,
      );


    if (
      !title
    ) {

      setError(
        "Title is required.",
      );


      return;
    }


    if (
      !shortDescription
    ) {

      setError(
        "Short description is required.",
      );


      return;
    }


    if (
      !description
    ) {

      setError(
        "Description is required.",
      );


      return;
    }


    if (
      !coverImage
    ) {

      setError(
        "Cover image URL is required.",
      );


      return;
    }


    if (
      !Number.isFinite(
        sortOrder,
      )
    ) {

      setError(
        "Sort order must be a valid number.",
      );


      return;
    }


    try {

      setSaving(
        true,
      );


      const payload:
        CreateCustomPortfolioData = {

        title,

        slug,

        category:
          form.category,

        shortDescription,

        description,

        coverImage,

        gallery,

        technologies,

        clientIndustry:
          form.clientIndustry.trim(),

        liveUrl:
          form.liveUrl.trim(),

        featured:
          form.featured,

        published:
          form.published,

        sortOrder,

      };


      if (
        selectedItem
      ) {

        await updateCustomPortfolioItem(
          selectedItem.id,
          payload,
        );


        setSuccess(
          "Showcase item updated successfully.",
        );

      } else {

        await createCustomPortfolioItem(
          payload,
        );


        setSuccess(
          "Showcase item created successfully.",
        );

      }


      closeForm();

    } catch (
      saveError
    ) {

      console.error(
        "Showcase save failed:",
        saveError,
      );


      setError(
        getErrorMessage(
          saveError,
          "Unable to save showcase item.",
        ),
      );

    } finally {

      setSaving(
        false,
      );
    }
  }


  /*
   * ========================================================
   * DELETE
   * ========================================================
   */

  async function handleDelete(
    item:
      CustomPortfolioItem,
  ) {

    if (
      !window.confirm(
        `Delete "${item.title}"?\n\nThis cannot be undone.`,
      )
    ) {

      return;
    }


    try {

      setDeletingId(
        item.id,
      );


      await deleteCustomPortfolioItem(
        item.id,
      );


      setSuccess(
        "Showcase item deleted.",
      );

    } catch (
      deleteError
    ) {

      setError(
        getErrorMessage(
          deleteError,
          "Unable to delete showcase item.",
        ),
      );

    } finally {

      setDeletingId(
        null,
      );
    }
  }


  /*
   * ========================================================
   * PUBLISHED
   * ========================================================
   */

  async function handlePublished(
    item:
      CustomPortfolioItem,

    value:
      boolean,
  ) {

    try {

      await setCustomPortfolioPublished(
        item.id,
        value,
      );

    } catch (
      updateError
    ) {

      setError(
        getErrorMessage(
          updateError,
          "Unable to update published state.",
        ),
      );
    }
  }


  /*
   * ========================================================
   * FEATURED
   * ========================================================
   */

  async function handleFeatured(
    item:
      CustomPortfolioItem,

    value:
      boolean,
  ) {

    try {

      await setCustomPortfolioFeatured(
        item.id,
        value,
      );

    } catch (
      updateError
    ) {

      setError(
        getErrorMessage(
          updateError,
          "Unable to update featured state.",
        ),
      );
    }
  }


  /*
   * ========================================================
   * WEBSITE SWITCH
   * ========================================================
   */

  async function toggleWebsites(
    value:
      boolean,
  ) {

    const previous =
      settings;


    setSettings(
      {
        ...settings,

        websitesEnabled:
          value,
      },
    );


    try {

      await saveCustomShowcaseSettings(
        {
          ...settings,

          websitesEnabled:
            value,
        },
      );

    } catch (
      updateError
    ) {

      setSettings(
        previous,
      );


      setError(
        getErrorMessage(
          updateError,
          "Unable to update website showcase visibility.",
        ),
      );
    }
  }


  /*
   * ========================================================
   * DEVICES SWITCH
   * ========================================================
   */

  async function toggleDevices(
    value:
      boolean,
  ) {

    const previous =
      settings;


    setSettings(
      {
        ...settings,

        devicesEnabled:
          value,
      },
    );


    try {

      await saveCustomShowcaseSettings(
        {
          ...settings,

          devicesEnabled:
            value,
        },
      );

    } catch (
      updateError
    ) {

      setSettings(
        previous,
      );


      setError(
        getErrorMessage(
          updateError,
          "Unable to update device showcase visibility.",
        ),
      );
    }
  }


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (

    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Custom Solutions
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Showcase Manager
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Manage your Custom Website and Custom devices portfolio.
          </p>

        </div>


        <Link
          to="/custom-solutions"
          target="_blank"
          rel="noreferrer"

          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-black text-neutral-700"
        >

          <Eye
            size={16}
          />

          View Public Page

        </Link>

      </div>


      {/* ALERT */}

      {error && (

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

          <span>
            {
              error
            }
          </span>


          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >

            <X
              size={17}
            />

          </button>

        </div>

      )}


      {success && (

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">

          <span>
            {
              success
            }
          </span>


          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >

            <X
              size={17}
            />

          </button>

        </div>

      )}


      {/* VISIBILITY */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
          Public Visibility
        </p>


        <h2 className="mt-2 text-xl font-black text-neutral-950">
          Showcase controls
        </h2>


        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <VisibilityCard
            title="Custom Website Works"
            description="Show or hide the entire website portfolio."
            checked={
              settings.websitesEnabled
            }
            onChange={
              (
                value,
              ) =>
                void toggleWebsites(
                  value,
                )
            }
          />


          <VisibilityCard
            title="Custom devices Works"
            description="Show or hide the entire devices portfolio."
            checked={
              settings.devicesEnabled
            }
            onChange={
              (
                value,
              ) =>
                void toggleDevices(
                  value,
                )
            }
          />

        </div>

      </section>


      {/* CATEGORY */}

      <section className="flex flex-col gap-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-sm font-black text-neutral-950">
            Portfolio category
          </p>


          <p className="mt-1 text-xs text-neutral-500">
            Manage each type separately.
          </p>

        </div>


        <div className="flex rounded-2xl bg-neutral-100 p-1">

          <button
            type="button"

            onClick={() =>
              setCategory(
                "website",
              )
            }

            className={[
              "rounded-xl px-5 py-2.5 text-sm font-black",
              category ===
                "website"
                ? "bg-white text-[#9b7e1d] shadow-sm"
                : "text-neutral-500",
            ].join(" ")}
          >

            Custom Website

          </button>


          <button
            type="button"

            onClick={() =>
              setCategory(
                "devices",
              )
            }

            className={[
              "rounded-xl px-5 py-2.5 text-sm font-black",
              category ===
                "devices"
                ? "bg-white text-[#9b7e1d] shadow-sm"
                : "text-neutral-500",
            ].join(" ")}
          >

            Custom devices

          </button>

        </div>

      </section>


      {/* CATEGORY HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">

            {
              category ===
                "website"
                ? "Custom Website"
                : "Custom devices"
            }

          </p>


          <h2 className="mt-2 text-2xl font-black text-neutral-950">

            {
              category ===
                "website"
                ? "Website Works"
                : "Devices Works"
            }

          </h2>


          <p className="mt-1 text-sm text-neutral-500">

            {
              currentItems.length
            }

            {" "}

            {
              currentItems.length ===
                1
                ? "work"
                : "works"
            }

          </p>

        </div>


        <button
          type="button"
          onClick={
            openNew
          }

          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white"
        >

          <Plus
            size={16}
          />

          Add Work

        </button>

      </div>


      {/* ITEMS */}

      {loading ? (

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {
            [1, 2, 3].map(
              (
                number,
              ) => (

                <div
                  key={
                    number
                  }

                  className="h-96 animate-pulse rounded-3xl bg-neutral-100"
                />

              ),
            )
          }

        </div>

      ) : currentItems.length ===
        0 ? (

        <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">

          <ImagePlus
            size={34}
            className="mx-auto text-[#D4AF37]"
          />


          <h3 className="mt-4 text-xl font-black text-neutral-950">
            No work yet
          </h3>


          <button
            type="button"

            onClick={
              openNew
            }

            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-white"
          >

            <Plus
              size={15}
            />

            Add Work

          </button>

        </div>

      ) : (

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {
            currentItems.map(
              (
                item,
              ) => (

                <article
                  key={
                    item.id
                  }

                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
                >

                  <div className="aspect-[16/10] bg-neutral-100">

                    {item.coverImage ? (

                      <img
                        src={
                          item.coverImage
                        }

                        alt={
                          item.title
                        }

                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center text-neutral-300">

                        <ImagePlus
                          size={35}
                        />

                      </div>

                    )}

                  </div>


                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <h3 className="font-black text-neutral-950">

                          {
                            item.title
                          }

                        </h3>


                        <p className="mt-1 text-xs text-neutral-500">

                          {
                            item.shortDescription
                          }

                        </p>

                      </div>


                      {item.featured && (

                        <span className="shrink-0 rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-black text-[#9b7e1d]">
                          Featured
                        </span>

                      )}

                    </div>


                    <div className="mt-4 grid grid-cols-2 gap-2">

                      <button
                        type="button"

                        onClick={() =>
                          void handlePublished(
                            item,
                            !item.published,
                          )
                        }

                        className={[
                          "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black",
                          item.published
                            ? "bg-green-50 text-green-700"
                            : "bg-neutral-100 text-neutral-500",
                        ].join(" ")}
                      >

                        {item.published ? (
                          <Eye
                            size={14}
                          />
                        ) : (
                          <EyeOff
                            size={14}
                          />
                        )}


                        {
                          item.published
                            ? "Published"
                            : "Hidden"
                        }

                      </button>


                      <button
                        type="button"

                        onClick={() =>
                          void handleFeatured(
                            item,
                            !item.featured,
                          )
                        }

                        className="rounded-xl bg-neutral-100 px-3 py-2.5 text-xs font-black text-neutral-600"
                      >

                        {
                          item.featured
                            ? "Unfeature"
                            : "Feature"
                        }

                      </button>

                    </div>


                    <div className="mt-2 grid grid-cols-2 gap-2">

                      <button
                        type="button"

                        onClick={() =>
                          openEdit(
                            item,
                          )
                        }

                        className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-700"
                      >

                        <Edit3
                          size={14}
                        />

                        Edit

                      </button>


                      <button
                        type="button"

                        disabled={
                          deletingId ===
                          item.id
                        }

                        onClick={() =>
                          void handleDelete(
                            item,
                          )
                        }

                        className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-xs font-black text-red-600 disabled:opacity-50"
                      >

                        <Trash2
                          size={14}
                        />

                        {
                          deletingId ===
                            item.id
                            ? "Deleting..."
                            : "Delete"
                        }

                      </button>

                    </div>

                  </div>

                </article>

              ),
            )
          }

        </div>

      )}


      {/* FORM */}

      {formOpen && (

        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4 sm:p-8">

          <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">

                  {
                    selectedItem
                      ? "Edit Work"
                      : "Add Work"
                  }

                </p>


                <h2 className="mt-1 text-xl font-black text-neutral-950">

                  {
                    selectedItem
                      ? selectedItem.title
                      : category ===
                          "website"
                        ? "New Custom Website"
                        : "New Custom devices Work"
                  }

                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeForm
                }

                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100"
              >

                <X
                  size={20}
                />

              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }

              className="p-6 sm:p-8"
            >

              <div className="grid gap-6 lg:grid-cols-2">

                {/* LEFT */}

                <div className="space-y-5">

                  <Field
                    label="Title"
                    value={
                      form.title
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            title:
                              value,
                            slug:
                              selectedItem
                                ? current.slug
                                : createSlug(
                                    value,
                                  ),
                          }),
                        )
                    }
                    placeholder="Project title"
                  />


                  <Field
                    label="Slug"
                    value={
                      form.slug
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            slug:
                              value,
                          }),
                        )
                    }
                    placeholder="project-slug"
                  />


                  <TextAreaField
                    label="Short Description"
                    value={
                      form.shortDescription
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            shortDescription:
                              value,
                          }),
                        )
                    }
                    placeholder="Short description shown on the card."
                    rows={
                      3
                    }
                  />


                  <TextAreaField
                    label="Full Description"
                    value={
                      form.description
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            description:
                              value,
                          }),
                        )
                    }
                    placeholder="Detailed project description."
                    rows={
                      7
                    }
                  />


                  <Field
                    label="Technologies / Components"
                    value={
                      form.technologies
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            technologies:
                              value,
                          }),
                        )
                    }
                    placeholder={
                      category ===
                      "website"
                        ? "React, Firebase, Tailwind"
                        : "ESP32, PCB, Sensors, IoT"
                    }
                  />


                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Industry"
                      value={
                        form.clientIndustry
                      }
                      onChange={
                        (
                          value,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              clientIndustry:
                                value,
                            }),
                          )
                      }
                      placeholder="Industry"
                    />


                    <Field
                      label="Sort Order"
                      value={
                        form.sortOrder
                      }
                      onChange={
                        (
                          value,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              sortOrder:
                                value,
                            }),
                          )
                      }
                      placeholder="0"
                      type="number"
                    />

                  </div>


                  {category ===
                    "website" && (

                    <Field
                      label="Live Website URL"
                      value={
                        form.liveUrl
                      }
                      onChange={
                        (
                          value,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              liveUrl:
                                value,
                            }),
                          )
                      }
                      placeholder="https://example.com"
                    />

                  )}

                </div>


                {/* RIGHT */}

                <div className="space-y-5">

                  <Field
                    label="Cover Image URL"
                    value={
                      form.coverImage
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            coverImage:
                              value,
                          }),
                        )
                    }
                    placeholder="https://your-image-host.com/image.jpg"
                  />


                  {form.coverImage && (

                    <div className="overflow-hidden rounded-2xl border border-neutral-200">

                      <img
                        src={
                          form.coverImage
                        }

                        alt="Cover preview"

                        className="aspect-[16/10] w-full object-cover"
                      />

                    </div>

                  )}


                  <TextAreaField
                    label="Gallery Image URLs"
                    value={
                      form.galleryText
                    }
                    onChange={
                      (
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            galleryText:
                              value,
                          }),
                        )
                    }
                    placeholder={
                      "https://image-host.com/photo-1.jpg\nhttps://image-host.com/photo-2.jpg\nhttps://image-host.com/photo-3.jpg"
                    }
                    rows={
                      8
                    }
                  />


                  <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">

                    <p className="text-sm font-black text-neutral-900">
                      Image hosting
                    </p>


                    <p className="mt-2 text-xs leading-5 text-neutral-600">
                      Firebase Storage is not used. Paste public
                      image URLs from your existing image host.
                      The URLs are saved directly in Firestore.
                    </p>

                  </div>


                  <div className="rounded-2xl bg-neutral-50 p-5">

                    <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
                      Visibility
                    </p>


                    <div className="mt-4 space-y-4">

                      <ToggleRow
                        title="Published"
                        description="Show this work publicly."
                        checked={
                          form.published
                        }
                        onChange={
                          (
                            value,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                published:
                                  value,
                              }),
                            )
                        }
                      />


                      <ToggleRow
                        title="Featured"
                        description="Move this work before non-featured items."
                        checked={
                          form.featured
                        }
                        onChange={
                          (
                            value,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                featured:
                                  value,
                              }),
                            )
                        }
                      />

                    </div>

                  </div>

                </div>

              </div>


              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }

                  disabled={
                    saving
                  }

                  className="rounded-full border border-neutral-200 px-6 py-3.5 text-sm font-bold text-neutral-700"
                >

                  Cancel

                </button>


                <button
                  type="submit"

                  disabled={
                    saving
                  }

                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white disabled:bg-neutral-300"
                >

                  <Save
                    size={16}
                  />

                  {
                    saving
                      ? "Saving..."
                      : selectedItem
                        ? "Update Work"
                        : "Create Work"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


/*
 * ==========================================================
 * VISIBILITY CARD
 * ==========================================================
 */

function VisibilityCard({
  title,
  description,
  checked,
  onChange,
}: {
  title:
    string;

  description:
    string;

  checked:
    boolean;

  onChange:
    (
      value:
        boolean,
    ) => void;
}) {

  return (

    <div className="flex items-center justify-between gap-5 rounded-2xl border border-neutral-200 p-5">

      <div>

        <p className="font-black text-neutral-950">
          {
            title
          }
        </p>


        <p className="mt-1 text-xs leading-5 text-neutral-500">
          {
            description
          }
        </p>

      </div>


      <Switch
        checked={
          checked
        }

        onChange={
          onChange
        }
      />

    </div>
  );
}


/*
 * ==========================================================
 * FIELD
 * ==========================================================
 */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type =
    "text",
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string,
    ) => void;

  placeholder?:
    string;

  type?:
    string;
}) {

  return (

    <div>

      <label className="mb-2 block text-sm font-bold text-neutral-800">

        {
          label
        }

      </label>


      <input
        type={
          type
        }

        value={
          value
        }

        onChange={
          (
            event,
          ) =>
            onChange(
              event.target.value,
            )
        }

        placeholder={
          placeholder
        }

        className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
      />

    </div>
  );
}


/*
 * ==========================================================
 * TEXT AREA
 * ==========================================================
 */

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string,
    ) => void;

  placeholder?:
    string;

  rows:
    number;
}) {

  return (

    <div>

      <label className="mb-2 block text-sm font-bold text-neutral-800">

        {
          label
        }

      </label>


      <textarea
        value={
          value
        }

        onChange={
          (
            event,
          ) =>
            onChange(
              event.target.value,
            )
        }

        placeholder={
          placeholder
        }

        rows={
          rows
        }

        className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm leading-6 outline-none focus:border-[#D4AF37]"
      />

    </div>
  );
}


/*
 * ==========================================================
 * TOGGLE ROW
 * ==========================================================
 */

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title:
    string;

  description:
    string;

  checked:
    boolean;

  onChange:
    (
      value:
        boolean,
    ) => void;
}) {

  return (

    <div className="flex items-center justify-between gap-4">

      <div>

        <p className="text-sm font-black text-neutral-800">
          {
            title
          }
        </p>


        <p className="mt-1 text-xs text-neutral-500">
          {
            description
          }
        </p>

      </div>


      <Switch
        checked={
          checked
        }

        onChange={
          onChange
        }
      />

    </div>
  );
}