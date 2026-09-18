import {
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getPrintingSettings,
  savePrintingSettings,
} from "../../../services/printing.service";

import type {
  PrintingMaterialConfig,
  PrintingSettings,
} from "../../../types/printing";


export default function PrintingSettings() {

  const [
    settings,
    setSettings,
  ] =
    useState<PrintingSettings | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
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


  /*
   * ========================================================
   * LOAD SETTINGS
   * ========================================================
   */

  useEffect(() => {

    let mounted =
      true;


    async function load() {

      try {

        setLoading(
          true,
        );

        setError(
          "",
        );


        const data =
          await getPrintingSettings();


        if (
          !mounted
        ) {
          return;
        }


        setSettings(
          data,
        );

      } catch (
        loadError
      ) {

        console.error(
          "Unable to load printing settings:",
          loadError,
        );


        if (
          mounted
        ) {

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load printing settings.",
          );

        }

      } finally {

        if (
          mounted
        ) {

          setLoading(
            false,
          );

        }
      }
    }


    void load();


    return () => {

      mounted =
        false;

    };

  }, []);


  /*
   * ========================================================
   * ADD MATERIAL
   * ========================================================
   */

  function addMaterial() {

    if (
      !settings
    ) {
      return;
    }


    const newMaterial:
      PrintingMaterialConfig = {

      id:
        `material-${Date.now()}`,

      name:
        "New Material",

      pricePerGram:
        1,

      densityGramsPerCm3:
        1.24,

      active:
        true,

      description:
        "",
    };


    setSettings(
      {
        ...settings,

        materials: [
          ...settings.materials,
          newMaterial,
        ],
      },
    );


    setMessage(
      "",
    );

    setError(
      "",
    );
  }


  /*
   * ========================================================
   * UPDATE MATERIAL
   * ========================================================
   */

  function updateMaterial(
    id: string,
    patch: Partial<PrintingMaterialConfig>,
  ) {

    if (
      !settings
    ) {
      return;
    }


    setSettings(
      {
        ...settings,

        materials:
          settings.materials.map(
            (
              material,
            ) =>
              material.id ===
              id
                ? {
                    ...material,
                    ...patch,
                  }
                : material,
          ),
      },
    );


    setMessage(
      "",
    );
  }


  /*
   * ========================================================
   * REMOVE MATERIAL
   * ========================================================
   */

  function removeMaterial(
    id: string,
  ) {

    if (
      !settings
    ) {
      return;
    }


    const material =
      settings.materials.find(
        (
          item,
        ) =>
          item.id ===
          id,
      );


    if (
      !material
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Remove ${material.name || "this material"}?`,
      );


    if (
      !confirmed
    ) {
      return;
    }


    setSettings(
      {
        ...settings,

        materials:
          settings.materials.filter(
            (
              item,
            ) =>
              item.id !==
              id,
          ),
      },
    );


    setMessage(
      "",
    );
  }


  /*
   * ========================================================
   * SAVE SETTINGS
   * ========================================================
   */

  async function save() {

    if (
      !settings
    ) {
      return;
    }


    setSaving(
      true,
    );

    setMessage(
      "",
    );

    setError(
      "",
    );


    try {

      const cleanedMaterials =
        settings.materials
          .map(
            (
              material,
            ) => {

              const price =
                Number(
                  material.pricePerGram,
                );


              const density =
                Number(
                  material.densityGramsPerCm3,
                );


              return {
                ...material,

                name:
                  material.name.trim(),

                pricePerGram:
                  Number.isFinite(
                    price,
                  )
                    ? Math.max(
                        0,
                        price,
                      )
                    : 0,

                densityGramsPerCm3:
                  Number.isFinite(
                    density,
                  )
                    ? Math.max(
                        0.01,
                        density,
                      )
                    : 1.24,

                description:
                  material.description?.trim() ??
                  "",
              };
            },
          )
          .filter(
            (
              material,
            ) =>
              material.name.length >
              0,
          );


      if (
        cleanedMaterials.length ===
        0
      ) {

        throw new Error(
          "Add at least one material before saving.",
        );
      }


      const cleanedSettings:
        PrintingSettings = {

        ...settings,

        materials:
          cleanedMaterials,

        printerName:
          settings.printerName.trim() ||
          "Bambu Lab A1",

        buildWidth:
          Math.max(
            1,
            Number(
              settings.buildWidth,
            ),
          ),

        buildDepth:
          Math.max(
            1,
            Number(
              settings.buildDepth,
            ),
          ),

        buildHeight:
          Math.max(
            1,
            Number(
              settings.buildHeight,
            ),
          ),

        roughMultiplier:
          Math.max(
            0,
            Number(
              settings.roughMultiplier,
            ),
          ),

        premiumMultiplier:
          Math.max(
            0,
            Number(
              settings.premiumMultiplier,
            ),
          ),

        machineRatePerHour:
          Math.max(
            0,
            Number(
              settings.machineRatePerHour,
            ),
          ),

        minimumPrintCharge:
          Math.max(
            0,
            Number(
              settings.minimumPrintCharge,
            ),
          ),

        setupFee:
          Math.max(
            0,
            Number(
              settings.setupFee,
            ),
          ),

        packagingFee:
          Math.max(
            0,
            Number(
              settings.packagingFee,
            ),
          ),

        deliveryFee:
          Math.max(
            0,
            Number(
              settings.deliveryFee,
            ),
          ),
      };


      await savePrintingSettings(
        cleanedSettings,
      );


      setSettings(
        cleanedSettings,
      );


      setMessage(
        "Printing settings saved successfully.",
      );

    } catch (
      saveError
    ) {

      console.error(
        "Unable to save printing settings:",
        saveError,
      );


      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save printing settings.",
      );

    } finally {

      setSaving(
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
    loading
  ) {

    return (
      <div className="space-y-5">

        <div className="h-10 w-72 animate-pulse rounded bg-neutral-200" />

        <div className="h-40 animate-pulse rounded-3xl bg-neutral-100" />

        <div className="h-40 animate-pulse rounded-3xl bg-neutral-100" />

      </div>
    );
  }


  /*
   * ========================================================
   * FAILED
   * ========================================================
   */

  if (
    !settings
  ) {

    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">

        {
          error ||
          "Printing settings are unavailable."
        }

      </div>
    );
  }


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <div className="space-y-8">

      {/* ==================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            3D Printing Configuration
          </p>


          <h1 className="mt-2 text-4xl font-black text-neutral-950">
            Printing Settings
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Control your Bambu Lab A1 pricing, available
            materials, finishing profiles and machine charges.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            void save()
          }
          disabled={
            saving
          }
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white disabled:opacity-60"
        >

          <Save
            size={17}
          />

          {
            saving
              ? "Saving..."
              : "Save Settings"
          }

        </button>

      </div>


      {/* ==================================================
          FEEDBACK
      =================================================== */}

      {message && (

        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
          {
            message
          }
        </div>

      )}


      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {
            error
          }
        </div>

      )}


      {/* ==================================================
          MATERIALS
      =================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
              Customer Material Options
            </p>


            <h2 className="mt-2 text-2xl font-black text-neutral-950">
              Materials
            </h2>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Add the filaments you currently offer. Customers
              will only see materials that are marked active.
            </p>

          </div>


          <button
            type="button"
            onClick={
              addMaterial
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-sm font-black text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#9b7e1d]"
          >

            <Plus
              size={17}
            />

            Add Material

          </button>

        </div>


        <div className="mt-7 space-y-4">

          {settings.materials.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">

              <p className="font-black text-neutral-700">
                No materials configured.
              </p>


              <p className="mt-1 text-sm text-neutral-500">
                Add your first material.
              </p>

            </div>

          ) : (

            settings.materials.map(
              (
                material,
                index,
              ) => (

                <div
                  key={
                    material.id
                  }
                  className="rounded-2xl border border-neutral-200 bg-[#faf9f5] p-5"
                >

                  {/* MATERIAL HEADER */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                        Material #
                        {
                          index + 1
                        }
                      </p>


                      <p className="mt-1 text-lg font-black text-neutral-950">
                        {
                          material.name ||
                          "Unnamed Material"
                        }
                      </p>

                    </div>


                    <div className="flex items-center gap-2">

                      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700">

                        <input
                          type="checkbox"
                          checked={
                            material.active
                          }
                          onChange={(
                            event,
                          ) =>
                            updateMaterial(
                              material.id,
                              {
                                active:
                                  event.target.checked,
                              },
                            )
                          }
                        />

                        Active

                      </label>


                      <button
                        type="button"
                        onClick={() =>
                          removeMaterial(
                            material.id,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-50"
                        aria-label={`Remove ${
                          material.name ||
                          "material"
                        }`}
                      >

                        <Trash2
                          size={16}
                        />

                      </button>

                    </div>

                  </div>


                  {/* MATERIAL FIELDS */}

                  <div className="mt-5 grid gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-2 block text-xs font-bold text-neutral-700">
                        Material Name
                      </label>


                      <input
                        type="text"
                        value={
                          material.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMaterial(
                            material.id,
                            {
                              name:
                                event.target.value,
                            },
                          )
                        }
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />

                    </div>


                    <div>

                      <label className="mb-2 block text-xs font-bold text-neutral-700">
                        Price / gram ₹
                      </label>


                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          material.pricePerGram
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMaterial(
                            material.id,
                            {
                              pricePerGram:
                                Number(
                                  event.target.value,
                                ),
                            },
                          )
                        }
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />

                    </div>


                    <div>

                      <label className="mb-2 block text-xs font-bold text-neutral-700">
                        Density g/cm³
                      </label>


                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          material.densityGramsPerCm3
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMaterial(
                            material.id,
                            {
                              densityGramsPerCm3:
                                Number(
                                  event.target.value,
                                ),
                            },
                          )
                        }
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />

                    </div>

                  </div>


                  {/* DESCRIPTION */}

                  <div className="mt-4">

                    <label className="mb-2 block text-xs font-bold text-neutral-700">
                      Customer-facing description
                    </label>


                    <input
                      type="text"
                      value={
                        material.description ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateMaterial(
                          material.id,
                          {
                            description:
                              event.target.value,
                          },
                        )
                      }
                      placeholder="Example: Strong and durable material"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                    />

                  </div>

                </div>

              ),
            )

          )}

        </div>

      </section>


      {/* ==================================================
          PRINTER
      =================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <h2 className="text-2xl font-black text-neutral-950">
          Printer
        </h2>


        <div className="mt-6 grid gap-5 md:grid-cols-4">

          <div>

            <label className="mb-2 block text-xs font-bold text-neutral-700">
              Printer Name
            </label>


            <input
              type="text"
              value={
                settings.printerName
              }
              onChange={(
                event,
              ) =>
                setSettings(
                  {
                    ...settings,

                    printerName:
                      event.target.value,
                  },
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          <SettingInput
            label="Build Width mm"
            value={
              settings.buildWidth
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  buildWidth:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Build Depth mm"
            value={
              settings.buildDepth
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  buildDepth:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Build Height mm"
            value={
              settings.buildHeight
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  buildHeight:
                    value,
                },
              )
            }
          />

        </div>

      </section>


      {/* ==================================================
          FINISHING
      =================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <h2 className="text-2xl font-black text-neutral-950">
          Finishing
        </h2>


        <p className="mt-2 text-sm text-neutral-500">
          Rough is intended for prototypes. Premium is
          intended for final-use printing.
        </p>


        <div className="mt-6 grid gap-5 md:grid-cols-2">

          <SettingInput
            label="Rough Multiplier"
            value={
              settings.roughMultiplier
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  roughMultiplier:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Premium Multiplier"
            value={
              settings.premiumMultiplier
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  premiumMultiplier:
                    value,
                },
              )
            }
          />

        </div>

      </section>


      {/* ==================================================
          COSTING
      =================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <h2 className="text-2xl font-black text-neutral-950">
          Costing
        </h2>


        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5">

          <SettingInput
            label="Machine ₹ / hour"
            value={
              settings.machineRatePerHour
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  machineRatePerHour:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Minimum Charge ₹"
            value={
              settings.minimumPrintCharge
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  minimumPrintCharge:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Setup Fee ₹"
            value={
              settings.setupFee
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  setupFee:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Packaging ₹"
            value={
              settings.packagingFee
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  packagingFee:
                    value,
                },
              )
            }
          />


          <SettingInput
            label="Delivery ₹"
            value={
              settings.deliveryFee
            }
            onChange={(
              value,
            ) =>
              setSettings(
                {
                  ...settings,

                  deliveryFee:
                    value,
                },
              )
            }
          />

        </div>

      </section>


      {/* ==================================================
          SAVE
      =================================================== */}

      <div className="flex justify-end pb-8">

        <button
          type="button"
          onClick={() =>
            void save()
          }
          disabled={
            saving
          }
          className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-60"
        >

          <Save
            size={17}
          />

          {
            saving
              ? "Saving..."
              : "Save All Settings"
          }

        </button>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * NUMBER SETTING INPUT
 * ==========================================================
 */

function SettingInput({
  label,
  value,
  onChange,
}: {
  label: string;

  value: number;

  onChange: (
    value: number,
  ) => void;
}) {

  return (
    <div>

      <label className="mb-2 block text-xs font-bold text-neutral-700">
        {
          label
        }
      </label>


      <input
        type="number"
        min="0"
        step="0.01"
        value={
          Number.isFinite(
            value,
          )
            ? value
            : 0
        }
        onChange={(
          event,
        ) =>
          onChange(
            Number(
              event.target.value,
            ),
          )
        }
        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
      />

    </div>
  );
}