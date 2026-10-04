import {
  auth,
} from "../firebase/config";

import {
  supabase,
} from "../lib/supabase";

import type {
  CustomProject,
  CustomProjectMessage,
  CreateCustomProjectData,
  CreateCustomProjectMessageData,
  UpdateCustomProjectData,
} from "../types/customProject";


/*
 * ==========================================================
 * TABLES
 * ==========================================================
 */

const PROJECTS_TABLE =
  "custom_projects";

const MESSAGES_TABLE =
  "custom_project_messages";

const ACTIVITIES_TABLE =
  "custom_project_activities";


/*
 * ==========================================================
 * DATABASE ROW TYPES
 * ==========================================================
 */

interface ProjectRow {
  id: string;

  project_number: string;

  user_id: string;

  customer_name: string;

  customer_email: string;

  customer_phone: string;

  project_type:
    | "website"
    | "custom-devices";

  title: string;

  description: string;

  requirements: string | null;

  budget:
    number |
    string |
    null;

  budget_label: string | null;

  timeline: string | null;

  status: string;

  quotation_status: string;

  payment_status: string;

  quoted_amount:
    number |
    string |
    null;

  paid_amount:
    number |
    string |
    null;

  currency: string;

  active_quotation_id: string | null;

  last_message: string | null;

  last_message_by:
    | "customer"
    | "admin"
    | null;

  last_message_at: string | null;

  file_count: number | null;

  estimated_delivery_date:
    string | null;

  completed_at:
    string | null;

  created_at: string;

  updated_at: string;
}


interface MessageRow {
  id: string;

  project_id: string;

  sender_id: string;

  sender_type:
    | "customer"
    | "admin";

  sender_name: string;

  sender_email: string | null;

  message: string;

  attachments: unknown;

  created_at: string;

  updated_at: string;
}


/*
 * ==========================================================
 * COLUMNS
 * ==========================================================
 */

const PROJECT_COLUMNS = `
  id,
  project_number,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  project_type,
  title,
  description,
  requirements,
  budget,
  budget_label,
  timeline,
  status,
  quotation_status,
  payment_status,
  quoted_amount,
  paid_amount,
  currency,
  active_quotation_id,
  last_message,
  last_message_by,
  last_message_at,
  file_count,
  estimated_delivery_date,
  completed_at,
  created_at,
  updated_at
`;


const MESSAGE_COLUMNS = `
  id,
  project_id,
  sender_id,
  sender_type,
  sender_name,
  sender_email,
  message,
  attachments,
  created_at,
  updated_at
`;


/*
 * ==========================================================
 * BASIC HELPERS
 * ==========================================================
 */

function cleanString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function optionalString(
  value: unknown,
): string | undefined {
  const valueString =
    cleanString(
      value,
    );

  return valueString ||
    undefined;
}


function optionalNumber(
  value: unknown,
): number | undefined {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return undefined;
  }


  const parsed =
    typeof value ===
      "number"
      ? value
      : Number(
          value,
        );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : undefined;
}


function normalizeProjectStatus(
  value: unknown,
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
  value: unknown,
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
  value: unknown,
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


function normalizeSenderType(
  value: unknown,
): "customer" | "admin" {
  return value ===
    "admin"
    ? "admin"
    : "customer";
}


/*
 * ==========================================================
 * PROJECT NORMALIZER
 * ==========================================================
 */

function normalizeProject(
  row: ProjectRow,
): CustomProject {
  const lastMessageBy =
    row.last_message_by ===
      "admin" ||
    row.last_message_by ===
      "customer"
      ? row.last_message_by
      : undefined;


  return {
    id:
      row.id,

    projectNumber:
      cleanString(
        row.project_number,
      ) ||
      `CS-${row.id
        .slice(
          0,
          8,
        )
        .toUpperCase()}`,

    userId:
      cleanString(
        row.user_id,
      ),

    customerName:
      cleanString(
        row.customer_name,
      ) ||
      "Customer",

    customerEmail:
      cleanString(
        row.customer_email,
      ),

    customerPhone:
      cleanString(
        row.customer_phone,
      ),

    projectType:
      row.project_type ===
      "custom-devices"
        ? "custom-devices"
        : "website",

    title:
      cleanString(
        row.title,
      ) ||
      "Untitled Project",

    description:
      cleanString(
        row.description,
      ),

    requirements:
      optionalString(
        row.requirements,
      ),

    budget:
      optionalNumber(
        row.budget,
      ),

    budgetLabel:
      optionalString(
        row.budget_label,
      ),

    timeline:
      optionalString(
        row.timeline,
      ),

    status:
      normalizeProjectStatus(
        row.status,
      ),

    quotationStatus:
      normalizeQuotationStatus(
        row.quotation_status,
      ),

    paymentStatus:
      normalizePaymentStatus(
        row.payment_status,
      ),

    quotedAmount:
      optionalNumber(
        row.quoted_amount,
      ),

    paidAmount:
      optionalNumber(
        row.paid_amount,
      ),

    currency:
      cleanString(
        row.currency,
      ) ||
      "INR",

    activeQuotationId:
      optionalString(
        row.active_quotation_id,
      ),

    lastMessage:
      optionalString(
        row.last_message,
      ),

    lastMessageBy:

      lastMessageBy,

    lastMessageAt:
      row.last_message_at,

    fileCount:
      typeof row.file_count ===
        "number" &&
      Number.isFinite(
        row.file_count,
      )
        ? row.file_count
        : 0,

    estimatedDeliveryDate:
      optionalString(
        row.estimated_delivery_date,
      ),

    completedAt:
      row.completed_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * MESSAGE NORMALIZER
 * ==========================================================
 */

function normalizeMessage(
  row: MessageRow,
): CustomProjectMessage {
  const senderType =
    normalizeSenderType(
      row.sender_type,
    );


  const attachments =
    Array.isArray(
      row.attachments,
    )
      ? row.attachments
      : [];


  return {
    id:
      row.id,

    projectId:
      cleanString(
        row.project_id,
      ),

    senderId:
      cleanString(
        row.sender_id,
      ),

    senderType,

    senderName:
      cleanString(
        row.sender_name,
      ) ||
      (
        senderType ===
        "admin"
          ? "Nexletronics"
          : "Customer"
      ),

    senderEmail:
      optionalString(
        row.sender_email,
      ),

    message:
      cleanString(
        row.message,
      ),

    attachments:
      attachments as CustomProjectMessage["attachments"],

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
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


  return `CS-${year}${month}${day}-${random}`;
}


/*
 * ==========================================================
 * REQUIRE CURRENT FIREBASE USER
 * ==========================================================
 */

function requireCurrentUser() {
  const user =
    auth.currentUser;


  if (
    !user
  ) {
    throw new Error(
      "You must be signed in to continue.",
    );
  }


  return user;
}


/*
 * ==========================================================
 * CREATE ACTIVITY
 * ==========================================================
 */

async function createProjectActivity(
  projectId: string,
  actorId: string,
  actorType:
    | "customer"
    | "admin",
  type: string,
  description: string,
): Promise<void> {
  try {
    const {
      error,
    } =
      await supabase
        .from(
          ACTIVITIES_TABLE,
        )
        .insert({
          project_id:
            projectId,

          type,

          description,

          actor_id:
            actorId,

          actor_type:
            actorType,

          created_at:
            new Date().toISOString(),
        });


    if (
      error
    ) {
      throw error;
    }
  } catch (
    error
  ) {
    /*
     * Activity logging is best-effort.
     */

    console.warn(
      "Custom project activity could not be created:",
      error,
    );
  }
}


/*
 * ==========================================================
 * CREATE CUSTOM PROJECT
 * ==========================================================
 */

export async function createCustomProject(
  data:
    CreateCustomProjectData,
): Promise<string> {
  const user =
    requireCurrentUser();


  const userId =
    cleanString(
      data.userId,
    );


  if (
    userId !==
    user.uid
  ) {
    throw new Error(
      "Project user does not match the signed-in account.",
    );
  }


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


  const projectId =
    crypto.randomUUID();


  const requirements =
    optionalString(
      data.requirements,
    );


  const budget =
    optionalNumber(
      data.budget,
    );


  const budgetLabel =
    optionalString(
      data.budgetLabel,
    );


  const timeline =
    optionalString(
      data.timeline,
    );


  const currency =
    cleanString(
      data.currency,
    ) ||
    "INR";


  const {
    error,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .insert({
        id:
          projectId,

        project_number:
          createProjectNumber(),

        user_id:
          userId,

        customer_name:
          customerName,

        customer_email:
          customerEmail,

        customer_phone:
          customerPhone,

        project_type:
          data.projectType,

        title,

        description,

        requirements:
          requirements ??
          null,

        budget:
          budget ??
          null,

        budget_label:
          budgetLabel ??
          null,

        timeline:
          timeline ??
          null,

        status:
          "new",

        quotation_status:
          "draft",

        payment_status:
          "not_required",

        currency,

        file_count:
          0,

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });


  if (
    error
  ) {
    throw error;
  }


  await createProjectActivity(
    projectId,
    userId,
    "customer",
    "created",
    "Custom project created.",
  );


  return projectId;
}


/*
 * ==========================================================
 * GET CUSTOM PROJECT
 * ==========================================================
 */

export async function getCustomProject(
  projectId: string,
): Promise<CustomProject | null> {
  const cleanProjectId =
    cleanString(
      projectId,
    );


  if (
    !cleanProjectId
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .select(
        PROJECT_COLUMNS,
      )
      .eq(
        "id",
        cleanProjectId,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  if (
    !data
  ) {
    return null;
  }


  return normalizeProject(
    data as ProjectRow,
  );
}


/*
 * ==========================================================
 * REALTIME SINGLE PROJECT
 * ==========================================================
 */

export function subscribeCustomProject(
  projectId: string,
  callback: (
    project:
      CustomProject |
      null,
  ) => void,
  onError?: (
    error: Error,
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
      // No subscription.
    };
  }


  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadProject() {
    try {
      const project =
        await getCustomProject(
          cleanProjectId,
        );


      if (
        !stopped
      ) {
        callback(
          project,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load custom project.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadProject();


  channel =
    supabase
      .channel(
        `custom-project-${cleanProjectId}-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            PROJECTS_TABLE,

          filter:
            `id=eq.${cleanProjectId}`,
        },
        () => {
          void loadProject();
        },
      )
      .subscribe(
        (
          status,
        ) => {
          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              new Error(
                "Unable to connect to the custom project database.",
              ),
            );
          }
        },
      );


  return () => {
    stopped =
      true;


    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
}


/*
 * ==========================================================
 * GET ALL CUSTOM PROJECTS
 * ==========================================================
 */

export function subscribeCustomerCustomProjects(
  userId: string,
  callback: (
    projects: CustomProject[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  const user = requireCurrentUser();
  const cleanUserId = cleanString(userId);

  if (!cleanUserId || cleanUserId !== user.uid) {
    const error = new Error(
      "Project user does not match the signed-in account.",
    );
    onError?.(error);
    callback([]);
    return () => {
      // No subscription.
    };
  }

  let stopped = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  async function loadProjects() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from(PROJECTS_TABLE)
        .select(PROJECT_COLUMNS)
        .eq("user_id", cleanUserId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const projects = (data ?? [])
        .map((row) => normalizeProject(row as ProjectRow));

      if (!stopped) {
        callback(projects);
      }
    } catch (error) {
      if (!stopped) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load your previous projects.",
              );
        onError?.(normalized);
      }
    }
  }

  void loadProjects();

  channel = supabase
    .channel(`custom-projects-user-${cleanUserId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: PROJECTS_TABLE,
        filter: `user_id=eq.${cleanUserId}`,
      },
      () => {
        void loadProjects();
      },
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(
          new Error(
            "Unable to connect to the custom project database.",
          ),
        );
      }
    });

  return () => {
    stopped = true;

    if (channel) {
      void supabase.removeChannel(channel);
    }
  };
}


/*
 * ==========================================================
 * GET ALL CUSTOM PROJECTS
 * ==========================================================
 */

export async function getCustomProjects():
  Promise<CustomProject[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .select(
        PROJECT_COLUMNS,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  return (
    (data ?? []) as ProjectRow[]
  ).map(
    normalizeProject,
  );
}


/*
 * ==========================================================
 * REALTIME ALL PROJECTS
 * ==========================================================
 */

export function subscribeCustomProjects(
  callback: (
    projects: CustomProject[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadProjects() {
    try {
      const projects =
        await getCustomProjects();


      if (
        !stopped
      ) {
        callback(
          projects,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load custom projects.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadProjects();


  channel =
    supabase
      .channel(
        `custom-projects-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            PROJECTS_TABLE,
        },
        () => {
          void loadProjects();
        },
      )
      .subscribe(
        (
          status,
        ) => {
          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              new Error(
                "Unable to connect to the custom projects database.",
              ),
            );
          }
        },
      );


  return () => {
    stopped =
      true;


    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
}


/*
 * ==========================================================
 * UPDATE CUSTOM PROJECT
 * ==========================================================
 */

export async function updateCustomProject(
  projectId: string,
  data:
    UpdateCustomProjectData,
): Promise<void> {
  const user =
    requireCurrentUser();


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


  const updates:
    Record<
      string,
      unknown
    > = {};


  if (
    data.title !==
    undefined
  ) {
    updates.title =
      cleanString(
        data.title,
      );
  }


  if (
    data.description !==
    undefined
  ) {
    updates.description =
      cleanString(
        data.description,
      );
  }


  if (
    data.requirements !==
    undefined
  ) {
    updates.requirements =
      cleanString(
        data.requirements,
      );
  }


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


    updates.budget =
      budget;
  }


  if (
    data.budgetLabel !==
    undefined
  ) {
    updates.budget_label =
      cleanString(
        data.budgetLabel,
      );
  }


  if (
    data.timeline !==
    undefined
  ) {
    updates.timeline =
      cleanString(
        data.timeline,
      );
  }


  if (
    data.customerName !==
    undefined
  ) {
    updates.customer_name =
      cleanString(
        data.customerName,
      );
  }


  if (
    data.customerEmail !==
    undefined
  ) {
    updates.customer_email =
      cleanString(
        data.customerEmail,
      ).toLowerCase();
  }


  if (
    data.customerPhone !==
    undefined
  ) {
    updates.customer_phone =
      cleanString(
        data.customerPhone,
      );
  }


  if (
    data.estimatedDeliveryDate !==
    undefined
  ) {
    updates.estimated_delivery_date =
      cleanString(
        data.estimatedDeliveryDate,
      );
  }


  if (
    data.status !==
    undefined
  ) {
    updates.status =
      data.status;


    if (
      data.status ===
      "completed"
    ) {
      updates.completed_at =
        new Date().toISOString();
    }
  }


  if (
    data.quotationStatus !==
    undefined
  ) {
    updates.quotation_status =
      data.quotationStatus;
  }


  if (
    data.paymentStatus !==
    undefined
  ) {
    updates.payment_status =
      data.paymentStatus;
  }


  if (
    Object.keys(
      updates,
    ).length ===
    0
  ) {
    return;
  }


  updates.updated_at =
    new Date().toISOString();


  const {
    error,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .update(
        updates,
      )
      .eq(
        "id",
        cleanProjectId,
      );


  if (
    error
  ) {
    throw error;
  }


  /*
   * Record status changes.
   */

  if (
    data.status !==
    undefined
  ) {
    let actorType:
      | "customer"
      | "admin" =
      "customer";


    try {
      const tokenResult =
        await user.getIdTokenResult(
          false,
        );


      actorType =
        tokenResult.claims.is_admin ===
        true
          ? "admin"
          : "customer";
    } catch {
      actorType =
        "customer";
    }


    await createProjectActivity(
      cleanProjectId,
      user.uid,
      actorType,
      "status_changed",
      `Project status changed to ${data.status}.`,
    );
  }
}


/*
 * ==========================================================
 * STATUS HELPERS
 * ==========================================================
 */

export async function setCustomProjectStatus(
  projectId: string,
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


export async function setCustomProjectQuotationStatus(
  projectId: string,
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


export async function setCustomProjectPaymentStatus(
  projectId: string,
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
  const user =
    requireCurrentUser();


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
    senderId !==
    user.uid
  ) {
    throw new Error(
      "Message sender does not match the signed-in account.",
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


  let senderType:
    | "customer"
    | "admin";


  try {
    const tokenResult =
      await user.getIdTokenResult(
        false,
      );


    senderType =
      data.senderType ===
        "admin" &&
      tokenResult.claims.is_admin ===
        true
        ? "admin"
        : "customer";
  } catch {
    senderType =
      "customer";
  }


  const messageId =
    crypto.randomUUID();


  const senderEmail =
    optionalString(
      data.senderEmail,
    );


  const {
    error,
  } =
    await supabase
      .from(
        MESSAGES_TABLE,
      )
      .insert({
        id:
          messageId,

        project_id:
          projectId,

        sender_id:
          senderId,

        sender_type:
          senderType,

        sender_name:
          senderName,

        sender_email:
          senderEmail
            ?.toLowerCase() ??
          null,

        message,

        attachments:
          [],

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });


  if (
    error
  ) {
    throw error;
  }


  /*
   * Update project last-message preview.
   */

  const {
    error:
      projectError,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .update({
        last_message:
          message,

        last_message_by:
          senderType,

        last_message_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        projectId,
      );


  if (
    projectError
  ) {
    console.warn(
      "Project preview could not be updated:",
      projectError,
    );
  }


  await createProjectActivity(
    projectId,
    senderId,
    senderType,
    "message",
    "A project message was added.",
  );


  return messageId;
}


/*
 * ==========================================================
 * COMPATIBILITY EXPORT
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
 * GET PROJECT MESSAGES
 * ==========================================================
 */

async function getProjectMessages(
  projectId: string,
): Promise<CustomProjectMessage[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        MESSAGES_TABLE,
      )
      .select(
        MESSAGE_COLUMNS,
      )
      .eq(
        "project_id",
        projectId,
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  return (
    (data ?? []) as MessageRow[]
  ).map(
    normalizeMessage,
  );
}


/*
 * ==========================================================
 * REALTIME PROJECT MESSAGES
 * ==========================================================
 */

export function subscribeCustomProjectMessages(
  projectId: string,
  callback: (
    messages:
      CustomProjectMessage[],
  ) => void,
  onError?: (
    error: Error,
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
      // No subscription.
    };
  }


  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadMessages() {
    try {
      const messages =
        await getProjectMessages(
          cleanProjectId,
        );


      if (
        !stopped
      ) {
        callback(
          messages,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load project messages.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadMessages();


  channel =
    supabase
      .channel(
        `custom-project-messages-${cleanProjectId}-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            MESSAGES_TABLE,

          filter:
            `project_id=eq.${cleanProjectId}`,
        },
        () => {
          void loadMessages();
        },
      )
      .subscribe(
        (
          status,
        ) => {
          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              new Error(
                "Unable to connect to the project messages database.",
              ),
            );
          }
        },
      );


  return () => {
    stopped =
      true;


    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
}


/*
 * ==========================================================
 * COMPATIBILITY SUBSCRIPTION
 * ==========================================================
 */

export function subscribeCustomProjectMessage(
  projectId: string,
  callback: (
    messages:
      CustomProjectMessage[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  return subscribeCustomProjectMessages(
    projectId,
    callback,
    onError,
  );
}