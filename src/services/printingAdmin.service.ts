import {
  getAllPrintingOrders,
  updatePrintingOrder,
} from "./printing.service";

import type {
  PrintingFinish,
  PrintingMaterial,
  PrintingOrder,
  PrintingOrderStatus,
} from "../types/printing";

export async function getPrintingOrders(): Promise<PrintingOrder[]> {
  return getAllPrintingOrders();
}

export async function updatePrintingQuote(
  orderId: string,
  values: {
    material: PrintingMaterial;
    finish: PrintingFinish;
    finalPrice: number;
    adminNotes: string;
  },
): Promise<void> {
  if (!orderId.trim()) {
    throw new Error("Printing order ID is required.");
  }

  if (!Number.isFinite(values.finalPrice) || values.finalPrice < 0) {
    throw new Error("Enter a valid final price.");
  }

  await updatePrintingOrder(orderId, {
    material: values.material,
    finish: values.finish,
    finalPrice: Math.ceil(values.finalPrice),
    adminNotes: values.adminNotes.trim(),
    status: "quoted",
    paymentStatus: "unpaid",
  });
}

export async function updatePrintingStatus(
  orderId: string,
  status: PrintingOrderStatus,
): Promise<void> {
  if (!orderId.trim()) {
    throw new Error("Printing order ID is required.");
  }

  await updatePrintingOrder(orderId, { status });
}
