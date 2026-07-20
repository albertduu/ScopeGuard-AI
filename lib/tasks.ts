import rawTasks from "../data/processed/tasks.json";
import type { Task } from "../type/task";

const tasks = rawTasks as Task[];

export function getTasks(): Task[] {
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

export function getTaskCount(): number {
  return getTasks().length;
}

export function getAnalyzedTasks(): Task[] {
  return getTasks().filter(
    (task) => task.analysis.status === "completed"
  );
}

export function getUnanalyzedTasks(): Task[] {
  return getTasks().filter(
    (task) => task.analysis.status === "not_analyzed"
  );
}