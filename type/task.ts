export interface TaskAnalysis {
  status: "not_analyzed" | "completed";

  classification: string | null;
  confidence?: number | null;
  issueType?: string | null;
  priority?: string | null;

  reasoning: string | null;

  rfiRecommended: boolean | null;
  changeOrderRisk: boolean | null;

  costRisk?: string | null;
  scheduleRisk?: string | null;

  suggestedRfiQuestion?: string | null;

  costDrivers?: string[];
  missingInformation?: string[];
  requiredDocumentation?: string[];
  recommendedActions?: string[];

  analyzedAt?: string | null;
  analysisMethod?: string | null;
}

export interface Task {
  id: string;

  status: string;
  description: string;
  location: string;
  created: string;
  type: string;
  taskGroup: string;
  priority: string;
  cause: string;
  project: string;

  analysis: TaskAnalysis;
}