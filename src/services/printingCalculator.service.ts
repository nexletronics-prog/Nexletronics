import type {
  PrintingFinish,
  PrintingMaterial,
  PrintingSettings,
} from "../types/printing";


interface CalculatePrintingPriceInput {

  material:
    PrintingMaterial;

  finish:
    PrintingFinish;

  quantity:
    number;

  volumeCm3:
    number;
}


/*
 * ==========================================================
 * CALCULATE
 * ==========================================================
 */

export function calculatePrintingEstimate(
  settings:
    PrintingSettings,

  input:
    CalculatePrintingPriceInput,
) {

  const quantity =
    Math.max(
      1,
      Math.floor(
        input.quantity,
      ),
    );


  const volume =
    Math.max(
      0,
      input.volumeCm3,
    );


  /*
   * Find the material that the admin configured.
   */

  const material =
    settings.materials.find(
      (
        item,
      ) =>
        item.id ===
        input.material &&
        item.active,
    );


  if (
    !material
  ) {

    throw new Error(
      "The selected printing material is no longer available.",
    );
  }


  /*
   * Material utilization estimate.
   *
   * This remains an estimate until a slicer is integrated.
   */

  const utilization =
    input.finish ===
    "premium"
      ? 0.35
      : 0.22;


  const estimatedWeightGrams =
    volume *
    material.densityGramsPerCm3 *
    utilization;


  /*
   * Temporary print-time estimate.
   *
   * Later we can replace this with actual sliced time.
   */

  const estimatedPrintTimeMinutes =
    Math.max(
      15,
      volume *
        1.8,
    );


  /*
   * MATERIAL COST
   */

  const materialCost =
    estimatedWeightGrams *
    material.pricePerGram *
    quantity;


  /*
   * MACHINE COST
   */

  const machineCost =
    (
      estimatedPrintTimeMinutes /
      60
    ) *
    settings.machineRatePerHour *
    quantity;


  /*
   * FINISHING
   */

  const multiplier =
    input.finish ===
    "premium"
      ? settings.premiumMultiplier
      : settings.roughMultiplier;


  const finishingCost =
    (
      materialCost +
      machineCost
    ) *
    Math.max(
      0,
      multiplier - 1,
    );


  /*
   * OTHER COSTS
   */

  const setupCost =
    settings.setupFee;

  const packagingCost =
    settings.packagingFee;

  const deliveryCost =
    settings.deliveryFee;


  /*
   * SUBTOTAL
   */

  const subtotal =
    materialCost +
    machineCost +
    finishingCost +
    setupCost +
    packagingCost +
    deliveryCost;


  /*
   * MINIMUM PRINT CHARGE
   */

  const estimatedTotal =
    Math.max(
      settings.minimumPrintCharge,
      subtotal,
    );


  return {

    materialCost,

    machineCost,

    finishingCost,

    setupCost,

    packagingCost,

    deliveryCost,

    subtotal,

    estimatedTotal,

    estimatedWeightGrams,

    estimatedPrintTimeMinutes,
  };
}