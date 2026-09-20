import {
  Box,
  CheckCircle2,
  Eye,
  FileUp,
  RotateCw,
  Trash2,
  ZoomIn,
} from "lucide-react";

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  defaultHomepage3DModel,
  type Homepage3DModel,
} from "../../../types/homepage3DModel";

import {
  MAX_HOMEPAGE_3D_FILE_SIZE,
  deleteHomepage3DModelFile,
  disableHomepage3DModel,
  saveHomepage3DModel,
  subscribeToHomepage3DModel,
  uploadHomepage3DModelFile,
} from "../../../services/homepage3DModel.service";

const HomepageSTLViewer =
  lazy(
    () =>
      import(
        "../../../components/sections/HomepageSTLViewer"
      ),
  );

const MAX_FILE_SIZE_LABEL =
  `${Math.round(
    MAX_HOMEPAGE_3D_FILE_SIZE /
      (1024 * 1024),
  )} MB`;

const ADMIN_VIEWER_SIZE = 480;

const MIN_ZOOM_LEVEL = 0.5;

const MAX_ZOOM_LEVEL = 2;

function formatZoomLevel(
  value: number,
): string {
  return `${Math.round(
    value * 100,
  )}%`;
}

export default function Homepage3DModelManager() {
  const [
    model,
    setModel,
  ] =
    useState<Homepage3DModel>(
      defaultHomepage3DModel,
    );

  const [
    title,
    setTitle,
  ] =
    useState(
      defaultHomepage3DModel.title,
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      defaultHomepage3DModel.description,
    );

  const [
    enabled,
    setEnabled,
  ] =
    useState(
      defaultHomepage3DModel.enabled,
    );

  const [
    rotationEnabled,
    setRotationEnabled,
  ] =
    useState(
      defaultHomepage3DModel.rotationEnabled,
    );

  const [
    rotationSpeed,
    setRotationSpeed,
  ] =
    useState(
      defaultHomepage3DModel.rotationSpeed,
    );

  const [
    zoomEnabled,
    setZoomEnabled,
  ] =
    useState(
      defaultHomepage3DModel.zoomEnabled,
    );

  const [
    zoomLevel,
    setZoomLevel,
  ] =
    useState(
      defaultHomepage3DModel.zoomLevel,
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  /*
   * =========================================================
   * LOAD SETTINGS
   * =========================================================
   */

  useEffect(() => {
    return subscribeToHomepage3DModel(
      (nextModel) => {
        setModel(
          nextModel,
        );

        if (!selectedFile) {
          setTitle(
            nextModel.title,
          );

          setDescription(
            nextModel.description,
          );

          setEnabled(
            nextModel.enabled,
          );

          setRotationEnabled(
            nextModel.rotationEnabled,
          );

          setRotationSpeed(
            nextModel.rotationSpeed,
          );

          setZoomEnabled(
            nextModel.zoomEnabled,
          );

          setZoomLevel(
            nextModel.zoomLevel,
          );

          setPreviewUrl(
            nextModel.fileUrl,
          );
        }
      },

      (listenerError) => {
        console.error(
          "Homepage 3D model subscription failed:",
          listenerError,
        );

        setError(
          listenerError.message ||
            "Unable to load homepage 3D model settings.",
        );
      },
    );
  }, [selectedFile]);

  /*
   * =========================================================
   * BLOB CLEANUP
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (
        previewUrl.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [previewUrl]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  /*
   * =========================================================
   * FILE CHANGE
   * =========================================================
   */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    clearMessages();

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".stl")
    ) {
      setError(
        "Please choose an .stl file.",
      );

      event.target.value =
        "";

      return;
    }

    if (file.size <= 0) {
      setError(
        "The selected STL file is empty.",
      );

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      MAX_HOMEPAGE_3D_FILE_SIZE
    ) {
      setError(
        `The STL file must be ${MAX_FILE_SIZE_LABEL} or smaller.`,
      );

      event.target.value =
        "";

      return;
    }

    if (
      previewUrl.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setSelectedFile(
      file,
    );

    setPreviewUrl(
      URL.createObjectURL(
        file,
      ),
    );
  }

  /*
   * =========================================================
   * SAVE
   * =========================================================
   */

  async function handleSave() {
    clearMessages();

    if (!title.trim()) {
      setError(
        "Please enter a model title.",
      );

      return;
    }

    if (
      !selectedFile &&
      !model.fileUrl
    ) {
      setError(
        "Please upload an STL file first.",
      );

      return;
    }

    try {
      setSaving(true);

      const safeZoomLevel =
        Math.min(
          MAX_ZOOM_LEVEL,
          Math.max(
            MIN_ZOOM_LEVEL,
            zoomLevel,
          ),
        );

      let nextModel: Homepage3DModel =
        {
          ...model,

          enabled,

          title:
            title.trim(),

          description:
            description.trim(),

          rotationEnabled,

          rotationSpeed,

          zoomEnabled,

          zoomLevel:
            safeZoomLevel,
        };

      let newStoragePath =
        "";

      if (selectedFile) {
        const uploaded =
          await uploadHomepage3DModelFile(
            selectedFile,
          );

        newStoragePath =
          uploaded.path;

        nextModel = {
          ...nextModel,

          fileUrl:
            uploaded.url,

          storagePath:
            uploaded.path,

          originalFileName:
            uploaded.originalFileName,
        };
      }

      try {
        await saveHomepage3DModel(
          nextModel,
        );
      } catch (saveError) {
        if (newStoragePath) {
          try {
            await deleteHomepage3DModelFile(
              newStoragePath,
            );
          } catch (
            cleanupError
          ) {
            console.warn(
              "Unable to clean up the new homepage STL after save failure:",
              cleanupError,
            );
          }
        }

        throw saveError;
      }

      if (
        selectedFile &&
        model.storagePath &&
        model.storagePath !==
          nextModel.storagePath
      ) {
        try {
          await deleteHomepage3DModelFile(
            model.storagePath,
          );
        } catch (
          deleteError
        ) {
          console.warn(
            "The new homepage model was saved, but the old STL could not be deleted:",
            deleteError,
          );
        }
      }

      setSelectedFile(
        null,
      );

      setModel(
        nextModel,
      );

      setZoomLevel(
        safeZoomLevel,
      );

      setMessage(
        enabled
          ? "Homepage 3D model published successfully."
          : "Homepage 3D model settings saved and the model is hidden.",
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    } catch (
      saveError
    ) {
      console.error(
        "Failed to save homepage 3D model:",
        saveError,
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the homepage 3D model.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  async function handleDelete() {
    clearMessages();

    if (
      !model.fileUrl &&
      !model.storagePath
    ) {
      setError(
        "There is no homepage 3D model to remove.",
      );

      return;
    }

    if (
      !window.confirm(
        "Remove the current homepage 3D model?",
      )
    ) {
      return;
    }

    try {
      setDeleting(true);

      if (model.storagePath) {
        await deleteHomepage3DModelFile(
          model.storagePath,
        );
      }

      await disableHomepage3DModel();

      if (
        previewUrl.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }

      setSelectedFile(
        null,
      );

      setPreviewUrl("");

      setModel(
        defaultHomepage3DModel,
      );

      setTitle(
        defaultHomepage3DModel.title,
      );

      setDescription(
        defaultHomepage3DModel.description,
      );

      setEnabled(false);

      setRotationEnabled(
        true,
      );

      setRotationSpeed(
        0.7,
      );

      setZoomEnabled(
        true,
      );

      setZoomLevel(
        1,
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      setMessage(
        "Homepage 3D model removed.",
      );
    } catch (
      deleteError
    ) {
      console.error(
        "Failed to remove homepage 3D model:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove the homepage 3D model.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const viewerUrl =
    previewUrl ||
    model.fileUrl;

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <Box size={21} />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Homepage visual
            </p>

            <h2 className="mt-1 text-xl font-black text-neutral-950">
              3D Printed Model
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
              Upload and control the 3D model shown in your homepage hero.
            </p>

          </div>

        </div>

        <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-600">
          Max STL: {MAX_FILE_SIZE_LABEL}
        </div>

      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[0.95fr_1.05fr]">

        {/* =================================================
            FIXED VIEWER
        ================================================== */}

        <div className="flex justify-center">

          <div
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950"
            style={{
              width:
                `${ADMIN_VIEWER_SIZE}px`,

              height:
                `${ADMIN_VIEWER_SIZE}px`,

              maxWidth:
                "100%",
            }}
          >

            {viewerUrl ? (

              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-neutral-950">

                    <div className="text-center">

                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#D4AF37]" />

                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                        Loading 3D Model
                      </p>

                    </div>

                  </div>
                }
              >

                <HomepageSTLViewer
                  url={viewerUrl}

                  autoRotate={
                    rotationEnabled
                  }

                  rotationSpeed={
                    rotationSpeed
                  }

                  zoomEnabled={
                    zoomEnabled
                  }

                  zoomLevel={
                    zoomLevel
                  }

                  showLoadingLabel={
                    false
                  }
                />

              </Suspense>

            ) : (

              <div className="flex h-full flex-col items-center justify-center px-8 text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">

                  <Box
                    size={38}
                    className="text-[#D4AF37]"
                  />

                </div>

                <p className="mt-6 text-base font-black text-white">
                  No STL model uploaded
                </p>

                <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-400">
                  Upload your first 3D printed model to preview it here.
                </p>

              </div>

            )}

          </div>

        </div>

        {/* =================================================
            SETTINGS
        ================================================== */}

        <div className="space-y-5">

          {/* TITLE */}

          <div>

            <label
              htmlFor="homepage-3d-title"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Model Title
            </label>

            <input
              id="homepage-3d-title"
              value={title}
              onChange={(event) => {
                clearMessages();

                setTitle(
                  event.target.value,
                );
              }}
              placeholder="Custom Electronics Enclosure"
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none transition focus:border-[#D4AF37]"
            />

          </div>

          {/* DESCRIPTION */}

          <div>

            <label
              htmlFor="homepage-3d-description"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Description
            </label>

            <textarea
              id="homepage-3d-description"
              value={description}
              onChange={(event) => {
                clearMessages();

                setDescription(
                  event.target.value,
                );
              }}
              rows={3}
              placeholder="3D printed model designed by Nexletronics."
              className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none transition focus:border-[#D4AF37]"
            />

          </div>

          {/* STL */}

          <div>

            <label
              htmlFor="homepage-3d-file"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              STL File
            </label>

            <input
              ref={fileInputRef}
              id="homepage-3d-file"
              type="file"
              accept=".stl,model/stl"
              onChange={
                handleFileChange
              }
              className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#D4AF37]/10 file:px-4 file:py-2 file:text-xs file:font-black file:text-[#9b7e1d]"
            />

            <p className="mt-2 text-xs text-neutral-500">

              {selectedFile
                ? `Selected: ${selectedFile.name}`
                : model.originalFileName
                  ? `Current: ${model.originalFileName}`
                  : "Choose an STL file to create the homepage model."}

            </p>

          </div>

          {/* TOGGLES */}

          <div className="space-y-3">

            {/* SHOW */}

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

              <div>

                <p className="text-sm font-bold text-neutral-900">
                  Show on Homepage
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Display this model in the homepage hero.
                </p>

              </div>

              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => {
                  clearMessages();

                  setEnabled(
                    event.target.checked,
                  );
                }}
                className="h-5 w-5 accent-[#D4AF37]"
              />

            </label>

            {/* ROTATION */}

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

              <div className="flex items-start gap-3">

                <RotateCw
                  size={19}
                  className="mt-0.5 text-[#D4AF37]"
                />

                <div>

                  <p className="text-sm font-bold text-neutral-900">
                    Auto Rotation
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Rotate the model automatically.
                  </p>

                </div>

              </div>

              <input
                type="checkbox"
                checked={
                  rotationEnabled
                }
                onChange={(event) => {
                  clearMessages();

                  setRotationEnabled(
                    event.target.checked,
                  );
                }}
                className="h-5 w-5 accent-[#D4AF37]"
              />

            </label>

            {/* SCROLL */}

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

              <div className="flex items-start gap-3">

                <ZoomIn
                  size={19}
                  className="mt-0.5 text-[#D4AF37]"
                />

                <div>

                  <p className="text-sm font-bold text-neutral-900">
                    Scroll / Zoom
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Allow mouse-wheel and trackpad zoom.
                  </p>

                </div>

              </div>

              <input
                type="checkbox"
                checked={
                  zoomEnabled
                }
                onChange={(event) => {
                  clearMessages();

                  setZoomEnabled(
                    event.target.checked,
                  );
                }}
                className="h-5 w-5 accent-[#D4AF37]"
              />

            </label>

          </div>

          {/* ROTATION SPEED */}

          <div className="rounded-2xl border border-neutral-200 p-4">

            <div className="flex items-center justify-between gap-4">

              <div>

                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">

                  <RotateCw
                    size={16}
                  />

                  Rotation Speed

                </div>

                <p className="mt-1 text-xs text-neutral-500">
                  Adjust how quickly the model rotates.
                </p>

              </div>

              <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-black text-[#9b7e1d]">
                {rotationSpeed.toFixed(
                  1,
                )}
                x
              </span>

            </div>

            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.1"
              value={
                rotationSpeed
              }
              disabled={
                !rotationEnabled
              }
              onChange={(event) => {
                clearMessages();

                setRotationSpeed(
                  Number(
                    event.target.value,
                  ),
                );
              }}
              className="mt-5 w-full accent-[#D4AF37] disabled:opacity-40"
            />

          </div>

          {/* =================================================
              ZOOM LEVEL
          ================================================== */}

          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-start gap-3">

                <ZoomIn
                  size={20}
                  className="mt-0.5 text-[#D4AF37]"
                />

                <div>

                  <p className="text-sm font-black text-neutral-900">
                    Initial Zoom Level
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Set how close the model starts when the page opens.
                  </p>

                </div>

              </div>

              <span className="shrink-0 rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-black text-white">
                {formatZoomLevel(
                  zoomLevel,
                )}
              </span>

            </div>

            <input
              type="range"
              min={
                MIN_ZOOM_LEVEL
              }
              max={
                MAX_ZOOM_LEVEL
              }
              step="0.05"
              value={zoomLevel}
              onChange={(event) => {
                clearMessages();

                setZoomLevel(
                  Number(
                    event.target.value,
                  ),
                );
              }}
              className="mt-6 w-full accent-[#D4AF37]"
            />

            <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">

              <span>
                50%
              </span>

              <span>
                100% Normal
              </span>

              <span>
                200%
              </span>

            </div>

            <button
              type="button"
              onClick={() => {
                clearMessages();

                setZoomLevel(
                  1,
                );
              }}
              className="mt-4 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#9b7e1d]"
            >
              Reset to 100%
            </button>

          </div>

          {/* CONTROLS INFO */}

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
              Current Settings
            </p>

            <div className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-3">

              <div className="rounded-xl bg-white px-3 py-2">

                <span className="font-black text-neutral-900">
                  Rotation
                </span>

                <br />

                {rotationEnabled
                  ? "ON"
                  : "OFF"}

              </div>

              <div className="rounded-xl bg-white px-3 py-2">

                <span className="font-black text-neutral-900">
                  Scroll
                </span>

                <br />

                {zoomEnabled
                  ? "ON"
                  : "OFF"}

              </div>

              <div className="rounded-xl bg-white px-3 py-2">

                <span className="font-black text-neutral-900">
                  Zoom
                </span>

                <br />

                {formatZoomLevel(
                  zoomLevel,
                )}

              </div>

            </div>

          </div>

          {/* MESSAGE */}

          {message && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">

              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>
                {message}
              </span>

            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                saving ||
                deleting
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-50"
            >

              <FileUp
                size={17}
              />

              {saving
                ? "Uploading..."
                : "Save & Publish"}

            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-sm font-black text-neutral-900 transition hover:border-[#D4AF37] hover:text-[#9b7e1d]"
            >

              <Eye
                size={17}
              />

              Preview Homepage

            </a>

            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              disabled={
                saving ||
                deleting ||
                !model.fileUrl
              }
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3.5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Trash2
                size={17}
              />

              {deleting
                ? "Removing..."
                : "Remove Model"}

            </button>

          </div>

        </div>

      </div>

    </section>
  );
}