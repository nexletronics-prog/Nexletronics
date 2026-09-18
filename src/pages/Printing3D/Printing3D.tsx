import {
  CheckCircle2,
  FileBox,
  FileUp,
  Layers3,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  useNavigate,
} from "react-router-dom";

import {
  db,
} from "../../firebase/config";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  calculatePrintingEstimate,
} from "../../services/printingCalculator.service";

import {
  createPrintingOrder,
  defaultPrintingSettings,
  updatePrintingOrder,
} from "../../services/printing.service";

import {
  uploadStlFile,
} from "../../services/printingStorage.service";

import {
  parseStlFile,
  validatePrintingDimensions,
  type StlDimensions,
} from "../../services/stl.service";

import type {
  PrintingFinish,
  PrintingMaterial,
  PrintingSettings,
} from "../../types/printing";


/*
 * ==========================================================
 * CONSTANTS
 * ==========================================================
 */

const PRINTING_SETTINGS_PATH =
  "printingSettings";

const PRINTING_SETTINGS_ID =
  "default";

const MAX_FILE_SIZE =
  50 * 1024 * 1024;


/*
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

export default function Printing3D() {

  const navigate =
    useNavigate();


  const {
    user,
  } =
    useAuth();


  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  /*
   * ========================================================
   * SETTINGS
   * ========================================================
   */

  const [
    settings,
    setSettings,
  ] =
    useState<PrintingSettings>(
      defaultPrintingSettings,
    );


  const [
    loadingSettings,
    setLoadingSettings,
  ] =
    useState(true);


  const [
    settingsError,
    setSettingsError,
  ] =
    useState("");


  /*
   * ========================================================
   * FILE
   * ========================================================
   */

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    );


  const [
    dimensions,
    setDimensions,
  ] =
    useState<StlDimensions | null>(
      null,
    );


  /*
   * ========================================================
   * PRINT OPTIONS
   * ========================================================
   */

  const [
    material,
    setMaterial,
  ] =
    useState<PrintingMaterial>(
      defaultPrintingSettings.materials[0]?.id ??
        "",
    );


  const [
    finish,
    setFinish,
  ] =
    useState<PrintingFinish>(
      "rough",
    );


  const [
    quantity,
    setQuantity,
  ] =
    useState(1);


  /*
   * ========================================================
   * UI
   * ========================================================
   */

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(false);


  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  /*
   * ========================================================
   * REALTIME SETTINGS
   * ========================================================
   *
   * The customer page listens directly to:
   *
   * printingSettings/default
   *
   * Therefore changes made from the admin settings page
   * are reflected without refreshing the browser.
   */

  useEffect(() => {

    setLoadingSettings(
      true,
    );

    setSettingsError(
      "",
    );


    const settingsRef =
      doc(
        db,
        PRINTING_SETTINGS_PATH,
        PRINTING_SETTINGS_ID,
      );


    const unsubscribe =
      onSnapshot(
        settingsRef,

        (
          snapshot,
        ) => {

          if (
            !snapshot.exists()
          ) {

            /*
             * No admin settings have been created yet.
             * Use the application defaults.
             */

            setSettings(
              defaultPrintingSettings,
            );


            setSettingsError(
              "Admin printing settings have not been configured yet. Showing default settings.",
            );


            const firstDefaultMaterial =
              defaultPrintingSettings.materials.find(
                (
                  item,
                ) =>
                  item.active,
              );


            if (
              firstDefaultMaterial
            ) {

              setMaterial(
                (
                  current,
                ) =>
                  current ||
                  firstDefaultMaterial.id,
              );

            }


            setLoadingSettings(
              false,
            );

            return;
          }


          const data =
            snapshot.data();


          /*
           * Normalize the Firestore document so malformed
           * values cannot break the customer UI.
           */

          const materials =
            normalizeMaterials(
              data.materials,
            );


          const nextSettings:
            PrintingSettings = {

            printerName:
              stringOrDefault(
                data.printerName,
                "Bambu Lab A1",
              ),

            buildWidth:
              numberOrDefault(
                data.buildWidth,
                256,
              ),

            buildDepth:
              numberOrDefault(
                data.buildDepth,
                256,
              ),

            buildHeight:
              numberOrDefault(
                data.buildHeight,
                256,
              ),

            materials,

            roughMultiplier:
              numberOrDefault(
                data.roughMultiplier,
                1,
              ),

            premiumMultiplier:
              numberOrDefault(
                data.premiumMultiplier,
                1.5,
              ),

            machineRatePerHour:
              numberOrDefault(
                data.machineRatePerHour,
                30,
              ),

            minimumPrintCharge:
              numberOrDefault(
                data.minimumPrintCharge,
                100,
              ),

            setupFee:
              numberOrDefault(
                data.setupFee,
                0,
              ),

            packagingFee:
              numberOrDefault(
                data.packagingFee,
                0,
              ),

            deliveryFee:
              numberOrDefault(
                data.deliveryFee,
                0,
              ),

            updatedAt:
              data.updatedAt,
          };


          setSettings(
            nextSettings,
          );


          /*
           * Keep the selected material when possible.
           *
           * If admin disabled/deleted it, automatically move
           * to the first active material.
           */

          setMaterial(
            (currentMaterial) => {

              const stillAvailable =
                nextSettings.materials.some(
                  (item) =>
                    item.id === currentMaterial &&
                    item.active,
                );


              if (stillAvailable) {
                return currentMaterial;
              }


              return (
                nextSettings.materials.find(
                  (item) =>
                    item.active,
                )?.id ??
                ""
              );
            },
          );


          setSettingsError(
            "", 
          );


          setLoadingSettings(
            false,
          );
        },

        (
          snapshotError,
        ) => {

          console.error(
            "Realtime printing settings error:",
            snapshotError,
          );


          /*
           * Fall back safely instead of leaving the customer
           * stuck on "loading".
           */

          setSettings(
            defaultPrintingSettings,
          );


          setSettingsError(
            "Live printing settings are temporarily unavailable. Showing default settings.",
          );


          const firstDefaultMaterial =
            defaultPrintingSettings.materials.find(
              (
                item,
              ) =>
                item.active,
            );


          if (
            firstDefaultMaterial
          ) {

            setMaterial(
              (
                current,
              ) =>
                current ||
                firstDefaultMaterial.id,
            );

          }


          setLoadingSettings(
            false,
          );
        },
      );


    return () => {

      unsubscribe();

    };

  }, []);


  /*
   * ========================================================
   * ACTIVE MATERIALS
   * ========================================================
   */

  const activeMaterials =
    useMemo(
      () =>
        settings.materials.filter(
          (
            item,
          ) =>
            item.active,
        ),
      [
        settings.materials,
      ],
    );


  /*
   * ========================================================
   * SELECTED MATERIAL
   * ========================================================
   */

  const selectedMaterial =
    useMemo(
      () =>
        settings.materials.find(
          (
            item,
          ) =>
            item.id ===
            material,
        ) ??
        null,
      [
        settings.materials,
        material,
      ],
    );


  /*
   * ========================================================
   * ANALYZE STL
   * ========================================================
   */

  async function analyzeFile(
    file: File,
  ) {

    setError(
      "",
    );

    setSuccess(
      "",
    );

    setAnalyzing(
      true,
    );

    setDimensions(
      null,
    );


    try {

      /*
       * Basic file validation.
       */

      if (
        !file.name
          .toLowerCase()
          .endsWith(
            ".stl",
          )
      ) {

        throw new Error(
          "Please select an STL file.",
        );
      }


      if (
        file.size <=
        0
      ) {

        throw new Error(
          "The STL file is empty.",
        );
      }


      if (
        file.size >
        MAX_FILE_SIZE
      ) {

        throw new Error(
          "The STL file must be 50 MB or smaller.",
        );
      }


      /*
       * Parse the STL locally.
       *
       * The file is not uploaded during analysis.
       */

      const result =
        await parseStlFile(
          file,
        );


      /*
       * Validate against Bambu Lab A1 build dimensions
       * stored in the admin settings.
       */

      validatePrintingDimensions(
        result,

        settings.buildWidth,

        settings.buildDepth,

        settings.buildHeight,
      );


      setSelectedFile(
        file,
      );


      setDimensions(
        result,
      );


      setSuccess(
        "STL analyzed successfully.",
      );

    } catch (
      analysisError
    ) {

      console.error(
        "STL analysis failed:",
        analysisError,
      );


      setSelectedFile(
        null,
      );


      setDimensions(
        null,
      );


      setError(
        analysisError instanceof
          Error
          ? analysisError.message
          : "Unable to analyze the STL file.",
      );

    } finally {

      setAnalyzing(
        false,
      );
    }
  }


  /*
   * ========================================================
   * FILE SELECT
   * ========================================================
   */

  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {

    const file =
      event.target.files?.[0];


    /*
     * Allow selecting the same file again.
     */

    event.target.value =
      "";


    if (
      !file
    ) {
      return;
    }


    void analyzeFile(
      file,
    );
  }


  /*
   * ========================================================
   * ESTIMATE
   * ========================================================
   */

  const estimate =
    useMemo(
      () => {

        if (
          !dimensions ||
          !material
        ) {

          return null;
        }


        try {

          return calculatePrintingEstimate(
            settings,

            {
              material,

              finish,

              quantity,

              volumeCm3:
                dimensions.volumeCm3,
            },
          );

        } catch (
          estimateError
        ) {

          console.error(
            "Printing estimate failed:",
            estimateError,
          );


          return null;
        }

      },
      [
        settings,
        dimensions,
        material,
        finish,
        quantity,
      ],
    );


  /*
   * ========================================================
   * SUBMIT PRINT REQUEST
   * ========================================================
   */

  async function handleSubmitRequest() {

    setError(
      "",
    );

    setSuccess(
      "",
    );


    /*
     * Customer must be logged in.
     */

    if (
      !user
    ) {

      navigate(
        "/login",
        {
          state: {
            from:
              "/3d-printing",
          },
        },
      );


      return;
    }


    /*
     * Validate form.
     */

    if (
      !selectedFile
    ) {

      setError(
        "Please upload an STL file.",
      );


      return;
    }


    if (
      !dimensions
    ) {

      setError(
        "Please analyze your STL file first.",
      );


      return;
    }


    if (
      !estimate
    ) {

      setError(
        "A printing estimate could not be calculated.",
      );


      return;
    }


    if (
      !selectedMaterial
    ) {

      setError(
        "Please select an available material.",
      );


      return;
    }


    if (
      activeMaterials.length ===
      0
    ) {

      setError(
        "No printing materials are currently available.",
      );


      return;
    }


    try {

      setSubmitting(
        true,
      );


      /*
       * ----------------------------------------------------
       * STEP 1
       * Create the Firestore printing request.
       *
       * We need the generated document ID before we can
       * determine the private Storage path for the STL.
       * ----------------------------------------------------
       */

      const orderId =
        await createPrintingOrder(
          {
            userId:
              user.uid,

            customerName:
              user.displayName?.trim() ||
              user.email
                ?.split(
                  "@",
                )[0] ||
              "Customer",

            customerEmail:
              user.email ||
              "",

            originalFileName:
              selectedFile.name,

            storagePath:
              "",

            material:
              selectedMaterial.id,

            finish,

            quantity,

            dimensions: {

              width:
                dimensions.width,

              depth:
                dimensions.depth,

              height:
                dimensions.height,
            },

            volumeCm3:
              dimensions.volumeCm3,

            estimatedWeightGrams:
              estimate.estimatedWeightGrams,

            estimatedPrintTimeMinutes:
              estimate.estimatedPrintTimeMinutes,

            estimate,

            estimatedPrice:
              Math.ceil(
                estimate.estimatedTotal,
              ),

            status:
              "pending",

            paymentStatus:
              "unpaid",

            customerNotes:
              "",

            adminNotes:
              "",
          },
        );


      /*
       * ----------------------------------------------------
       * STEP 2
       * Upload STL through the secure Supabase Edge Function.
       * ----------------------------------------------------
       */

      let uploaded:

        {
          path: string;
          fileName: string;
        };


      try {

        uploaded =
          await uploadStlFile(
            selectedFile,
            orderId,
          );

      } catch (
        uploadError
      ) {

        /*
         * The request document exists, but no STL was stored.
         *
         * Remove/mark it later from the admin interface.
         * We deliberately do not pretend the upload succeeded.
         */

        console.error(
          "STL upload failed:",
          uploadError,
        );


        throw uploadError;
      }


      /*
       * ----------------------------------------------------
       * STEP 3
       * Save the secure Storage path into the request.
       * ----------------------------------------------------
       */

      await updatePrintingOrder(
        orderId,
        {
          storagePath:
            uploaded.path,

          originalFileName:
            uploaded.fileName,

          status:
            "pending",
        },
      );


      /*
       * ----------------------------------------------------
       * STEP 4
       * Tell the customer the request was accepted.
       * ----------------------------------------------------
       */

      setSuccess(
        "Your 3D printing request has been submitted successfully.",
      );


      /*
       * Reset form state.
       */

      setSelectedFile(
        null,
      );


      setDimensions(
        null,
      );


      setQuantity(
        1,
      );


      /*
       * Move the user to My 3D Printing after a short delay.
       */

      window.setTimeout(
        () => {

          navigate(
            "/my-3d-printing",
            {
              replace:
                true,
            },
          );

        },
        1000,
      );

    } catch (
      submitError
    ) {

      console.error(
        "3D printing request failed:",
        submitError,
      );


      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to submit the printing request.",
      );

    } finally {

      setSubmitting(
        false,
      );
    }
  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loadingSettings
  ) {

    return (
      <section className="section bg-white">

        <div className="container-custom">

          <div className="flex min-h-[60vh] items-center justify-center">

            <div className="text-center">

              <Loader2
                size={38}
                className="mx-auto animate-spin text-[#D4AF37]"
              />


              <p className="mt-5 text-sm font-bold text-neutral-500">
                Loading 3D printing options...
              </p>

            </div>

          </div>

        </div>

      </section>
    );
  }


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <section className="bg-white">

      {/* ==================================================
          HERO
      =================================================== */}

      <section className="relative overflow-hidden bg-[#faf9f5] py-20">

        <div className="pointer-events-none absolute -right-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#D4AF37]/10 blur-3xl" />


        <div className="container-custom relative">

          <div className="max-w-4xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-white px-4 py-2 shadow-sm">

              <Sparkles
                size={14}
                className="text-[#D4AF37]"
              />


              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Nexletronics 3D Printing
              </span>

            </div>


            <h1 className="mt-6 text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl">

              Print your

              <span className="text-[#D4AF37]">
                {" "}
                own design.
              </span>

            </h1>


            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">

              Upload your STL model, select the material and
              finishing quality, review an automated estimate,
              and send your request to Nexletronics for final
              quotation.

            </p>


            <div className="mt-8 flex flex-wrap gap-3">

              <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600">

                Printer:
                {" "}
                {
                  settings.printerName
                }

              </div>


              <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600">

                Build:
                {" "}
                {
                  settings.buildWidth
                }
                ×
                {
                  settings.buildDepth
                }
                ×
                {
                  settings.buildHeight
                }
                {" mm"}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          MAIN
      =================================================== */}

      <section className="section">

        <div className="container-custom">

          {/* SETTINGS MESSAGE */}

          {settingsError && (

            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">

              {
                settingsError
              }

            </div>

          )}


          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

            {/* =================================================
                LEFT
            ================================================== */}

            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              {/* =================================================
                  STEP 1 - STL
              ================================================== */}

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                  Step 1
                </p>


                <h2 className="mt-2 text-2xl font-black text-neutral-950">
                  Upload STL
                </h2>


                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Your STL is analyzed in the browser before
                  the file is uploaded.
                </p>


                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    analyzing ||
                    submitting
                  }
                  className="mt-6 flex w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-neutral-300 bg-[#faf9f5] px-6 py-14 text-center transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {analyzing ? (

                    <Loader2
                      size={34}
                      className="animate-spin text-[#D4AF37]"
                    />

                  ) : (

                    <Upload
                      size={34}
                      className="text-[#D4AF37]"
                    />

                  )}


                  <p className="mt-5 text-lg font-black text-neutral-950">

                    {
                      analyzing
                        ? "Analyzing STL..."
                        : "Choose your STL file"
                    }

                  </p>


                  <p className="mt-2 text-sm text-neutral-500">
                    STL only · Maximum 50 MB
                  </p>

                </button>


                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept=".stl,model/stl,application/sla"
                  className="hidden"
                  onChange={
                    handleFileChange
                  }
                />

              </div>


              {/* =================================================
                  SELECTED FILE
              ================================================== */}

              {selectedFile && (

                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">

                  <div className="flex items-center gap-3">

                    <CheckCircle2
                      size={23}
                      className="shrink-0 text-green-600"
                    />


                    <div className="min-w-0">

                      <p className="font-black text-green-800">
                        STL ready
                      </p>


                      <p className="mt-1 truncate text-sm text-green-700">
                        {
                          selectedFile.name
                        }
                      </p>


                      <p className="mt-1 text-xs text-green-600">
                        {
                          formatFileSize(
                            selectedFile.size,
                          )
                        }
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  MODEL ANALYSIS
              ================================================== */}

              {dimensions && (

                <div className="mt-6 rounded-2xl border border-neutral-200 bg-[#faf9f5] p-5">

                  <div className="flex items-center gap-2">

                    <FileBox
                      size={18}
                      className="text-[#D4AF37]"
                    />


                    <p className="font-black text-neutral-950">
                      Model Analysis
                    </p>

                  </div>


                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">

                    <ModelValue
                      label="Width"
                      value={`${dimensions.width.toFixed(
                        1,
                      )} mm`}
                    />


                    <ModelValue
                      label="Depth"
                      value={`${dimensions.depth.toFixed(
                        1,
                      )} mm`}
                    />


                    <ModelValue
                      label="Height"
                      value={`${dimensions.height.toFixed(
                        1,
                      )} mm`}
                    />


                    <ModelValue
                      label="Volume"
                      value={`${dimensions.volumeCm3.toFixed(
                        2,
                      )} cm³`}
                    />

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 2 - MATERIAL
              ================================================== */}

              <div className="mt-9">

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                  Step 2
                </p>


                <h2 className="mt-2 text-2xl font-black text-neutral-950">
                  Choose Material
                </h2>


                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Material options and prices are controlled
                  by Nexletronics admin.
                </p>


                {activeMaterials.length ===
                0 ? (

                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">

                    <p className="font-bold text-red-700">
                      No materials are currently available.
                    </p>


                    <p className="mt-1 text-sm text-red-600">
                      Please check again later or contact
                      Nexletronics.
                    </p>

                  </div>

                ) : (

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {activeMaterials.map(
                      (
                        item,
                      ) => {

                        const selected =
                          item.id ===
                          material;


                        return (
                          <button
                            key={
                              item.id
                            }
                            type="button"
                            onClick={() =>
                              setMaterial(
                                item.id,
                              )
                            }
                            className={[
                              "rounded-2xl border p-5 text-left transition",

                              selected
                                ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm"
                                : "border-neutral-200 hover:border-[#D4AF37]/50 hover:bg-neutral-50",

                            ].join(
                              " ",
                            )}
                          >

                            <div className="flex items-start justify-between gap-4">

                              <div className="min-w-0">

                                <p className="font-black text-neutral-950">
                                  {
                                    item.name
                                  }
                                </p>


                                <p className="mt-1 text-xs leading-5 text-neutral-500">
                                  {
                                    item.description ||
                                    "3D printing material"
                                  }
                                </p>

                              </div>


                              <span className="shrink-0 whitespace-nowrap text-sm font-black text-[#9b7e1d]">

                                ₹
                                {
                                  item.pricePerGram.toFixed(
                                    2,
                                  )
                                }
                                /g

                              </span>

                            </div>


                            {selected && (

                              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#9b7e1d]">

                                <CheckCircle2
                                  size={14}
                                />

                                Selected

                              </div>

                            )}

                          </button>
                        );
                      },
                    )}

                  </div>

                )}

              </div>


              {/* =================================================
                  STEP 3 - FINISH
              ================================================== */}

              <div className="mt-9">

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                  Step 3
                </p>


                <h2 className="mt-2 text-2xl font-black text-neutral-950">
                  Choose Finish
                </h2>


                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() =>
                      setFinish(
                        "rough",
                      )
                    }
                    className={[
                      "rounded-2xl border p-5 text-left transition",

                      finish ===
                      "rough"
                        ? "border-[#D4AF37] bg-[#D4AF37]/5"
                        : "border-neutral-200 hover:border-[#D4AF37]/50 hover:bg-neutral-50",

                    ].join(
                      " ",
                    )}
                  >

                    <div className="flex items-center gap-3">

                      <Layers3
                        size={21}
                        className="text-[#D4AF37]"
                      />


                      <p className="font-black text-neutral-950">
                        Rough
                      </p>

                    </div>


                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      Prototype-focused printing.
                    </p>


                    {finish ===
                      "rough" && (

                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#9b7e1d]">

                        <CheckCircle2
                          size={14}
                        />

                        Selected

                      </div>

                    )}

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setFinish(
                        "premium",
                      )
                    }
                    className={[
                      "rounded-2xl border p-5 text-left transition",

                      finish ===
                      "premium"
                        ? "border-[#D4AF37] bg-[#D4AF37]/5"
                        : "border-neutral-200 hover:border-[#D4AF37]/50 hover:bg-neutral-50",

                    ].join(
                      " ",
                    )}
                  >

                    <div className="flex items-center gap-3">

                      <Sparkles
                        size={21}
                        className="text-[#D4AF37]"
                      />


                      <p className="font-black text-neutral-950">
                        Premium
                      </p>

                    </div>


                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      Higher-quality final printing.
                    </p>


                    {finish ===
                      "premium" && (

                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#9b7e1d]">

                        <CheckCircle2
                          size={14}
                        />

                        Selected

                      </div>

                    )}

                  </button>

                </div>

              </div>


              {/* =================================================
                  STEP 4 - QUANTITY
              ================================================== */}

              <div className="mt-9">

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                  Step 4
                </p>


                <h2 className="mt-2 text-2xl font-black text-neutral-950">
                  Quantity
                </h2>


                <div className="mt-5 inline-flex items-center rounded-full border border-neutral-200 bg-white">

                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      setQuantity(
                        (
                          current,
                        ) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                    disabled={
                      quantity <=
                        1 ||
                      submitting
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold transition hover:bg-neutral-50 disabled:opacity-40"
                  >
                    −
                  </button>


                  <span className="w-12 text-center text-sm font-black">
                    {
                      quantity
                    }
                  </span>


                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity(
                        (
                          current,
                        ) =>
                          Math.min(
                            100,
                            current + 1,
                          ),
                      )
                    }
                    disabled={
                      quantity >=
                        100 ||
                      submitting
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold transition hover:bg-neutral-50 disabled:opacity-40"
                  >
                    +
                  </button>

                </div>

              </div>


              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (

                <div
                  role="alert"
                  className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
                >
                  {
                    error
                  }
                </div>

              )}


              {/* =================================================
                  SUCCESS
              ================================================== */}

              {success && (

                <div
                  role="status"
                  className="mt-7 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-700"
                >
                  {
                    success
                  }
                </div>

              )}

            </div>


            {/* =================================================
                RIGHT - ESTIMATE
            ================================================== */}

            <div>

              <div className="sticky top-28 rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-6 shadow-sm sm:p-8">

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                  Print Estimate
                </p>


                <h2 className="mt-2 text-3xl font-black text-neutral-950">
                  Your Quote
                </h2>


                {!estimate ? (

                  <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">

                    <FileUp
                      size={30}
                      className="mx-auto text-[#D4AF37]"
                    />


                    <p className="mt-4 text-sm font-black text-neutral-700">
                      Upload an STL to calculate your
                      estimate.
                    </p>


                    <p className="mt-2 text-xs leading-5 text-neutral-400">
                      The estimate updates when you change
                      material, finish or quantity.
                    </p>

                  </div>

                ) : (

                  <>

                    {/* SUMMARY */}

                    <div className="mt-7 rounded-2xl border border-neutral-200 bg-white p-5">

                      <div className="flex items-center justify-between">

                        <div>

                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                            Material
                          </p>


                          <p className="mt-1 font-black text-neutral-950">

                            {
                              selectedMaterial?.name ||
                              "—"
                            }

                          </p>

                        </div>


                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-black text-[#9b7e1d]">

                          {
                            finish ===
                            "premium"
                              ? "Premium"
                              : "Rough"
                          }

                        </span>

                      </div>


                      <div className="mt-4 flex items-center justify-between text-sm">

                        <span className="text-neutral-500">
                          Quantity
                        </span>


                        <span className="font-black">
                          {
                            quantity
                          }
                        </span>

                      </div>

                    </div>


                    {/* PRICE BREAKDOWN */}

                    <div className="mt-5 space-y-4">

                      <PriceRow
                        label="Material"
                        value={
                          estimate.materialCost
                        }
                      />


                      <PriceRow
                        label="Machine time"
                        value={
                          estimate.machineCost
                        }
                      />


                      <PriceRow
                        label="Finishing"
                        value={
                          estimate.finishingCost
                        }
                      />


                      {estimate.setupCost >
                        0 && (

                        <PriceRow
                          label="Setup"
                          value={
                            estimate.setupCost
                          }
                        />

                      )}


                      {estimate.packagingCost >
                        0 && (

                        <PriceRow
                          label="Packaging"
                          value={
                            estimate.packagingCost
                          }
                        />

                      )}


                      {estimate.deliveryCost >
                        0 && (

                        <PriceRow
                          label="Delivery"
                          value={
                            estimate.deliveryCost
                          }
                        />

                      )}

                    </div>


                    {/* TOTAL */}

                    <div className="mt-6 border-t border-neutral-200 pt-6">

                      <div className="flex items-end justify-between gap-4">

                        <div>

                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                            Estimated total
                          </p>


                          <p className="mt-2 text-4xl font-black text-neutral-950">

                            ₹
                            {
                              Math.ceil(
                                estimate.estimatedTotal,
                              ).toLocaleString(
                                "en-IN",
                              )
                            }

                          </p>

                        </div>

                      </div>

                    </div>


                    {/* TECHNICAL */}

                    <div className="mt-5 rounded-2xl border border-[#D4AF37]/20 bg-white p-5">

                      <div className="grid grid-cols-2 gap-4">

                        <div>

                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                            Est. weight
                          </p>


                          <p className="mt-1 font-black text-neutral-950">

                            {
                              estimate.estimatedWeightGrams.toFixed(
                                1,
                              )
                            }
                            {" g"}

                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                            Est. print time
                          </p>


                          <p className="mt-1 font-black text-neutral-950">

                            {
                              formatDuration(
                                estimate.estimatedPrintTimeMinutes,
                              )
                            }

                          </p>

                        </div>

                      </div>

                    </div>


                    {/* NOTE */}

                    <div className="mt-5 text-xs leading-5 text-neutral-400">

                      This is an automated estimate based on
                      your model geometry and the current
                      admin-configured printing settings.
                      Nexletronics will review the STL and may
                      change the final price before payment.

                    </div>


                    {/* SUBMIT */}

                    <button
                      type="button"
                      onClick={() =>
                        void handleSubmitRequest()
                      }
                      disabled={
                        submitting ||
                        analyzing ||
                        activeMaterials.length ===
                          0 ||
                        !estimate
                      }
                      className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {submitting && (

                        <Loader2
                          size={18}
                          className="animate-spin"
                        />

                      )}


                      {
                        submitting
                          ? "Submitting..."
                          : "Submit Print Request"
                      }

                    </button>

                  </>

                )}

              </div>

            </div>

          </div>


          {/* ==================================================
              TRUST / INFORMATION
          =================================================== */}

          <div className="mt-10 grid gap-4 md:grid-cols-3">

            <TrustCard
              icon={
                ShieldCheck
              }
              title="Private STL storage"
              description="Your STL is stored privately and is not exposed through a public bucket URL."
            />


            <TrustCard
              icon={
                Sparkles
              }
              title="Admin reviewed pricing"
              description="The estimate is not the final payable price. Our team reviews every printing request."
            />


            <TrustCard
              icon={
                CheckCircle2
              }
              title="Bambu Lab A1 workflow"
              description="Your print request is configured around the Bambu Lab A1 build capacity."
            />

          </div>

        </div>

      </section>

    </section>
  );
}


/*
 * ==========================================================
 * MODEL VALUE
 * ==========================================================
 */

function ModelValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>

      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
        {
          label
        }
      </p>


      <p className="mt-1 font-black text-neutral-950">
        {
          value
        }
      </p>

    </div>
  );
}


/*
 * ==========================================================
 * PRICE ROW
 * ==========================================================
 */

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (
    <div className="flex items-center justify-between gap-4 text-sm">

      <span className="text-neutral-500">
        {
          label
        }
      </span>


      <span className="font-black text-neutral-950">

        ₹
        {
          Math.ceil(
            value,
          ).toLocaleString(
            "en-IN",
          )
        }

      </span>

    </div>
  );
}


/*
 * ==========================================================
 * TRUST CARD
 * ==========================================================
 */

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">

      <Icon
        size={21}
        className="text-[#D4AF37]"
      />


      <p className="mt-3 font-black text-neutral-950">
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
  );
}


/*
 * ==========================================================
 * MATERIAL NORMALIZER
 * ==========================================================
 */

function normalizeMaterials(
  value: unknown,
): PrintingSettings["materials"] {

  if (
    !Array.isArray(
      value,
    )
  ) {

    return [];
  }


  return value
    .filter(
      (
        item,
      ) =>
        item &&
        typeof item ===
          "object" &&
        typeof (
          item as {
            id?: unknown;
          }
        ).id ===
          "string" &&
        typeof (
          item as {
            name?: unknown;
          }
        ).name ===
          "string",
    )
    .map(
      (
        item,
      ) => {

        const material =
          item as {
            id: string;
            name: string;
            pricePerGram?: unknown;
            densityGramsPerCm3?: unknown;
            active?: unknown;
            description?: unknown;
          };


        return {

          id:
            material.id,

          name:
            material.name.trim(),

          pricePerGram:
            Math.max(
              0,
              numberOrDefault(
                material.pricePerGram,
                0,
              ),
            ),

          densityGramsPerCm3:
            Math.max(
              0.01,
              numberOrDefault(
                material.densityGramsPerCm3,
                1.24,
              ),
            ),

          active:
            material.active !==
            false,

          description:
            typeof material.description ===
              "string"
              ? material.description.trim()
              : "",
        };
      },
    );
}


/*
 * ==========================================================
 * NUMBER HELPER
 * ==========================================================
 */

function numberOrDefault(
  value: unknown,
  fallback: number,
): number {

  const numeric =
    Number(
      value,
    );


  return Number.isFinite(
    numeric,
  )
    ? numeric
    : fallback;
}


/*
 * ==========================================================
 * STRING HELPER
 * ==========================================================
 */

function stringOrDefault(
  value: unknown,
  fallback: string,
): string {

  return typeof value ===
    "string" &&
    value.trim()
    ? value.trim()
    : fallback;
}


/*
 * ==========================================================
 * FILE SIZE
 * ==========================================================
 */

function formatFileSize(
  bytes: number,
): string {

  if (
    bytes <
    1024
  ) {

    return `${bytes} B`;
  }


  if (
    bytes <
    1024 * 1024
  ) {

    return `${(
      bytes /
      1024
    ).toFixed(
      1,
    )} KB`;
  }


  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(
    1,
  )} MB`;
}


/*
 * ==========================================================
 * DURATION
 * ==========================================================
 */

function formatDuration(
  minutes: number,
): string {

  const safeMinutes =
    Math.max(
      0,
      Math.round(
        Number(
          minutes,
        ),
      ),
    );


  const hours =
    Math.floor(
      safeMinutes /
        60,
    );


  const remainingMinutes =
    safeMinutes %
    60;


  if (
    hours ===
    0
  ) {

    return `${remainingMinutes} min`;
  }


  if (
    remainingMinutes ===
    0
  ) {

    return `${hours} h`;
  }


  return `${hours} h ${remainingMinutes} min`;
}