import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskById } from "../../../lib/tasks";
import AnalysisPanel from "@/components/AnalysisPanel";

interface AnalyzeTaskPageProps {
  params: Promise<{
    id: string;
  }>;
}

function displayValue(value: string | null | undefined): string {
  return value?.trim() || "Not specified";
}

export default async function AnalyzeTaskPage({
  params,
}: AnalyzeTaskPageProps) {
  const { id } = await params;
  const task = getTaskById(decodeURIComponent(id));

  if (!task) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f4f6f8",
        color: "#17202a",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/dataset"
          style={{
            color: "#475569",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Back to Dataset Explorer
        </Link>

        <p
          style={{
            marginTop: "36px",
            color: "#b45309",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          ScopeGuard AI Review
        </p>

        <h1>Analyze Construction Task</h1>

        <section
          style={{
            marginTop: "24px",
            padding: "28px",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "white",
          }}
        >
          <p>
            <strong>Reference:</strong> {task.id}
          </p>

          <p>
            <strong>Description:</strong>{" "}
            {displayValue(task.description)}
          </p>

          <p>
            <strong>Status:</strong> {displayValue(task.status)}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {displayValue(task.location)}
          </p>

          <p>
            <strong>Task group:</strong>{" "}
            {displayValue(task.taskGroup)}
          </p>

          <p>
            <strong>Type:</strong> {displayValue(task.type)}
          </p>

          <p>
            <strong>Priority:</strong>{" "}
            {displayValue(task.priority)}
          </p>

          <p>
            <strong>Cause:</strong> {displayValue(task.cause)}
          </p>

          <p>
            <strong>Project:</strong> {displayValue(task.project)}
          </p>
        </section>

        <AnalysisPanel task={task} />
      </div>
    </main>
  );
}