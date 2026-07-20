"use client";

import { useState } from "react";
import {
  analyzeTask,
  type AnalysisResult,
} from "@/lib/analyzeTask";
import type { Task } from "@/type/task";
import { markTaskAsAnalyzed } from "@/lib/analysisStorage";

interface AnalysisPanelProps {
  task: Task;
}

const analysisSteps = [
  "Reading task description",
  "Evaluating safety and quality indicators",
  "Reviewing project metadata",
  "Checking RFI triggers",
  "Assessing change-order risk",
  "Generating recommendation",
];

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export default function AnalysisPanel({
  task,
}: AnalysisPanelProps) {
  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [currentStep, setCurrentStep] = useState(-1);

  async function handleAnalyze() {
    if (isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setCurrentStep(0);

    for (
      let index = 0;
      index < analysisSteps.length;
      index += 1
    ) {
      setCurrentStep(index);
      await wait(450);
    }

    const analysisResult = analyzeTask(task);

    setResult(analysisResult);
    markTaskAsAnalyzed(task.id);

    setIsAnalyzing(false);
    setCurrentStep(-1);
  }

  return (
    <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            ScopeGuard Analysis
          </h2>

          <p className="mt-2 text-lg text-slate-600">
            Review this task for potential RFI and change-order risk.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isAnalyzing
            ? "Analyzing Task..."
            : result
              ? "Run Again"
              : "Run ScopeGuard Review"}
        </button>
      </div>

      {isAnalyzing && (
        <AnalysisProgress currentStep={currentStep} />
      )}

      {!result && !isAnalyzing && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          No analysis has been generated for this task yet.
        </div>
      )}

      {result && <AnalysisResults result={result} />}
    </section>
  );
}

function AnalysisProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-amber-600" />

        <div>
          <h3 className="font-semibold text-slate-900">
            Analyzing construction task...
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            ScopeGuard is evaluating the task using explainable
            construction review rules.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {analysisSteps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                isCurrent
                  ? "border-amber-300 bg-amber-50"
                  : isComplete
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isCurrent
                    ? "bg-amber-600 text-white"
                    : isComplete
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </span>

              <span
                className={`font-medium ${
                  isCurrent
                    ? "text-amber-900"
                    : isComplete
                      ? "text-emerald-900"
                      : "text-slate-500"
                }`}
              >
                {step}
              </span>

              {isCurrent && (
                <span className="ml-auto text-sm font-medium text-amber-700">
                  In progress
                </span>
              )}

              {isComplete && (
                <span className="ml-auto text-sm font-medium text-emerald-700">
                  Complete
                </span>
              )}

              {isPending && (
                <span className="ml-auto text-sm text-slate-400">
                  Pending
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisResults({
  result,
}: {
  result: AnalysisResult;
}) {
  const executiveSummary = buildExecutiveSummary(result);

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              AI Executive Summary
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              ScopeGuard Review Complete
            </h3>

            <p className="mt-3 max-w-4xl leading-7 text-slate-200">
              {executiveSummary}
            </p>
          </div>

          <ClassificationBadge
            classification={result.classification}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <ResultCard
          label="Classification"
          value={result.classification}
          badge={getClassificationStyle(result.classification)}
        />

        <ConfidenceCard confidence={result.confidence} />

        <RiskCard
          label="Cost Risk"
          value={result.costRisk}
        />

        <RiskCard
          label="Schedule Risk"
          value={result.scheduleRisk}
        />
      </div>

      <ConfidenceBreakdown
        factors={result.confidenceBreakdown}
        totalConfidence={result.confidence}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <DecisionCard
          label="RFI Recommendation"
          value={result.rfiRecommended}
          positiveText="Recommended"
          negativeText="Not Required"
        />

        <DecisionCard
          label="Change Order Review"
          value={result.changeOrderRisk}
          positiveText="Review Required"
          negativeText="Not Indicated"
        />
      </div>

      <ResultSection title="AI Reasoning">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
            AI
          </div>

          <p className="leading-7 text-slate-700">
            {result.reasoning}
          </p>
        </div>
      </ResultSection>

      {result.suggestedRfiQuestion && (
        <section className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              AI-Generated Draft
            </p>

            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              Request for Information
            </h3>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <DocumentField
                label="Classification"
                value={result.classification}
              />

              <DocumentField
                label="Confidence"
                value={`${Math.round(result.confidence * 100)}%`}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Proposed Question
              </p>

              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-800">
                {result.suggestedRfiQuestion}
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Draft requires review and approval by the responsible
              project team before formal submission.
            </p>
          </div>
        </section>
      )}

      <ResultList
        title="Missing Information"
        items={result.missingInformation}
        emptyMessage="No major information gaps identified."
      />

      <ChecklistSection
        title="Required Documentation"
        items={result.requiredDocumentation}
        emptyMessage="No additional documentation identified."
      />

      <ChecklistSection
        title="Recommended Actions"
        items={result.recommendedActions}
        emptyMessage="No additional actions identified."
      />

      <div className="rounded-lg border border-slate-200 bg-slate-100 px-5 py-4 text-sm text-slate-600">
        <strong className="text-slate-800">
          Human review required.
        </strong>{" "}
        ScopeGuard provides decision support only. Final contractual,
        financial, and project decisions remain with authorized project
        personnel.
      </div>
    </div>
  );
}



function buildExecutiveSummary(
  result: AnalysisResult
): string {
  if (result.classification === "Both") {
    return "ScopeGuard identified indicators supporting both an RFI and a change-order review. The issue may require formal clarification before work proceeds and may also affect cost, scope, or schedule.";
  }

  if (result.classification === "RFI") {
    return "ScopeGuard identified a potential information or design clarification issue. An RFI is recommended before work proceeds. Current evidence does not strongly indicate a contractual scope change.";
  }

  if (result.classification === "Change Order Review") {
    return "ScopeGuard identified possible scope, cost, or schedule impact. A change-order review is recommended, although a formal RFI may not be necessary based on the current task information.";
  }

  return "ScopeGuard did not identify strong indicators requiring an RFI or change-order review. The task should remain documented and reviewed through the normal project workflow.";
}

function getClassificationStyle(
  classification: AnalysisResult["classification"]
) {
  switch (classification) {
    case "RFI":
      return "bg-blue-100 text-blue-800";
    case "Change Order Review":
      return "bg-orange-100 text-orange-800";
    case "Both":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function ClassificationBadge({
  classification,
}: {
  classification: AnalysisResult["classification"];
}) {
  return (
    <span
      className={`rounded-full px-4 py-2 text-sm font-bold ${getClassificationStyle(
        classification
      )}`}
    >
      {classification}
    </span>
  );
}

function ResultCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${badge}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 text-xl font-bold text-slate-900">
          {value}
        </p>
      )}
    </div>
  );
}

function ConfidenceCard({
  confidence,
}: {
  confidence: number;
}) {
  const percentage = Math.round(confidence * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        Confidence
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold text-slate-900">
          {percentage}%
        </p>

        <span className="text-xs font-semibold text-slate-500">
          Rule-based score
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-600 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function ConfidenceBreakdown({
  factors,
  totalConfidence,
}: {
  factors: AnalysisResult["confidenceBreakdown"];
  totalConfidence: number;
}) {
  const percentage = Math.round(totalConfidence * 100);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Explainable AI
          </p>

          <h3 className="mt-1 text-xl font-bold text-slate-900">
            Confidence Breakdown
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            ScopeGuard calculates confidence from matched construction
            indicators and available task metadata.
          </p>
        </div>

        <div className="rounded-lg bg-slate-900 px-4 py-3 text-right text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Total confidence
          </p>

          <p className="mt-1 text-2xl font-bold">
            {percentage}%
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {factors.map((factor) => (
          <div
            key={factor.label}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    factor.matched
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {factor.matched ? "✓" : "—"}
                </span>

                <div>
                  <p className="font-semibold text-slate-900">
                    {factor.label}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {factor.explanation}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                  factor.contribution > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                +{factor.contribution}%
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  factor.contribution > 0
                    ? "bg-amber-600"
                    : "bg-slate-300"
                }`}
                style={{
                  width: `${Math.min(
                    factor.contribution * 4,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Confidence is an explainability score generated by ScopeGuard&apos;s
        rule engine. It is not a statistical probability or contractual
        determination.
      </div>
    </section>
  );
}

function RiskCard({
  label,
  value,
}: {
  label: string;
  value: "Low" | "Medium" | "High";
}) {
  const riskStyles = {
    Low: "bg-emerald-100 text-emerald-800",
    Medium: "bg-amber-100 text-amber-800",
    High: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <span
        className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${riskStyles[value]}`}
      >
        {value}
      </span>
    </div>
  );
}

function DecisionCard({
  label,
  value,
  positiveText,
  negativeText,
}: {
  label: string;
  value: boolean;
  positiveText: string;
  negativeText: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${
            value
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {value ? "✓" : "—"}
        </span>

        <p
          className={`text-lg font-bold ${
            value ? "text-amber-700" : "text-slate-700"
          }`}
        >
          {value ? positiveText : negativeText}
        </p>
      </div>
    </div>
  );
}

function DocumentField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ChecklistSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <ResultSection title={title}>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <label
              key={item}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <span className="text-slate-700">
                {item}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">
          {emptyMessage}
        </p>
      )}
    </ResultSection>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <div className="mt-3">{children}</div>
    </section>
  );
}

function ResultList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <ResultSection title={title}>
      {items.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">
          {emptyMessage}
        </p>
      )}
    </ResultSection>
  );
}