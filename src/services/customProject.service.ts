import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  CustomProject,
  CustomProjectMessage,
  CreateCustomProjectData,
  CreateCustomProjectMessageData,
  UpdateCustomProjectData,
} from "../types/customProject";


/*
 * ==========================================================
 * COLLECTION NAMES
 * ==========================================================
 */

const PROJECTS_COLLECTION =
  "customProjects";

const MESSAGES_COLLECTION =
  "customProjectMessages";

const ACTIVITIES_COLLECTION =
  "customProjectActivities";


/*
 * ==========================================================
 * BASIC HELPERS
 * ==========================================================
 */

function cleanString(
  value:
    unknown,
): string {

  if (
    typeof value !==
    "string"
  ) {

    return "";
  }


  return value.trim();
}


function optionalString(
  value:
    unknown,
): string |
  undefined {

  const cleaned =
    cleanString(
      value,
    );


  return cleaned
    ? cleaned
    : undefined;
}


function optionalNumber(
  value:
    unknown,
): number |
  undefined {

  if (
    typeof value !==
    "number"
  ) {

    return undefined;
  }


  if (
    !Number.isFinite(
      value,
    )
  ) {

    return undefined;
  }


  return value;
}


/*
 * ==========================================================
 * STATUS NORMALIZERS
 * ==========================================================
 */

function normalizeProjectStatus(
  value:
    unknown,
): CustomProject["status"] {

  switch (
    value
  ) {

    case "new":
    case "discussion":
    case "quotation_sent":
    case "quotation_accepted":
    case "payment_pending":
    case "confirmed":
    case "in_development":
    case "review":
    case "completed":
    case "cancelled":

      return value;

    default:

      return "new";
  }
}


function normalizeQuotationStatus(
  value:
    unknown,
): CustomProject["quotationStatus"] {

  switch (
    value
  ) {

    case "draft":
    case "sent":
    case "accepted":
    case "rejected":
    case "expired":
    case "cancelled":

      return value;

    default:

      return "draft";
  }
}


function normalizePaymentStatus(
  value:
    unknown,
): CustomProject["paymentStatus"] {

  switch (
    value
  ) {

    case "not_required":
    case "pending":
    case "processing":
    case "paid":
    case "failed":
    case "refunded":

      return value;

    default:

      return "not_required";
  }
}


/*
 * ==========================================================
 * PROJECT NORMALIZER
 * ==========================================================
 */

function normalizeProject(
  id:
    string,

  data:
    Record<
      string,
      unknown
    >,
): CustomProject {

  const projectType =
    data.projectType ===
    "custom-devices"
      ? "custom-devices"
      : "website";


  const lastMessageBy =
    data.lastMessageBy ===
      "admin" ||
    data.lastMessageBy ===
      "customer"
      ? data.lastMessageBy
      : undefined;


  return {

    id,

    projectNumber:
      cleanString(
        data.projectNumber,
      ) ||
      `CS-${id
        .slice(
          0,
          8,
        )
        .toUpperCase()}`,

    userId:
      cleanString(
        data.userId,
      ),

    customerName:
      cleanString(
        data.customerName,
      ) ||
      "Customer",

    customerEmail:
      cleanString(
        data.customerEmail,
      ),

    customerPhone:
      cleanString(
        data.customerPhone,
      ),

    projectType,

    title:
      cleanString(
        data.title,
      ) ||
      "Untitled Project",

    description:
      cleanString(
        data.description,
      ),

    requirements:
      optionalString(
        data.requirements,
      ),

    budget:
      optionalNumber(
        data.budget,
      ),

    budgetLabel:
      optionalString(
        data.budgetLabel,
      ),

    timeline:
      optionalString(
        data.timeline,
      ),

    status:
      normalizeProjectStatus(
        data.status,
      ),

    quotationStatus:
      normalizeQuotationStatus(
        data.quotationStatus,
      ),

    paymentStatus:
      normalizePaymentStatus(
        data.paymentStatus,
      ),

    quotedAmount:
      optionalNumber(
        data.quotedAmount,
      ),

    paidAmount:
      optionalNumber(
        data.paidAmount,
      ),

    currency:
      cleanString(
        data.currency,
      ) ||
      "INR",

    activeQuotationId:
      optionalString(
        data.activeQuotationId,
      ),

    lastMessage:
      optionalString(
        data.lastMessage,
      ),

    lastMessageBy,

    lastMessageAt:
      data.lastMessageAt,

    fileCount:
      typeof data.fileCount ===
        "number" &&
      Number.isFinite(
        data.fileCount,
      )
        ? data.fileCount
        : 0,

    estimatedDeliveryDate:
      optionalString(
        data.estimatedDeliveryDate,
      ),

    completedAt:
      data.completedAt,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,

  };
}


/*
 * ==========================================================
 * MESSAGE NORMALIZER
 * ==========================================================
 */

function normalizeMessage(
  id:
    string,

  data:
    Record<
      string,
      unknown
    >,
): CustomProjectMessage {

  const senderType =
    data.senderType ===
    "admin"
      ? "admin"
      : "customer";


  return {

    id,

    projectId:
      cleanString(
        data.projectId,
      ),

    senderId:
      cleanString(
        data.senderId,
      ),

    senderType,

    senderName:
      cleanString(
        data.senderName,
      ) ||
      (
        senderType ===
        "admin"
          ? "Nexletronics"
          : "Customer"
      ),

    senderEmail:
      optionalString(
        data.senderEmail,
      ),

    message:
      cleanString(
        data.message,
      ),

    attachments:
      Array.isArray(
        data.attachments,
      )
        ? data.attachments as CustomProjectMessage["attachments"]
        : [],

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,

  };
}


/*
 * ==========================================================
 * PROJECT NUMBER
 * ==========================================================
 */

function createProjectNumber(): string {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );


  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      "0",
    );


  const random =
    Math.floor(
      Math.random() *
        9000,
    ) +
    1000;


  return (
    `CS-${year}${month}${day}-${random}`
  );
}


/*
 * ==========================================================
 * CREATE CUSTOM PROJECT
 * ==========================================================
 *
 * IMPORTANT:
 *
 * Firestore does not accept undefined values.
 *
 * Therefore optional values are only added when they
 * actually exist.
 * ==========================================================
 */

export async function createCustomProject(
  data:
    CreateCustomProjectData,
): Promise<string> {

  const userId =
    cleanString(
      data.userId,
    );

  const customerName =
    cleanString(
      data.customerName,
    );

  const customerEmail =
    cleanString(
      data.customerEmail,
    ).toLowerCase();

  const customerPhone =
    cleanString(
      data.customerPhone,
    );

  const title =
    cleanString(
      data.title,
    );

  const description =
    cleanString(
      data.description,
    );


  if (
    !userId
  ) {

    throw new Error(
      "You must be signed in to create a project.",
    );
  }


  if (
    !customerName
  ) {

    throw new Error(
      "Customer name is required.",
    );
  }


  if (
    !customerEmail
  ) {

    throw new Error(
      "Customer email is required.",
    );
  }


  if (
    !customerPhone
  ) {

    throw new Error(
      "Customer phone number is required.",
    );
  }


  if (
    !title
  ) {

    throw new Error(
      "Project title is required.",
    );
  }


  if (
    !description
  ) {

    throw new Error(
      "Project description is required.",
    );
  }


  if (
    data.projectType !==
      "website" &&
    data.projectType !==
      "custom-devices"
  ) {

    throw new Error(
      "Invalid custom project type.",
    );
  }


  const projectData:
    Record<
      string,
      unknown
    > = {

    projectNumber:
      createProjectNumber(),

    userId,

    customerName,

    customerEmail,

    customerPhone,

    projectType:
      data.projectType,

    title,

    description,

    status:
      "new",

    quotationStatus:
      "draft",

    paymentStatus:
      "not_required",

    currency:
      cleanString(
        data.currency,
      ) ||
      "INR",

    fileCount:
      0,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

  };


  /*
   * --------------------------------------------------------
   * OPTIONAL REQUIREMENTS
   * --------------------------------------------------------
   */

  const requirements =
    optionalString(
      data.requirements,
    );


  if (
    requirements !==
    undefined
  ) {

    projectData.requirements =
      requirements;
  }


  /*
   * --------------------------------------------------------
   * OPTIONAL BUDGET
   * --------------------------------------------------------
   *
   * NEVER send:
   *
   * budget: undefined
   *
   * This was the error shown in your screenshot.
   */

  const budget =
    optionalNumber(
      data.budget,
    );


  if (
    budget !==
    undefined
  ) {

    projectData.budget =
      budget;
  }


  /*
   * --------------------------------------------------------
   * OPTIONAL BUDGET LABEL
   * --------------------------------------------------------
   */

  const budgetLabel =
    optionalString(
      data.budgetLabel,
    );


  if (
    budgetLabel !==
    undefined
  ) {

    projectData.budgetLabel =
      budgetLabel;
  }


  /*
   * --------------------------------------------------------
   * OPTIONAL TIMELINE
   * --------------------------------------------------------
   */

  const timeline =
    optionalString(
      data.timeline,
    );


  if (
    timeline !==
    undefined
  ) {

    projectData.timeline =
      timeline;
  }


  /*
   * --------------------------------------------------------
   * FIRESTORE CREATE
   * --------------------------------------------------------
   */

  const projectDocument =
    await addDoc(
      collection(
        db,
        PROJECTS_COLLECTION,
      ),
      projectData,
    );


  /*
   * --------------------------------------------------------
   * ACTIVITY
   * --------------------------------------------------------
   *
   * Best effort only.
   * A failed activity write must not make the project
   * creation appear to have failed.
   */

  try {

    await addDoc(
      collection(
        db,
        ACTIVITIES_COLLECTION,
      ),
      {

        projectId:
          projectDocument.id,

        type:
          "created",

        description:
          "Custom project created.",

        actorId:
          userId,

        actorType:
          "customer",

        createdAt:
          serverTimestamp(),

      },
    );

  } catch (
    activityError
  ) {

    console.warn(
      "Project activity could not be created:",
      activityError,
    );
  }


  return projectDocument.id;
}


/*
 * ==========================================================
 * GET CUSTOM PROJECT
 * ==========================================================
 */

export async function getCustomProject(
  projectId:
    string,
): Promise<
  CustomProject |
  null
> {

  const cleanProjectId =
    cleanString(
      projectId,
    );


  if (
    !cleanProjectId
  ) {

    return null;
  }


  const projectRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      cleanProjectId,
    );


  const snapshot =
    await getDoc(
      projectRef,
    );


  if (
    !snapshot.exists()
  ) {

    return null;
  }


  return normalizeProject(
    snapshot.id,
    snapshot.data(),
  );
}


/*
 * ==========================================================
 * REALTIME PROJECT
 * ==========================================================
 */

export function subscribeCustomProject(
  projectId:
    string,

  callback:
    (
      project:
        CustomProject |
        null,
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  const cleanProjectId =
    cleanString(
      projectId,
    );


  if (
    !cleanProjectId
  ) {

    callback(
      null,
    );


    return () => {
      // No listener to remove.
    };
  }


  return onSnapshot(

    doc(
      db,
      PROJECTS_COLLECTION,
      cleanProjectId,
    ),

    (
      snapshot,
    ) => {

      if (
        !snapshot.exists()
      ) {

        callback(
          null,
        );

        return;
      }


      callback(
        normalizeProject(
          snapshot.id,
          snapshot.data(),
        ),
      );

    },

    (
      listenerError,
    ) => {

      console.error(
        "Custom project realtime listener failed:",
        listenerError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            listenerError.message,
          ),
        );
      }

    },
  );
}


/*
 * ==========================================================
 * GET ALL CUSTOM PROJECTS
 * ==========================================================
 */

export async function getCustomProjects():
  Promise<
    CustomProject[]
  > {

  const projectsQuery =
    query(
      collection(
        db,
        PROJECTS_COLLECTION,
      ),

      orderBy(
        "createdAt",
        "desc",
      ),
    );


  /*
   * Use getDocs lazily imported through the Firebase
   * namespace-free approach below.
   *
   * To keep this service compatible with existing imports,
   * this function uses the realtime listener pattern through
   * a one-shot Promise.
   */

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      let firstSnapshot =
        true;


      const unsubscribe =
        onSnapshot(

          projectsQuery,

          (
            snapshot,
          ) => {

            const projects =
              snapshot.docs.map(
                (
                  document,
                ) =>
                  normalizeProject(
                    document.id,
                    document.data(),
                  ),
              );


            if (
              firstSnapshot
            ) {

              firstSnapshot =
                false;

              resolve(
                projects,
              );

              unsubscribe();

            }

          },

          (
            listenerError,
          ) => {

            unsubscribe();

            reject(
              listenerError,
            );
          },

        );

    },
  );
}


/*
 * ==========================================================
 * REALTIME ALL PROJECTS
 * ==========================================================
 */

export function subscribeCustomProjects(
  callback:
    (
      projects:
        CustomProject[],
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  const projectsQuery =
    query(
      collection(
        db,
        PROJECTS_COLLECTION,
      ),

      orderBy(
        "createdAt",
        "desc",
      ),
    );


  return onSnapshot(

    projectsQuery,

    (
      snapshot,
    ) => {

      const projects =
        snapshot.docs.map(
          (
            document,
          ) =>
            normalizeProject(
              document.id,
              document.data(),
            ),
        );


      callback(
        projects,
      );

    },

    (
      listenerError,
    ) => {

      console.error(
        "Custom projects realtime listener failed:",
        listenerError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            listenerError.message,
          ),
        );
      }

    },
  );
}


/*
 * ==========================================================
 * UPDATE CUSTOM PROJECT
 * ==========================================================
 */

export async function updateCustomProject(
  projectId:
    string,

  data:
    UpdateCustomProjectData,
): Promise<void> {

  const cleanProjectId =
    cleanString(
      projectId,
    );


  if (
    !cleanProjectId
  ) {

    throw new Error(
      "Project ID is required.",
    );
  }


  const payload:
    Record<
      string,
      unknown
    > = {

    updatedAt:
      serverTimestamp(),

  };


  /*
   * Title
   */

  if (
    data.title !==
    undefined
  ) {

    const value =
      cleanString(
        data.title,
      );


    if (
      value
    ) {

      payload.title =
        value;
    }
  }


  /*
   * Description
   */

  if (
    data.description !==
    undefined
  ) {

    payload.description =
      cleanString(
        data.description,
      );
  }


  /*
   * Requirements
   */

  if (
    data.requirements !==
    undefined
  ) {

    payload.requirements =
      cleanString(
        data.requirements,
      );
  }


  /*
   * Budget
   */

  if (
    data.budget !==
    undefined
  ) {

    const budget =
      optionalNumber(
        data.budget,
      );


    if (
      budget ===
      undefined
    ) {

      throw new Error(
        "Budget must be a valid number.",
      );
    }


    payload.budget =
      budget;
  }


  /*
   * Budget label
   */

  if (
    data.budgetLabel !==
    undefined
  ) {

    payload.budgetLabel =
      cleanString(
        data.budgetLabel,
      );
  }


  /*
   * Timeline
   */

  if (
    data.timeline !==
    undefined
  ) {

    payload.timeline =
      cleanString(
        data.timeline,
      );
  }


  /*
   * Customer name
   */

  if (
    data.customerName !==
    undefined
  ) {

    payload.customerName =
      cleanString(
        data.customerName,
      );
  }


  /*
   * Customer email
   */

  if (
    data.customerEmail !==
    undefined
  ) {

    payload.customerEmail =
      cleanString(
        data.customerEmail,
      ).toLowerCase();
  }


  /*
   * Customer phone
   */

  if (
    data.customerPhone !==
    undefined
  ) {

    payload.customerPhone =
      cleanString(
        data.customerPhone,
      );
  }


  /*
   * Delivery date
   */

  if (
    data.estimatedDeliveryDate !==
    undefined
  ) {

    payload.estimatedDeliveryDate =
      cleanString(
        data.estimatedDeliveryDate,
      );
  }


  /*
   * Status
   */

  if (
    data.status !==
    undefined
  ) {

    payload.status =
      data.status;
  }


  /*
   * Quotation status
   */

  if (
    data.quotationStatus !==
    undefined
  ) {

    payload.quotationStatus =
      data.quotationStatus;
  }


  /*
   * Payment status
   */

  if (
    data.paymentStatus !==
    undefined
  ) {

    payload.paymentStatus =
      data.paymentStatus;
  }


  await updateDoc(
    doc(
      db,
      PROJECTS_COLLECTION,
      cleanProjectId,
    ),
    payload,
  );
}


/*
 * ==========================================================
 * PROJECT STATUS
 * ==========================================================
 */

export async function setCustomProjectStatus(
  projectId:
    string,

  status:
    CustomProject["status"],
): Promise<void> {

  await updateCustomProject(
    projectId,

    {
      status,
    },
  );
}


/*
 * ==========================================================
 * QUOTATION STATUS
 * ==========================================================
 */

export async function setCustomProjectQuotationStatus(
  projectId:
    string,

  status:
    CustomProject["quotationStatus"],
): Promise<void> {

  await updateCustomProject(
    projectId,

    {
      quotationStatus:
        status,
    },
  );
}


/*
 * ==========================================================
 * PAYMENT STATUS
 * ==========================================================
 */

export async function setCustomProjectPaymentStatus(
  projectId:
    string,

  status:
    CustomProject["paymentStatus"],
): Promise<void> {

  await updateCustomProject(
    projectId,

    {
      paymentStatus:
        status,
    },
  );
}


/*
 * ==========================================================
 * CREATE PROJECT MESSAGE
 * ==========================================================
 */

export async function createCustomProjectMessage(
  data:
    CreateCustomProjectMessageData,
): Promise<string> {

  const projectId =
    cleanString(
      data.projectId,
    );

  const senderId =
    cleanString(
      data.senderId,
    );

  const senderName =
    cleanString(
      data.senderName,
    );

  const message =
    cleanString(
      data.message,
    );


  if (
    !projectId
  ) {

    throw new Error(
      "Project ID is required.",
    );
  }


  if (
    !senderId
  ) {

    throw new Error(
      "Sender ID is required.",
    );
  }


  if (
    !senderName
  ) {

    throw new Error(
      "Sender name is required.",
    );
  }


  if (
    !message
  ) {

    throw new Error(
      "Message cannot be empty.",
    );
  }


  const messageData:
    Record<
      string,
      unknown
    > = {

    projectId,

    senderId,

    senderType:
      data.senderType ===
        "admin"
        ? "admin"
        : "customer",

    senderName,

    message,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

  };


  const senderEmail =
    optionalString(
      data.senderEmail,
    );


  if (
    senderEmail !==
    undefined
  ) {

    messageData.senderEmail =
      senderEmail.toLowerCase();
  }


  const messageDocument =
    await addDoc(
      collection(
        db,
        MESSAGES_COLLECTION,
      ),
      messageData,
    );


  /*
   * Update project preview fields.
   */

  await updateDoc(
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
    ),
    {

      lastMessage:
        message,

      lastMessageBy:
        data.senderType ===
          "admin"
          ? "admin"
          : "customer",

      lastMessageAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

    },
  );


  /*
   * Activity
   */

  try {

    await addDoc(
      collection(
        db,
        ACTIVITIES_COLLECTION,
      ),
      {

        projectId,

        type:
          "message",

        description:
          "A project message was added.",

        actorId:
          senderId,

        actorType:
          data.senderType ===
            "admin"
            ? "admin"
            : "customer",

        createdAt:
          serverTimestamp(),

      },
    );

  } catch (
    activityError
  ) {

    console.warn(
      "Message activity could not be created:",
      activityError,
    );
  }


  return messageDocument.id;
}


/*
 * ==========================================================
 * SEND CUSTOM PROJECT MESSAGE
 * ==========================================================
 *
 * IMPORTANT:
 *
 * Existing pages in your project already call:
 *
 *   sendCustomProjectMessage(...)
 *
 * Newer code uses:
 *
 *   createCustomProjectMessage(...)
 *
 * Keep BOTH exports so the existing admin and customer
 * CustomProjectDetails pages continue to compile.
 * ==========================================================
 */

export async function sendCustomProjectMessage(
  data:
    CreateCustomProjectMessageData,
): Promise<string> {

  return createCustomProjectMessage(
    data,
  );
}


/*
 * ==========================================================
 * REALTIME PROJECT MESSAGES
 * ==========================================================
 */

export function subscribeCustomProjectMessages(
  projectId:
    string,

  callback:
    (
      messages:
        CustomProjectMessage[],
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  const cleanProjectId =
    cleanString(
      projectId,
    );


  if (
    !cleanProjectId
  ) {

    callback(
      [],
    );


    return () => {
      // No listener to remove.
    };
  }


  const messagesQuery =
    query(
      collection(
        db,
        MESSAGES_COLLECTION,
      ),

      orderBy(
        "createdAt",
        "asc",
      ),
    );


  return onSnapshot(

    messagesQuery,

    (
      snapshot,
    ) => {

      const messages =
        snapshot.docs
          .map(
            (
              document,
            ) =>
              normalizeMessage(
                document.id,
                document.data(),
              ),
          )
          .filter(
            (
              message,
            ) =>
              message.projectId ===
              cleanProjectId,
          );


      callback(
        messages,
      );

    },

    (
      listenerError,
    ) => {

      console.error(
        "Custom project message listener failed:",
        listenerError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            listenerError.message,
          ),
        );
      }

    },
  );
}


/*
 * ==========================================================
 * PROJECT MESSAGE COMPATIBILITY SUBSCRIPTION
 * ==========================================================
 *
 * Some older pages may use this name.
 * ==========================================================
 */

export function subscribeCustomProjectMessage(
  projectId:
    string,

  callback:
    (
      messages:
        CustomProjectMessage[],
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  return subscribeCustomProjectMessages(
    projectId,
    callback,
    onError,
  );
}