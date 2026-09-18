export type PrintingFinish =
  | "rough"
  | "premium";


/*
 * Material is now dynamic.
 *
 * Admin can create new materials, so this must not be
 * restricted to PLA / PETG / TPU.
 */

export type PrintingMaterial = string;


export interface PrintingMaterialConfig {
  id: string;

  name: string;

  pricePerGram: number;

  densityGramsPerCm3: number;

  active: boolean;

  description?: string;
}


export type PrintingOrderStatus =
  | "pending"
  | "reviewing"
  | "quoted"
  | "payment_pending"
  | "paid"
  | "approved"
  | "printing"
  | "quality_check"
  | "ready"
  | "completed"
  | "rejected"
  | "cancelled";


export interface PrintingModelDimensions {
  width: number;

  depth: number;

  height: number;
}


export interface PrintingEstimate {
  materialCost: number;

  machineCost: number;

  finishingCost: number;

  setupCost: number;

  packagingCost: number;

  deliveryCost: number;

  subtotal: number;

  estimatedTotal: number;

  estimatedWeightGrams?: number;

  estimatedPrintTimeMinutes?: number;
}


export interface PrintingSettings {

  printerName: string;

  buildWidth: number;

  buildDepth: number;

  buildHeight: number;


  /*
   * Dynamic materials managed by admin.
   */

  materials: PrintingMaterialConfig[];


  /*
   * Finishing.
   */

  roughMultiplier: number;

  premiumMultiplier: number;


  /*
   * Machine costing.
   */

  machineRatePerHour: number;

  minimumPrintCharge: number;


  /*
   * Other charges.
   */

  setupFee: number;

  packagingFee: number;

  deliveryFee: number;


  updatedAt?: unknown;
}


export interface PrintingOrder {

  id: string;

  userId: string;

  customerName: string;

  customerEmail: string;


  originalFileName: string;

  storagePath: string;


  material: PrintingMaterial;

  finish: PrintingFinish;

  quantity: number;


  dimensions: PrintingModelDimensions;


  volumeCm3?: number;


  estimatedWeightGrams?: number;

  estimatedPrintTimeMinutes?: number;


  estimate?: PrintingEstimate;


  estimatedPrice: number;

  finalPrice?: number;


  status: PrintingOrderStatus;


  paymentStatus:
    | "unpaid"
    | "pending"
    | "paid"
    | "failed"
    | "refunded";


  adminNotes?: string;

  customerNotes?: string;


  createdAt?: unknown;

  updatedAt?: unknown;
}