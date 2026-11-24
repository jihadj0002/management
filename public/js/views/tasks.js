import {
  store,
  clientItems,
  clientName,
  createRecord,
  updateRecord,
  removeRecord
} from "../store.js";
import {
  esc,
  icon,
  tag,
  initials,
  options,
  openModal,
  closeModal,
  confirmAction,
  toast,
  emptyState,
  skeletonRows,
  formatDate,
  todayISO,
  parseISODate
} from "../ui.js";

const COLUMNS = [
  { key: "todo", label: "To do", tone: "slate" },
  { key: "in-progress", label: "In progress", tone: "blue" },
  { key: "review", label: "Review", tone: "amber" },
  { key: "done", label: "Completed", tone: "green" }
];

const PRIORITY = {
  low: ["Low", "green"],
  normal: ["Normal", "indigo"],
  high: ["High", "red"]
};

let search = "";
let clientFilter = "all";
let draggingId = null;

export function render(root) {
  const tasks = store.data.tasks;
  const loading = !store.loaded.tasks;
  const today = todayISO();

  const filtered = tasks.filter((task) => {
    const matchesClient = clientFilter === "all" || task.clientId === clientFilter;
    const haystack = [task.title, task.assignee, clientName(task.clientId, "")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesClient && (!search || haystack.includes(search));
  });

  const openCount = tasks.filter((task) => task.status !== "done").length;
  const overdue = tasks.filter(
    (task) => task.status !== "done" && task.dueDate && task.dueDate < today
  ).length;

  const clients = clientItems();

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Tasks</h2>
        <p class="view-sub">Assignments, deadlines and progress across every client.</p>
      </div>
      <div class="head-actions">
        <label class="search">
          ${icon("search")}
          <input id="taskSearch" data-focus-key="task-search" type="search" placeholder="Search tasks…" value="${esc(search)}" aria-label="Search tasks">
        </label>
        <select class="mini-select" id="taskClientFilter" aria-label="Filter by client">
          ${options([{ value: "all", label: "All clients" }, ...clients], clientFilter, null)}
        </select>
        <button class="btn btn-primary" type="button" data-action="new-task">${icon("plus")} New task</button>
      </div>
    </div>

    <div class="mini-stats">
      <div><span>Total</span><strong>${tasks.length}</strong></div>
      <div><span>Open</span><strong>${openCount}</strong></div>
      <div><span>Overdue</span><strong class="${overdue ? "is-danger" : ""}">${overdue}</strong></div>
      <div><span>Completed</span><strong>${tasks.length - openCount}</strong></div>
    </div>

    ${loading
      ? skeletonRows(4)
      : tasks.length === 0
        ? emptyState(
            "No tasks yet",
            "Create a task and assign it to a client to start tracking progress.",
            `<button type="button" class="btn btn-primary" data-action="new-task">${icon("plus")} New task</button>`
          )
        : `<div class="board">
            ${COLUMNS.map((column) => boardColumn(column, filtered, today, tasks.length)).join("")}
          </div>`}`;

  bind(root);
}

function boardColumn(column, tasks, today, totalTasks) {
  const rows = tasks.filter((task) => (column.key === "done" ? task.status === "done" : task.status === column.key));

  return `
    <section class="board-col" data-drop-status="${column.key}">
      <header class="board-col-head">
        <h3><span class="dot dot-${column.tone}"></span>${column.label}</h3>
        <span class="board-count">${rows.length}</span>
      </header>
      <div class="board-cards">
        ${rows.length
          ? rows.map((task) => taskCard(task, today)).join("")
          : `<p class="board-empty">${totalTasks ? "Nothing here." : "No tasks yet."}</p>`}
      </div>
      <button type="button" class="board-add" data-add-status="${column.key}">${icon("plus")} Add task</button>
    </section>`;
}

function taskCard(task, today) {
  const priority = PRIORITY[task.priority] || PRIORITY.normal;
  const overdue = task.status !== "done" && task.dueDate && task.dueDate < today;

  return `
    <article class="kanban-card" draggable="true" data-task-card="${esc(task.id)}" data-open-task="${esc(task.id)}">
      <div class="kanban-top">
        ${tag(priority[0], priority[1])}
        <div class="kanban-actions">
          <button type="button" class="icon-btn icon-xs" data-edit-task="${esc(task.id)}" aria-label="Edit task">${icon("edit")}</button>
          <button type="button" class="icon-btn icon-xs" data-delete-task="${esc(task.id)}" aria-label="Delete task">${icon("trash")}</button>
        </div>
      </div>
      <p class="kanban-title">${esc(task.title || "Untitled task")}</p>
      <p class="kanban-client">${esc(clientName(task.clientId))}</p>
      <div class="kanban-meta">
        <span class="due${overdue ? " is-danger" : ""}">${icon("clock")} ${esc(dueLabel(task.dueDate, task.status === "done", today))}</span>
        ${task.assignee ? `<span class="assignee" title="${esc(task.assignee)}">${esc(initials(task.assignee))}</span>` : ""}
      </div>
      <label class="status-inline">
        <span>Move to</span>
        <select data-status-select="${esc(task.id)}" aria-label="Move task">
          ${options(COLUMNS.map((column) => ({ value: column.key, label: column.label })), task.status || "todo", null)}
        </select>
      </label>
    </article>`;
}

function dueLabel(dueDate, done, today) {
  if (!dueDate) return "No due date";
  if (dueDate === today) return done ? "Completed" : "Due today";
  if (!done && dueDate < today) return `Overdue · ${formatDate(dueDate)}`;

  const start = parseISODate(today);
  const end = parseISODate(dueDate);
  const diff = start && end ? Math.round((end - start) / 86400000) : null;

  if (!done && diff === 1) return "Due tomorrow";
  if (!done && diff !== null && diff > 1 && diff <= 7) return `Due in ${diff} days`;
  return `Due ${formatDate(dueDate)}`;
}

function bind(root) {
  const searchInput = root.querySelector("#taskSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      search = searchInput.value.trim().toLowerCase();
      render(root);
      const next = root.querySelector("#taskSearch");
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    });
  }

  const filter = root.querySelector("#taskClientFilter");
  if (filter) {
    filter.addEventListener("change", () => {
      clientFilter = filter.value;
      render(root);
    });
  }

  root.querySelectorAll("[data-action='new-task']").forEach((button) => {
    button.addEventListener("click", () => openTaskForm());
  });

  root.querySelectorAll("[data-add-status]").forEach((button) => {
    button.addEventListener("click", () => openTaskForm(null, { status: button.dataset.addStatus }));
  });

  root.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const task = store.data.tasks.find((item) => item.id === button.dataset.editTask);
      if (task) openTaskForm(task);
    });
  });

  root.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const task = store.data.tasks.find((item) => item.id === button.dataset.deleteTask);
      if (!task) return;
      const confirmed = await confirmAction({
        title: "Delete task?",
        message: `"${task.title}" will be removed from the board.`,
        confirmLabel: "Delete task"
      });
      if (!confirmed) return;
      try {
        await removeRecord("tasks", task.id);
        toast("Task deleted", "success");
      } catch (error) {
        console.error(error);
        toast("Could not delete the task.", "error");
      }
    });
  });

  root.querySelectorAll("[data-open-task]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, select, label")) return;
      const task = store.data.tasks.find((item) => item.id === card.dataset.openTask);
      if (task) openTaskForm(task);
    });
  });

  root.querySelectorAll("[data-status-select]").forEach((select) => {
    select.addEventListener("change", () => moveTask(select.dataset.statusSelect, select.value));
    select.addEventListener("click", (event) => event.stopPropagation());
  });

  root.querySelectorAll("[data-task-card]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggingId = card.dataset.taskCard;
      card.classList.add("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggingId);
      }
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      draggingId = null;
      root.querySelectorAll(".board-col").forEach((column) => column.classList.remove("is-over"));
    });
  });

  root.querySelectorAll("[data-drop-status]").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("is-over");
    });
    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove("is-over");
    });
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("is-over");
      const id = event.dataTransfer?.getData("text/plain") || draggingId;
      if (id) moveTask(id, column.dataset.dropStatus);
    });
  });
}

async function moveTask(id, status) {
  const task = store.data.tasks.find((item) => item.id === id);
  if (!task || task.status === status) return;
  try {
    await updateRecord("tasks", id, { status });
  } catch (error) {
    console.error(error);
    toast("Could not move the task.", "error");
  }
}

export function openTaskForm(task = null, defaults = {}) {
  const isEdit = Boolean(task);
  const value = task || defaults;
  const clients = clientItems();

  openModal({
    title: isEdit ? "Edit task" : "New task",
    subtitle: "Assignments, deadlines and progress.",
    body: `
      <form id="taskForm" class="form" novalidate>
        <label class="field">
          <span>Task title *</span>
          <input name="title" maxlength="140" required value="${esc(value.title || "")}" placeholder="Design October carousel">
        </label>
        <div class="form-grid">
          <label class="field">
            <span>Client</span>
            <select name="clientId">${options(clients, value.clientId || "", "No client")}</select>
          </label>
          <label class="field">
            <span>Assignee</span>
            <input name="assignee" maxlength="60" value="${esc(value.assignee || "")}" placeholder="Who owns this?">
          </label>
          <label class="field">
            <span>Priority</span>
            <select name="priority">${options(
              [{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }],
              value.priority || "normal",
              null
            )}</select>
          </label>
          <label class="field">
            <span>Status</span>
            <select name="status">${options(
              COLUMNS.map((column) => ({ value: column.key, label: column.label })),
              value.status || "todo",
              null
            )}</select>
          </label>
          <label class="field">
            <span>Due date</span>
            <input name="dueDate" type="date" value="${esc(value.dueDate || "")}">
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <textarea name="notes" rows="3" placeholder="Context, links, acceptance criteria…">${esc(value.notes || "")}</textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? "Save changes" : "Create task"}</button>
        </div>
      </form>`,
    onMount: (modal) => {
      const form = modal.querySelector("#taskForm");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const data = {
          title: form.elements.title.value.trim(),
          clientId: form.elements.clientId.value,
          assignee: form.elements.assignee.value.trim(),
          priority: form.elements.priority.value,
          status: form.elements.status.value,
          dueDate: form.elements.dueDate.value,
          notes: form.elements.notes.value.trim()
        };

        if (!data.title) {
          toast("Give the task a title.", "error");
          form.elements.title.focus();
          return;
        }

        submit.disabled = true;
        submit.textContent = "Saving…";

        try {
          if (isEdit) {
            await updateRecord("tasks", task.id, data);
          } else {
            await createRecord("tasks", data);
          }
          closeModal();
          toast(isEdit ? "Task updated" : "Task created", "success");
        } catch (error) {
          console.error(error);
          toast("Could not save the task.", "error");
          submit.disabled = false;
          submit.textContent = isEdit ? "Save changes" : "Create task";
        }
      });
    }
  });
}
