import type { Task } from "@/type/task";

export interface ConfidenceFactor {
  label: string;
  contribution: number;
  matched: boolean;
  explanation: string;
}

export interface AnalysisResult {
  classification:
    | "RFI"
    | "Change Order Review"
    | "Both"
    | "Neither";

  confidence: number;
  reasoning: string;

  rfiRecommended: boolean;
  changeOrderRisk: boolean;

  costRisk: "Low" | "Medium" | "High";
  scheduleRisk: "Low" | "Medium" | "High";

  suggestedRfiQuestion: string | null;

  missingInformation: string[];
  requiredDocumentation: string[];
  recommendedActions: string[];

  confidenceBreakdown: ConfidenceFactor[];
}

export function analyzeTask(task: Task): AnalysisResult {
  const description = normalize(task.description);
  const taskGroup = normalize(task.taskGroup);
  const type = normalize(task.type);
  const priority = normalize(task.priority);
  const cause = normalize(task.cause);
  const location = normalize(task.location);
  const status = normalize(task.status);

  const combinedText = [
    description,
    taskGroup,
    type,
    priority,
    cause,
    location,
    status,
  ]
    .filter(Boolean)
    .join(" ");

  const rfiKeywords = [
    "unclear",
    "clarification",
    "confirm",
    "conflict",
    "drawing",
    "design",
    "detail",
    "dimension",
    "specification",
    "missing information",
    "not shown",
    "incorrect location",
    "discrepancy",
    "ambiguous",
    "verify",
  ];

  const changeOrderKeywords = [
    "additional work",
    "extra work",
    "change",
    "rework",
    "variation",
    "replace",
    "relocate",
    "delay",
    "damaged",
    "unforeseen",
    "out of scope",
    "cost",
    "additional labor",
    "additional material",
  ];

  const scheduleKeywords = [
    "delay",
    "overdue",
    "blocked",
    "waiting",
    "urgent",
    "critical",
    "late",
    "hold",
    "stop work",
  ];

  const severityKeywords = [
    "safety",
    "failure",
    "damaged",
    "structural",
    "emergency",
    "stop work",
    "hazard",
    "injury",
  ];

  const documentationKeywords = [
    "documentation",
    "inspection",
    "photo",
    "drawing",
    "specification",
    "report",
    "record",
    "form",
  ];

  const rfiMatches = findMatches(combinedText, rfiKeywords);
  const changeOrderMatches = findMatches(
    combinedText,
    changeOrderKeywords
  );
  const scheduleMatches = findMatches(
    combinedText,
    scheduleKeywords
  );
  const severityMatches = findMatches(
    combinedText,
    severityKeywords
  );
  const documentationMatches = findMatches(
    combinedText,
    documentationKeywords
  );

  const taskIsOpen = status === "open";
  const hasCompleteMetadata = Boolean(
    description && location && type && taskGroup
  );

  const rfiRecommended = rfiMatches.length > 0;
  const changeOrderRisk = changeOrderMatches.length > 0;

  const classification = determineClassification(
    rfiRecommended,
    changeOrderRisk
  );

  const costRisk = determineCostRisk(changeOrderMatches);
  const scheduleRisk = determineScheduleRisk(
    scheduleMatches,
    taskIsOpen
  );

  const confidenceBreakdown: ConfidenceFactor[] = [
    {
      label: "RFI indicators",
      contribution: rfiMatches.length > 0 ? 18 : 0,
      matched: rfiMatches.length > 0,
      explanation:
        rfiMatches.length > 0
          ? `Matched: ${rfiMatches.join(", ")}`
          : "No clarification indicators detected",
    },
    {
      label: "Scope or cost indicators",
      contribution: changeOrderMatches.length > 0 ? 18 : 0,
      matched: changeOrderMatches.length > 0,
      explanation:
        changeOrderMatches.length > 0
          ? `Matched: ${changeOrderMatches.join(", ")}`
          : "No scope or cost indicators detected",
    },
    {
      label: "Schedule indicators",
      contribution: scheduleMatches.length > 0 ? 12 : 0,
      matched: scheduleMatches.length > 0,
      explanation:
        scheduleMatches.length > 0
          ? `Matched: ${scheduleMatches.join(", ")}`
          : "No schedule-impact indicators detected",
    },
    {
      label: "Safety or severity indicators",
      contribution: severityMatches.length > 0 ? 10 : 0,
      matched: severityMatches.length > 0,
      explanation:
        severityMatches.length > 0
          ? `Matched: ${severityMatches.join(", ")}`
          : "No elevated severity indicators detected",
    },
    {
      label: "Documentation context",
      contribution: documentationMatches.length > 0 ? 8 : 0,
      matched: documentationMatches.length > 0,
      explanation:
        documentationMatches.length > 0
          ? `Matched: ${documentationMatches.join(", ")}`
          : "No documentation-related indicators detected",
    },
    {
      label: "Task remains open",
      contribution: taskIsOpen ? 8 : 0,
      matched: taskIsOpen,
      explanation: taskIsOpen
        ? "The issue is still active"
        : `Current status: ${task.status || "Not specified"}`,
    },
    {
      label: "Complete task metadata",
      contribution: hasCompleteMetadata ? 7 : 0,
      matched: hasCompleteMetadata,
      explanation: hasCompleteMetadata
        ? "Description, location, task group, and type are available"
        : "Some core task metadata is missing",
    },
  ];

  const confidencePoints = confidenceBreakdown.reduce(
    (total, factor) => total + factor.contribution,
    0
  );

  const confidence = Math.min(
    0.95,
    0.35 + confidencePoints / 100
  );

  const reasoning = buildReasoning({
    task,
    rfiMatches,
    changeOrderMatches,
    scheduleMatches,
    severityMatches,
    classification,
  });

  const missingInformation = buildMissingInformation(task);

  const requiredDocumentation = buildRequiredDocumentation({
    rfiRecommended,
    changeOrderRisk,
    severityMatches,
  });

  const recommendedActions = buildRecommendedActions({
    rfiRecommended,
    changeOrderRisk,
    severityMatches,
  });

  return {
    classification,
    confidence,
    reasoning,
    rfiRecommended,
    changeOrderRisk,
    costRisk,
    scheduleRisk,
    suggestedRfiQuestion: rfiRecommended
      ? buildSuggestedRfiQuestion(task)
      : null,
    missingInformation,
    requiredDocumentation,
    recommendedActions,
    confidenceBreakdown,
  };
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function findMatches(
  text: string,
  keywords: string[]
): string[] {
  return keywords.filter((keyword) =>
    text.includes(keyword.toLowerCase())
  );
}

function determineClassification(
  rfiRecommended: boolean,
  changeOrderRisk: boolean
): AnalysisResult["classification"] {
  if (rfiRecommended && changeOrderRisk) {
    return "Both";
  }

  if (rfiRecommended) {
    return "RFI";
  }

  if (changeOrderRisk) {
    return "Change Order Review";
  }

  return "Neither";
}

function determineCostRisk(
  changeOrderMatches: string[]
): AnalysisResult["costRisk"] {
  if (changeOrderMatches.length >= 2) {
    return "High";
  }

  if (changeOrderMatches.length === 1) {
    return "Medium";
  }

  return "Low";
}

function determineScheduleRisk(
  scheduleMatches: string[],
  taskIsOpen: boolean
): AnalysisResult["scheduleRisk"] {
  if (scheduleMatches.length >= 2) {
    return "High";
  }

  if (scheduleMatches.length === 1 || taskIsOpen) {
    return "Medium";
  }

  return "Low";
}

function buildReasoning({
  task,
  rfiMatches,
  changeOrderMatches,
  scheduleMatches,
  severityMatches,
  classification,
}: {
  task: Task;
  rfiMatches: string[];
  changeOrderMatches: string[];
  scheduleMatches: string[];
  severityMatches: string[];
  classification: AnalysisResult["classification"];
}): string {
  const parts: string[] = [];

  if (rfiMatches.length > 0) {
    parts.push(
      `The task contains clarification indicators including ${formatList(
        rfiMatches
      )}. This suggests that project documentation, field direction, or the intended work location may require confirmation before work proceeds.`
    );
  }

  if (changeOrderMatches.length > 0) {
    parts.push(
      `The task also contains possible scope or cost-impact indicators including ${formatList(
        changeOrderMatches
      )}. These signals warrant review for potential labor, material, or contractual impact.`
    );
  }

  if (scheduleMatches.length > 0) {
    parts.push(
      `Potential schedule-impact signals were detected, including ${formatList(
        scheduleMatches
      )}. The project team should confirm whether the issue is blocking or delaying work.`
    );
  }

  if (severityMatches.length > 0) {
    parts.push(
      `Safety or severity indicators were also identified, including ${formatList(
        severityMatches
      )}. Human review should be prioritized before corrective action is authorized.`
    );
  }

  if (parts.length === 0) {
    parts.push(
      "The available task information does not contain strong indicators of a design clarification, scope change, or elevated project risk."
    );
  }

  parts.push(
    `ScopeGuard classified task ${task.id} as ${classification}.`
  );

  return parts.join(" ");
}

function buildSuggestedRfiQuestion(task: Task): string {
  const locationText = task.location?.trim()
    ? ` at ${task.location.trim()}`
    : "";

  return `Please clarify the required scope and intended work location${locationText} for task ${task.id}. Identify the governing drawing, specification, or written direction, and confirm whether revised documentation or corrective work is required before construction proceeds.`;
}

function buildMissingInformation(task: Task): string[] {
  const missing: string[] = [];

  if (!task.description?.trim()) {
    missing.push("Detailed task description");
  }

  if (!task.cause?.trim()) {
    missing.push("Cause of the issue");
  }

  if (!task.location?.trim()) {
    missing.push("Exact project location");
  }

  if (!task.priority?.trim()) {
    missing.push("Task priority");
  }

  if (!task.type?.trim()) {
    missing.push("Task type");
  }

  if (!task.taskGroup?.trim()) {
    missing.push("Task group");
  }

  return missing;
}

function buildRequiredDocumentation({
  rfiRecommended,
  changeOrderRisk,
  severityMatches,
}: {
  rfiRecommended: boolean;
  changeOrderRisk: boolean;
  severityMatches: string[];
}): string[] {
  const documents = [
    "Current site photographs",
    "Relevant drawings and specifications",
    "Task and inspection history",
    "Correspondence related to the issue",
  ];

  if (rfiRecommended) {
    documents.push(
      "Marked-up drawing identifying the affected location",
      "Responsible engineer or architect clarification"
    );
  }

  if (changeOrderRisk) {
    documents.push(
      "Labor and material cost estimate",
      "Schedule impact assessment",
      "Subcontractor pricing or quotation"
    );
  }

  if (severityMatches.length > 0) {
    documents.push(
      "Safety inspection record",
      "Corrective action documentation"
    );
  }

  return Array.from(new Set(documents));
}

function buildRecommendedActions({
  rfiRecommended,
  changeOrderRisk,
  severityMatches,
}: {
  rfiRecommended: boolean;
  changeOrderRisk: boolean;
  severityMatches: string[];
}): string[] {
  const actions = [
    "Confirm the exact field condition and affected location.",
    "Review the task with the responsible project engineer.",
  ];

  if (rfiRecommended) {
    actions.push(
      "Prepare and route an RFI for formal clarification.",
      "Hold affected work until clarification is received, where appropriate."
    );
  }

  if (changeOrderRisk) {
    actions.push(
      "Notify the project manager and begin change-order review.",
      "Document potential labor, material, cost, and schedule impacts."
    );
  }

  if (severityMatches.length > 0) {
    actions.push(
      "Escalate the issue for safety or quality review.",
      "Verify that immediate protective or corrective measures are in place."
    );
  }

  actions.push(
    "Require human review before contractual or financial action."
  );

  return actions;
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return `"${items[0]}"`;
  }

  const quotedItems = items.map((item) => `"${item}"`);

  return `${quotedItems.slice(0, -1).join(", ")} and ${
    quotedItems[quotedItems.length - 1]
  }`;
}