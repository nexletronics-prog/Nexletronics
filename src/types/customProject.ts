/*
 * ==========================================================
 * CUSTOM SOLUTIONS TYPES
 * ==========================================================
 *
 * Nexletronics Custom Solutions
 *
 * Supported project types:
 *
 * 1. Custom Website
 * 2. Custom devices
 */


/*
 * ==========================================================
 * PROJECT TYPE
 * ==========================================================
 */

export type CustomProjectType =
  | "website"
  | "custom-devices";


/*
 * ==========================================================
 * PROJECT STATUS
 * ==========================================================
 */

export type CustomProjectStatus =
  | "new"
  | "discussion"
  | "quotation_sent"
  | "quotation_accepted"
  | "payment_pending"
  | "confirmed"
  | "in_development"
  | "review"
  | "completed"
  | "cancelled";


/*
 * ==========================================================
 * QUOTATION STATUS
 * ==========================================================
 */

export type CustomQuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";


/*
 * ==========================================================
 * PAYMENT STATUS
 * ==========================================================
 */

export type CustomPaymentStatus =
  | "not_required"
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded";


/*
 * ==========================================================
 * MESSAGE SENDER
 * ==========================================================
 */

export type CustomMessageSender =
  | "customer"
  | "admin";


/*
 * ==========================================================
 * PORTFOLIO CATEGORY
 * ==========================================================
 */

export type CustomPortfolioCategory =
  | "website"
  | "devices";


/*
 * ==========================================================
 * PROJECT FILE
 * ==========================================================
 */

export interface CustomProjectFile {

  id:
    string;

  name:
    string;

  url:
    string;

  path?:
    string;

  mimeType?:
    string;

  size?:
    number;

  uploadedBy:
    CustomMessageSender;

  createdAt:
    unknown;
}


/*
 * ==========================================================
 * CUSTOM PROJECT
 * ==========================================================
 */

export interface CustomProject {

  id:
    string;

  projectNumber:
    string;

  userId:
    string;

  customerName:
    string;

  customerEmail:
    string;

  customerPhone:
    string;

  projectType:
    CustomProjectType;

  title:
    string;

  description:
    string;

  requirements?:
    string;

  budget?:
    number;

  budgetLabel?:
    string;

  timeline?:
    string;

  status:
    CustomProjectStatus;

  quotationStatus:
    CustomQuotationStatus;

  paymentStatus:
    CustomPaymentStatus;

  quotedAmount?:
    number;

  paidAmount?:
    number;

  currency:
    string;

  activeQuotationId?:
    string;

  lastMessage?:
    string;

  lastMessageBy?:
    CustomMessageSender;

  lastMessageAt?:
    unknown;

  fileCount?:
    number;

  estimatedDeliveryDate?:
    string;

  completedAt?:
    unknown;

  createdAt:
    unknown;

  updatedAt:
    unknown;
}


/*
 * ==========================================================
 * CREATE PROJECT
 * ==========================================================
 */

export interface CreateCustomProjectData {

  userId:
    string;

  customerName:
    string;

  customerEmail:
    string;

  customerPhone:
    string;

  projectType:
    CustomProjectType;

  title:
    string;

  description:
    string;

  requirements?:
    string;

  budget?:
    number;

  budgetLabel?:
    string;

  timeline?:
    string;

  currency?:
    string;
}


/*
 * ==========================================================
 * UPDATE PROJECT
 * ==========================================================
 */

export interface UpdateCustomProjectData {

  title?:
    string;

  description?:
    string;

  requirements?:
    string;

  budget?:
    number;

  budgetLabel?:
    string;

  timeline?:
    string;

  customerName?:
    string;

  customerEmail?:
    string;

  customerPhone?:
    string;

  estimatedDeliveryDate?:
    string;

  status?:
    CustomProjectStatus;

  quotationStatus?:
    CustomQuotationStatus;

  paymentStatus?:
    CustomPaymentStatus;
}


/*
 * ==========================================================
 * PROJECT MESSAGE
 * ==========================================================
 */

export interface CustomProjectMessage {

  id:
    string;

  projectId:
    string;

  senderId:
    string;

  senderType:
    CustomMessageSender;

  senderName:
    string;

  senderEmail?:
    string;

  message:
    string;

  attachments?:
    CustomProjectFile[];

  createdAt:
    unknown;

  updatedAt?:
    unknown;
}


/*
 * ==========================================================
 * CREATE MESSAGE
 * ==========================================================
 */

export interface CreateCustomProjectMessageData {

  projectId:
    string;

  senderId:
    string;

  senderType:
    CustomMessageSender;

  senderName:
    string;

  senderEmail?:
    string;

  message:
    string;
}


/*
 * ==========================================================
 * QUOTATION ITEM
 * ==========================================================
 */

export interface CustomQuotationItem {

  id:
    string;

  description:
    string;

  quantity:
    number;

  unitPrice:
    number;

  total:
    number;
}


/*
 * ==========================================================
 * QUOTATION
 * ==========================================================
 */

export interface CustomQuotation {

  id:
    string;

  quotationNumber:
    string;

  projectId:
    string;

  customerName:
    string;

  customerEmail:
    string;

  projectTitle:
    string;

  items:
    CustomQuotationItem[];

  subtotal:
    number;

  discount:
    number;

  taxRate:
    number;

  taxAmount:
    number;

  total:
    number;

  currency:
    string;

  validityDays:
    number;

  validUntil?:
    string;

  estimatedDelivery:
    string;

  paymentTerms?:
    string;

  notes?:
    string;

  status:
    CustomQuotationStatus;

  acceptedAt?:
    unknown;

  acceptedBy?:
    string;

  rejectionReason?:
    string;

  paymentRequired:
    boolean;

  paymentStatus:
    CustomPaymentStatus;

  paidAt?:
    unknown;

  paymentId?:
    string;

  razorpayOrderId?:
    string;

  createdBy:
    string;

  createdAt:
    unknown;

  updatedAt:
    unknown;
}


/*
 * ==========================================================
 * CREATE QUOTATION
 * ==========================================================
 */

export interface CreateCustomQuotationData {

  projectId:
    string;

  customerName:
    string;

  customerEmail:
    string;

  projectTitle:
    string;

  items:
    CustomQuotationItem[];

  discount?:
    number;

  taxRate?:
    number;

  currency?:
    string;

  validityDays:
    number;

  estimatedDelivery:
    string;

  paymentTerms?:
    string;

  notes?:
    string;

  paymentRequired?:
    boolean;

  createdBy:
    string;
}


/*
 * ==========================================================
 * PORTFOLIO ITEM
 * ==========================================================
 */

export interface CustomPortfolioItem {

  id:
    string;

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

  gallery:
    string[];

  technologies:
    string[];

  clientIndustry?:
    string;

  liveUrl?:
    string;

  featured:
    boolean;

  published:
    boolean;

  sortOrder:
    number;

  createdAt:
    unknown;

  updatedAt:
    unknown;
}


/*
 * ==========================================================
 * CREATE PORTFOLIO
 * ==========================================================
 */

export interface CreateCustomPortfolioData {

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

  gallery?:
    string[];

  technologies?:
    string[];

  clientIndustry?:
    string;

  liveUrl?:
    string;

  featured?:
    boolean;

  published?:
    boolean;

  sortOrder?:
    number;
}


/*
 * ==========================================================
 * UPDATE PORTFOLIO
 * ==========================================================
 */

export interface UpdateCustomPortfolioData {

  title?:
    string;

  slug?:
    string;

  category?:
    CustomPortfolioCategory;

  shortDescription?:
    string;

  description?:
    string;

  coverImage?:
    string;

  gallery?:
    string[];

  technologies?:
    string[];

  clientIndustry?:
    string;

  liveUrl?:
    string;

  featured?:
    boolean;

  published?:
    boolean;

  sortOrder?:
    number;
}


/*
 * ==========================================================
 * PROJECT FILTER
 * ==========================================================
 */

export interface CustomProjectFilter {

  status?:
    CustomProjectStatus;

  projectType?:
    CustomProjectType;

  quotationStatus?:
    CustomQuotationStatus;

  paymentStatus?:
    CustomPaymentStatus;

  userId?:
    string;

  search?:
    string;
}


/*
 * ==========================================================
 * PROJECT SUMMARY
 * ==========================================================
 */

export interface CustomProjectSummary {

  total:
    number;

  newProjects:
    number;

  discussions:
    number;

  quotationsSent:
    number;

  awaitingPayment:
    number;

  confirmed:
    number;

  inDevelopment:
    number;

  review:
    number;

  completed:
    number;

  cancelled:
    number;

  totalQuotedValue:
    number;

  totalPaidValue:
    number;
}


/*
 * ==========================================================
 * PAYMENT
 * ==========================================================
 */

export interface CustomPayment {

  id:
    string;

  projectId:
    string;

  quotationId:
    string;

  userId:
    string;

  amount:
    number;

  currency:
    string;

  status:
    CustomPaymentStatus;

  provider:
    "razorpay";

  providerOrderId?:
    string;

  providerPaymentId?:
    string;

  providerSignature?:
    string;

  createdAt:
    unknown;

  paidAt?:
    unknown;

  updatedAt?:
    unknown;
}


/*
 * ==========================================================
 * ACTIVITY
 * ==========================================================
 */

export type CustomProjectActivityType =
  | "created"
  | "message"
  | "file_uploaded"
  | "quotation_created"
  | "quotation_sent"
  | "quotation_accepted"
  | "quotation_rejected"
  | "payment_started"
  | "payment_completed"
  | "status_changed"
  | "completed";


export interface CustomProjectActivity {

  id:
    string;

  projectId:
    string;

  type:
    CustomProjectActivityType;

  description:
    string;

  actorId:
    string;

  actorType:
    CustomMessageSender;

  createdAt:
    unknown;
}