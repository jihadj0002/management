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
  options,
  openModal,
  closeModal,
  confirmAction,
  toast,
  emptyState,
  formatDate,
  formatMonth,
  toISODate,
  todayISO
} from "../ui.js";

const STATUS = {
  idea: ["Idea", "slate"],
  shoot: ["Shoot", "amber"],
  editing: ["Editing", "purple"],
  scheduled: ["Scheduled", "blue"],
  published: ["Published", "green"]
};

const TYPES = ["Post", "Reel", "Story", "Video", "Blog", "Email", "Other"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook", "Blog", "Email", "Other"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const now = new Date();
let viewYear = now.getFullYear();
let viewMonth = now.getMonth();

export function render(root) {
  const items = store.data.content;
  const loading = !store.loaded.content;
  const today = todayISO();
  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const counts = {
    idea: items.filter((item) => item.status === "idea").length,
    production: items.filter((item) => item.status === "shoot" || item.status === "editing").length,
    scheduled: items.filter((item) => item.status === "scheduled").length,
    published: items.filter((item) => item.status === "published").length
  };

  const byDate = new Map();
  items.forEach((item) => {
    if (!item.date) return;
    if (!byDate.has(item.date)) byDate.set(item.date, []);
    byDate.get(item.date).push(item);
  });

  const upcoming = items
    .filter((item) => item.status !== "published" && item.date && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const first = new Date(viewYear, viewMonth, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const date = new Date(viewYear, viewMonth, 1 - offset + index);
    const iso = toISODate(date);
    const inMonth = date.getMonth() === viewMonth;
    const dayItems = (byDate.get(iso) || []).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

    cells.push(`
      <div class="cal-cell${inMonth ? "" : " is-muted"}${iso === today ? " is-today" : ""}" data-cal-date="${iso}">
        <div class="cal-day"><span>${date.getDate()}</span><button type="button" class="cal-add" data-add-date="${iso}" aria-label="Add content on ${esc(formatDate(iso, { month: "long", day: "numeric" }))}">${icon("plus")}</button></div>
        <div class="cal-items">
          ${dayItems.slice(0, 3).map(contentChip).join("")}
          ${dayItems.length > 3 ? `<span class="cal-more">+${dayItems.length - 3} more</span>` : ""}
        </div>
      </div>`);
  }

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Content calendar</h2>
        <p class="view-sub">Ideas, shoots, editing and publishing in one timeline.</p>
      </div>
      <div class="head-actions">
        <div class="month-nav">
          <button type="button" class="icon-btn icon-sm" data-cal-prev aria-label="Previous month">${icon("left")}</button>
          <span>${esc(formatMonth(monthKey))}</span>
          <button type="button" class="icon-btn icon-sm" data-cal-next aria-label="Next month">${icon("right")}</button>
        </div>
        <button type="button" class="btn btn-ghost" data-cal-today>Today</button>
        <button type="button" class="btn btn-primary" data-action="new-content">${icon("plus")} Schedule content</button>
      </div>
    </div>

    <div class="mini-stats">
      <div><span>Ideas</span><strong>${counts.idea}</strong></div>
      <div><span>In production</span><strong>${counts.production}</strong></div>
      <div><span>Scheduled</span><strong>${counts.scheduled}</strong></div>
      <div><span>Published</span><strong>${counts.published}</strong></div>
    </div>

    ${loading
      ? `<div class="card"><p class="muted-note">Loading the calendar…</p></div>`
      : `<section class="card calendar-card">
          <div class="cal-scroll">
            <div class="cal-grid">
              ${WEEKDAYS.map((day) => `<div class="cal-weekday">${day}</div>`).join("")}
              ${cells.join("")}
            </div>
          </div>
          <div class="cal-legend">
            ${Object.entries(STATUS).map(([key, meta]) => `<span class="legend-item"><span class="dot dot-${meta[1]}"></span>${meta[0]}</span>`).join("")}
          </div>
        </section>`}

    <section class="card">
      <header class="card-head">
        <div><h3>Upcoming schedule</h3><p>Next items waiting to go live</p></div>
      </header>
      ${upcoming.length
        ? `<ul class="upcoming-list">
            ${upcoming.map((item) => {
              const status = STATUS[item.status] || STATUS.idea;
              return `<li>
                <button type="button" class="upcoming-main" data-edit-content="${esc(item.id)}">
                  <span class="date-badge"><strong>${esc(formatDate(item.date, { day: "numeric" }))}</strong><span>${esc(formatDate(item.date, { month: "short" }))}</span></span>
                  <span class="upcoming-copy">
                    <span class="upcoming-title">${esc(item.title || "Untitled")}</span>
                    <span class="upcoming-sub">${esc(clientName(item.clientId))}${item.platform ? ` · ${esc(item.platform)}` : ""}${item.type ? ` · ${esc(item.type)}` : ""}</span>
                  </span>
                  ${tag(status[0], status[1])}
                </button>
              </li>`;
            }).join("")}
          </ul>`
        : emptyState(
            "Nothing scheduled",
            "Add an idea or schedule the next piece of content to fill your calendar.",
            `<button type="button" class="btn btn-primary" data-action="new-content">${icon("plus")} Schedule content</button>`
          )}
    </section>`;

  bind(root);
}

function contentChip(item) {
  const status = STATUS[item.status] || STATUS.idea;
  return `<button type="button" class="cal-chip tone-${status[1]}" data-edit-content="${esc(item.id)}" title="${esc(item.title || "Untitled")}">
    <span class="chip-title">${esc(item.title || "Untitled")}</span>
  </button>`;
}

function bind(root) {
  root.querySelectorAll("[data-action='new-content']").forEach((button) => {
    button.addEventListener("click", () => openContentForm());
  });

  root.querySelectorAll("[data-cal-prev]").forEach((button) => {
    button.addEventListener("click", () => {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      render(root);
    });
  });

  root.querySelectorAll("[data-cal-next]").forEach((button) => {
    button.addEventListener("click", () => {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      render(root);
    });
  });

  root.querySelectorAll("[data-cal-today]").forEach((button) => {
    button.addEventListener("click", () => {
      const today = new Date();
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
      render(root);
    });
  });

  root.querySelectorAll("[data-cal-date]").forEach((cell) => {
    cell.addEventListener("click", (event) => {
      if (event.target.closest("[data-edit-content], [data-add-date]")) return;
      openContentForm(null, { date: cell.dataset.calDate });
    });
  });

  root.querySelectorAll("[data-add-date]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openContentForm(null, { date: button.dataset.addDate });
    });
  });

  root.querySelectorAll("[data-edit-content]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const item = store.data.content.find((row) => row.id === element.dataset.editContent);
      if (item) openContentForm(item);
    });
  });
}

export function openContentForm(item = null, defaults = {}) {
  const isEdit = Boolean(item);
  const value = item || defaults;
  const clients = clientItems();

  openModal({
    title: isEdit ? "Edit content" : "Schedule content",
    subtitle: "Ideas, shoots, editing and publishing.",
    body: `
      <form id="contentForm" class="form" novalidate>
        <label class="field">
          <span>Title *</span>
          <input name="title" maxlength="140" required value="${esc(value.title || "")}" placeholder="October product carousel">
        </label>
        <div class="form-grid">
          <label class="field">
            <span>Client</span>
            <select name="clientId">${options(clients, value.clientId || "", "No client")}</select>
          </label>
          <label class="field">
            <span>Platform</span>
            <select name="platform">${options(PLATFORMS, value.platform || "Instagram", null)}</select>
          </label>
          <label class="field">
            <span>Content type</span>
            <select name="type">${options(TYPES, value.type || "Post", null)}</select>
          </label>
          <label class="field">
            <span>Status</span>
            <select name="status">${options(
              Object.entries(STATUS).map(([key, meta]) => ({ value: key, label: meta[0] })),
              value.status || "idea",
              null
            )}</select>
          </label>
          <label class="field">
            <span>Date</span>
            <input name="date" type="date" value="${esc(value.date || todayISO())}">
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <textarea name="notes" rows="3" placeholder="Hook, caption direction, shot list, links…">${esc(value.notes || "")}</textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          ${isEdit
            ? `<button type="button" class="btn btn-danger-ghost" data-delete-content>${icon("trash")} Delete</button>`
            : ""}
          <button type="submit" class="btn btn-primary">${isEdit ? "Save changes" : "Add to calendar"}</button>
        </div>
      </form>`,
    onMount: (modal) => {
      const form = modal.querySelector("#contentForm");
      const deleteButton = form.querySelector("[data-delete-content]");

      if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
          const confirmed = await confirmAction({
            title: "Delete content?",
            message: `"${item.title}" will be removed from the calendar.`,
            confirmLabel: "Delete content"
          });
          if (!confirmed) return;
          try {
            await removeRecord("content", item.id);
            closeModal();
            toast("Content deleted", "success");
          } catch (error) {
            console.error(error);
            toast("Could not delete the content.", "error");
          }
        });
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const data = {
          title: form.elements.title.value.trim(),
          clientId: form.elements.clientId.value,
          platform: form.elements.platform.value,
          type: form.elements.type.value,
          status: form.elements.status.value,
          date: form.elements.date.value,
          notes: form.elements.notes.value.trim()
        };

        if (!data.title) {
          toast("Give the content a title.", "error");
          form.elements.title.focus();
          return;
        }

        submit.disabled = true;
        submit.textContent = "Saving…";

        try {
          if (isEdit) {
            await updateRecord("content", item.id, data);
          } else {
            await createRecord("content", data);
          }
          closeModal();
          toast(isEdit ? "Content updated" : "Content added", "success");
        } catch (error) {
          console.error(error);
          toast("Could not save the content.", "error");
          submit.disabled = false;
          submit.textContent = isEdit ? "Save changes" : "Add to calendar";
        }
      });
    }
  });
}
