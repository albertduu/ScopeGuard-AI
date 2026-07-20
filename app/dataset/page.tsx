import DatasetExplorer from "@/components/DatasetExplorer";
import {
  getTasks,
} from "@/lib/tasks";
import "./dataset.css";

export default function DatasetPage() {
  const tasks = getTasks();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            ScopeGuard AI
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Construction Task Dataset
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Search and filter imported construction tasks, then select a
            task for AI-assisted RFI and change-order review.
          </p>
        </div>


        <div className="mt-8">
          <DatasetExplorer tasks={tasks} />
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-3xl font-bold text-gray-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}