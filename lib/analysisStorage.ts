const STORAGE_KEY = "scopeguard-analyzed-task-ids";

export function getAnalyzedTaskIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (value): value is string => typeof value === "string"
        )
      : [];
  } catch {
    return [];
  }
}

export function markTaskAsAnalyzed(taskId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const analyzedIds = getAnalyzedTaskIds();

  if (!analyzedIds.includes(taskId)) {
    analyzedIds.push(taskId);
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(analyzedIds)
  );

  window.dispatchEvent(new Event("scopeguard-analysis-updated"));
}

export function isTaskAnalyzed(taskId: string): boolean {
  return getAnalyzedTaskIds().includes(taskId);
}