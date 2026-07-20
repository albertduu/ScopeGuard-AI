"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getAnalyzedTaskIds,
} from "@/lib/analysisStorage";

import type { Task } from "@/type/task";

interface DatasetExplorerProps {
  tasks: Task[];
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function getUniqueValues(
  tasks: Task[],
  field: keyof Pick<
    Task,
    "status" | "taskGroup" | "project" | "priority"
  >
): string[] {
  return Array.from(
    new Set(
      tasks
        .map((task) => task[field])
        .filter(
          (value): value is string =>
            Boolean(value?.trim())
        )
    )
  ).sort((firstValue, secondValue) =>
    firstValue.localeCompare(secondValue)
  );
}

function displayValue(
  value: string | null | undefined
): string {
  const trimmedValue = value?.trim();

  return trimmedValue || "Not specified";
}

export default function DatasetExplorer({
  tasks,
}: DatasetExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [taskGroupFilter, setTaskGroupFilter] =
    useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [analyzedTaskIds, setAnalyzedTaskIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    function refreshAnalyzedTasks() {
      setAnalyzedTaskIds(getAnalyzedTaskIds());
    }

    refreshAnalyzedTasks();

    window.addEventListener(
      "focus",
      refreshAnalyzedTasks
    );

    window.addEventListener(
      "pageshow",
      refreshAnalyzedTasks
    );

    window.addEventListener(
      "scopeguard-analysis-updated",
      refreshAnalyzedTasks
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshAnalyzedTasks
      );

      window.removeEventListener(
        "pageshow",
        refreshAnalyzedTasks
      );

      window.removeEventListener(
        "scopeguard-analysis-updated",
        refreshAnalyzedTasks
      );
    };
  }, []);

  const analyzedTaskIdSet = useMemo(
    () => new Set(analyzedTaskIds),
    [analyzedTaskIds]
  );

  const statuses = useMemo(
    () => getUniqueValues(tasks, "status"),
    [tasks]
  );

  const taskGroups = useMemo(
    () => getUniqueValues(tasks, "taskGroup"),
    [tasks]
  );

  const projects = useMemo(
    () => getUniqueValues(tasks, "project"),
    [tasks]
  );

  const priorities = useMemo(
    () => getUniqueValues(tasks, "priority"),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return tasks.filter((task) => {
      const searchableText = [
        task.id,
        task.description,
        task.location,
        task.project,
        task.type,
        task.taskGroup,
        task.priority,
        task.cause,
        task.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "" ||
        task.status === statusFilter;

      const matchesTaskGroup =
        taskGroupFilter === "" ||
        task.taskGroup === taskGroupFilter;

      const matchesProject =
        projectFilter === "" ||
        task.project === projectFilter;

      const matchesPriority =
        priorityFilter === "" ||
        task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTaskGroup &&
        matchesProject &&
        matchesPriority
      );
    });
  }, [
    tasks,
    searchTerm,
    statusFilter,
    taskGroupFilter,
    projectFilter,
    priorityFilter,
  ]);

  const matchingAnalyzedCount = useMemo(() => {
    return filteredTasks.filter((task) =>
      analyzedTaskIdSet.has(task.id)
    ).length;
  }, [filteredTasks, analyzedTaskIdSet]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / pageSize)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * pageSize;

  const endIndex = startIndex + pageSize;

  const visibleTasks = filteredTasks.slice(
    startIndex,
    endIndex
  );

  function resetPage() {
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("");
    setTaskGroupFilter("");
    setProjectFilter("");
    setPriorityFilter("");
    setCurrentPage(1);
  }

  function goToPreviousPage() {
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );
  }

  function goToNextPage() {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
  }

  return (
    <section className="dataset-explorer">
      <div className="dataset-summary">
        <div>
          <span className="summary-label">
            Imported Tasks
          </span>

          <strong>
            {tasks.length.toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="summary-label">
            Matching Tasks
          </span>

          <strong>
            {filteredTasks.length.toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="summary-label">
            Analyzed
          </span>

          <strong>
            {matchingAnalyzedCount.toLocaleString()}
          </strong>
        </div>
      </div>

      <div className="dataset-controls">
        <div className="search-control">
          <label htmlFor="task-search">
            Search tasks
          </label>

          <input
            id="task-search"
            type="search"
            value={searchTerm}
            placeholder="Search descriptions, locations, projects, IDs, task groups, or causes..."
            onChange={(event) => {
              setSearchTerm(event.target.value);
              resetPage();
            }}
          />
        </div>

        <div className="filter-grid">
          <div>
            <label htmlFor="status-filter">
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value
                );

                resetPage();
              }}
            >
              <option value="">
                All statuses
              </option>

              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-group-filter">
              Task group
            </label>

            <select
              id="task-group-filter"
              value={taskGroupFilter}
              onChange={(event) => {
                setTaskGroupFilter(
                  event.target.value
                );

                resetPage();
              }}
            >
              <option value="">
                All task groups
              </option>

              {taskGroups.map((taskGroup) => (
                <option
                  key={taskGroup}
                  value={taskGroup}
                >
                  {taskGroup}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-filter">
              Project
            </label>

            <select
              id="project-filter"
              value={projectFilter}
              onChange={(event) => {
                setProjectFilter(
                  event.target.value
                );

                resetPage();
              }}
            >
              <option value="">
                All projects
              </option>

              {projects.map((project) => (
                <option
                  key={project}
                  value={project}
                >
                  {project}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority-filter">
              Priority
            </label>

            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(
                  event.target.value
                );

                resetPage();
              }}
            >
              <option value="">
                All priorities
              </option>

              {priorities.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="clear-filters-button"
          type="button"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>

      <div className="table-toolbar">
        <p>
          Showing{" "}
          <strong>
            {filteredTasks.length === 0
              ? 0
              : startIndex + 1}
          </strong>
          {"–"}
          <strong>
            {Math.min(
              endIndex,
              filteredTasks.length
            )}
          </strong>{" "}
          of{" "}
          <strong>
            {filteredTasks.length.toLocaleString()}
          </strong>
        </p>

        <div className="page-size-control">
          <label htmlFor="page-size">
            Rows per page
          </label>

          <select
            id="page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(
                Number(event.target.value)
              );

              setCurrentPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option
                key={size}
                value={size}
              >
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Status</th>
              <th>Task Group</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Project</th>
              <th>AI Status</th>
              <th aria-label="Task actions">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => {
                const isAnalyzed =
                  analyzedTaskIdSet.has(task.id);

                return (
                  <tr key={task.id}>
                    <td className="description-cell">
                      <span className="task-reference">
                        {displayValue(task.id)}
                      </span>

                      <span title={task.description}>
                        {displayValue(
                          task.description
                        )}
                      </span>

                      {task.location && (
                        <small>
                          {task.location}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="table-badge">
                        {displayValue(
                          task.status
                        )}
                      </span>
                    </td>

                    <td>
                      {displayValue(
                        task.taskGroup
                      )}
                    </td>

                    <td>
                      {displayValue(task.type)}
                    </td>

                    <td>
                      <span className="priority-badge">
                        {displayValue(
                          task.priority
                        )}
                      </span>
                    </td>

                    <td>
                      {displayValue(
                        task.project
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          isAnalyzed
                            ? "analysis-status completed"
                            : "analysis-status pending"
                        }
                      >
                        {isAnalyzed
                          ? "Analyzed"
                          : "Not analyzed"}
                      </span>
                    </td>

                    <td>
                      <Link
                        className="analyze-link"
                        href={`/analyze/${encodeURIComponent(
                          task.id
                        )}`}
                      >
                        {isAnalyzed
                          ? "View Review"
                          : "Analyze"}
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="empty-table-message"
                  colSpan={8}
                >
                  No tasks match the selected
                  filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          onClick={goToPreviousPage}
          disabled={safeCurrentPage === 1}
        >
          Previous
        </button>

        <span>
          Page{" "}
          <strong>{safeCurrentPage}</strong>{" "}
          of <strong>{totalPages}</strong>
        </span>

        <button
          type="button"
          onClick={goToNextPage}
          disabled={
            safeCurrentPage === totalPages ||
            filteredTasks.length === 0
          }
        >
          Next
        </button>
      </div>
    </section>
  );
}