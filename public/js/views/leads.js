import {
  store,
  clientItems,
  createRecord,
  updateRecord,
  removeRecord,
  sumBy
} from "../store.js";
import {
  esc,
  icon,
  money,
  pct,
  tag,
  options,
  openModal,
  closeModal,
  confirmAction,
  toast,
  emptyState,
  skeletonRows,
  formatDate,
  todayISO
} from "../ui.js";

const STAGES = [
  { key: "new", label: "New inquiry", tone: "blue" },
  { key: "contacted", label: "Contacted", tone: "purple" },
  { key: "proposal", label: "Proposal", tone: "amber" },
  { key: "won", label: "Won", tone: "green" },
  { key: "lost", label: "Lost", tone: "red" }
];

const SOURCES = ["Instagram", "Referral", "Website", "Cold outreach", "Event", "Other"];

let search = "";
let draggingId = null;

export function render(root) {
  const leads = store.data.leads;
  const loading = !store.loaded.leads;
  const today = todayISO();

  const filtered = leads.filter((lead) => {
    const haystack = [lead.name, lead.company, lead.email, lead.service]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return !search || haystack.includes(search);
  });

  const open = leads.filter((lead) => lead.stage !== "won" && lead.stage !== "lost");
  const won = leads.filter((lead) => lead.stage === "won");
  const lost = leads.filter((lead) => lead.stage === "lost");
  const openValue = sumBy(open, "value");
  const wonValue = sumBy(won, "value");
  const winRate = won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0;
  const averageDeal = open.length ? openValue / open.length : 0;

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Leads &amp; sales</h2>
        <p class="view-sub">Customer inquiries, follow-ups and deal progress.</p>
      </div>
      <div class="head-actions">
        <label class="search">
          ${icon("search")}
          <input id="leadSearch" data-focus-key="lead-search" type="search" placeholder="Search leads…" value="${esc(search)}" aria-label="Search leads">
        </label>
        <button class="btn btn-primary" type="button" data-action="new-lead">${icon("plus")} New lead</button>
      </div>
    </div>

    <section class="kpi-grid">
      <article class="kpi">
        <p class="kpi-label">Open pipeline</p>
        <p class="kpi-value">${money(openValue, true)}</p>
        <p class="kpi-hint">${open.length} active opportunit${open.length === 1 ? "y" : "ies"}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Won revenue</p>
        <p class="kpi-value">${money(wonValue, true)}</p>
        <p class="kpi-hint">${won.length} closed deal${won.length === 1 ? "" : "s"}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Win rate</p>
        <p class="kpi-value">${pct(winRate, 0)}</p>
        <p class="kpi-hint">${lost.length} lost deal${lost.length === 1 ? "" : "s"}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Average deal</p>
        <p class="kpi-value">${money(averageDeal, true)}</p>
        <p class="kpi-hint">Across open pipeline</p>
      </article>
    </section>

    ${loading
      ? skeletonRows(3)
      : leads.length === 0
        ? emptyState(
            "No leads yet",
            "Capture inquiries and move them through your sales stages.",
            `<button type="button" class="btn btn-primary" data-action="new-lead">${icon("plus")} New lead</button>`
          )
        : `<div class="board board-sales">
            ${STAGES.map((stage) => stageColumn(stage, filtered, today, leads.length)).join("")}
          </div>`}`;

  bind(root);
}

function stageColumn(stage, leads, today, total) {
  const rows = leads.filter((lead) => (lead.stage || "new") === stage.key);
  const value = sumBy(rows, "value");

  return `
    <section class="board-col" data-drop-stage="${stage.key}">
      <header class="board-col-head">
        <h3><span class="dot dot-${stage.tone}"></span>${stage.label}</h3>
        <span class="board-count">${rows.length}</span>
      </header>
      <p class="board-total">${value ? money(value, true) : "—"}</p>
      <div class="board-cards">
        ${rows.length
          ? rows.map((lead) => leadCard(lead, today)).join("")
          : `<p class="board-empty">${total ? "Nothing here." : "No leads yet."}</p>`}
      </div>
      <button type="button" class="board-add" data-add-stage="${stage.key}">${icon("plus")} Add lead</button>
    </section>`;
}

function leadCard(lead, today) {
  const followUp = lead.nextFollowUp
    ? {
        label: lead.nextFollowUp < today ? `Overdue · ${formatDate(lead.nextFollowUp)}` : `Follow up ${formatDate(lead.nextFollowUp)}`,
        overdue: lead.nextFollowUp < today
      }
    : null;

  return `
    <article class="kanban-card" draggable="true" data-lead-card="${esc(lead.id)}" data-open-lead="${esc(lead.id)}">
      <div class="kanban-top">
        ${tag(lead.source || "Inquiry", "slate")}
        <div class="kanban-actions">
          <button type="button" class="icon-btn icon-xs" data-edit-lead="${esc(lead.id)}" aria-label="Edit lead">${icon("edit")}</button>
          <button type="button" class="icon-btn icon-xs" data-delete-lead="${esc(lead.id)}" aria-label="Delete lead">${icon("trash")}</button>
        </div>
      </div>
      <p class="kanban-title">${esc(lead.name || "Untitled lead")}</p>
      <p class="kanban-client">${esc(lead.company || lead.email || "Direct inquiry")}</p>
      <p class="kanban-value">${money(lead.value, true)}</p>
      ${lead.service ? `<p class="kanban-sub">${esc(lead.service)}</p>` : ""}
      <div class="kanban-meta">
        <span class="due${followUp?.overdue ? " is-danger" : ""}">${icon("clock")} ${esc(followUp?.label || "No follow-up set")}</span>
      </div>
      <label class="status-inline">
        <span>Stage</span>
        <select data-stage-select="${esc(lead.id)}" aria-label="Move lead">
          ${options(STAGES.map((stage) => ({ value: stage.key, label: stage.label })), lead.stage || "new", null)}
        </select>
      </label>
    </article>`;
}

function bind(root) {
  const searchInput = root.querySelector("#leadSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      search = searchInput.value.trim().toLowerCase();
      render(root);
      const next = root.querySelector("#leadSearch");
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    });
  }

  root.querySelectorAll("[data-action='new-lead']").forEach((button) => {
    button.addEventListener("click", () => openLeadForm());
  });

  root.querySelectorAll("[data-add-stage]").forEach((button) => {
    button.addEventListener("click", () => openLeadForm(null, { stage: button.dataset.addStage }));
  });

  root.querySelectorAll("[data-edit-lead]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const lead = store.data.leads.find((item) => item.id === button.dataset.editLead);
      if (lead) openLeadForm(lead);
    });
  });

  root.querySelectorAll("[data-delete-lead]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const lead = store.data.leads.find((item) => item.id === button.dataset.deleteLead);
      if (!lead) return;
      const confirmed = await confirmAction({
        title: "Delete lead?",
        message: `"${lead.name}" will be removed from your pipeline.`,
        confirmLabel: "Delete lead"
      });
      if (!confirmed) return;
      try {
        await removeRecord("leads", lead.id);
        toast("Lead deleted", "success");
      } catch (error) {
        console.error(error);
        toast("Could not delete the lead.", "error");
      }
    });
  });

  root.querySelectorAll("[data-open-lead]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, select, label")) return;
      const lead = store.data.leads.find((item) => item.id === card.dataset.openLead);
      if (lead) openLeadForm(lead);
    });
  });

  root.querySelectorAll("[data-stage-select]").forEach((select) => {
    select.addEventListener("change", () => moveLead(select.dataset.stageSelect, select.value));
    select.addEventListener("click", (event) => event.stopPropagation());
  });

  root.querySelectorAll("[data-lead-card]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggingId = card.dataset.leadCard;
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

  root.querySelectorAll("[data-drop-stage]").forEach((column) => {
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
      if (id) moveLead(id, column.dataset.dropStage);
    });
  });
}

async function moveLead(id, stage) {
  const lead = store.data.leads.find((item) => item.id === id);
  if (!lead || lead.stage === stage) return;
  try {
    await updateRecord("leads", id, { stage });
  } catch (error) {
    console.error(error);
    toast("Could not move the lead.", "error");
  }
}

export function openLeadForm(lead = null, defaults = {}) {
  const isEdit = Boolean(lead);
  const value = lead || defaults;
  const clients = clientItems();

  openModal({
    title: isEdit ? "Edit lead" : "New lead",
    subtitle: "Customer inquiries and sales tracking.",
    body: `
      <form id="leadForm" class="form" novalidate>
        <div class="form-grid">
          <label class="field">
            <span>Contact name *</span>
            <input name="name" maxlength="80" required value="${esc(value.name || "")}" placeholder="Sara Ahmed">
          </label>
          <label class="field">
            <span>Company</span>
            <input name="company" maxlength="80" value="${esc(value.company || "")}" placeholder="Northwind Co.">
          </label>
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" value="${esc(value.email || "")}" placeholder="sara@northwind.com">
          </label>
          <label class="field">
            <span>Phone</span>
            <input name="phone" maxlength="40" value="${esc(value.phone || "")}" placeholder="+1 555 0142">
          </label>
          <label class="field">
            <span>Source</span>
            <select name="source">${options(SOURCES, value.source || "Instagram", null)}</select>
          </label>
          <label class="field">
            <span>Service interested in</span>
            <input name="service" maxlength="100" value="${esc(value.service || "")}" placeholder="Social media retainer">
          </label>
          <label class="field">
            <span>Deal value (USD)</span>
            <input name="value" type="number" min="0" step="100" value="${value.value ?? ""}" placeholder="3000">
          </label>
          <label class="field">
            <span>Stage</span>
            <select name="stage">${options(STAGES.map((stage) => ({ value: stage.key, label: stage.label })), value.stage || "new", null)}</select>
          </label>
          <label class="field">
            <span>Next follow-up</span>
            <input name="nextFollowUp" type="date" value="${esc(value.nextFollowUp || "")}">
          </label>
          <label class="field">
            <span>Converted client</span>
            <select name="clientId">${options(clients, value.clientId || "", "Not a client yet")}</select>
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <textarea name="notes" rows="3" placeholder="Needs, budget, conversation history…">${esc(value.notes || "")}</textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? "Save changes" : "Add lead"}</button>
        </div>
      </form>`,
    onMount: (modal) => {
      const form = modal.querySelector("#leadForm");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const data = {
          name: form.elements.name.value.trim(),
          company: form.elements.company.value.trim(),
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim(),
          source: form.elements.source.value,
          service: form.elements.service.value.trim(),
          value: Number(form.elements.value.value) || 0,
          stage: form.elements.stage.value,
          nextFollowUp: form.elements.nextFollowUp.value,
          clientId: form.elements.clientId.value,
          notes: form.elements.notes.value.trim()
        };

        if (!data.name) {
          toast("Add the contact's name first.", "error");
          form.elements.name.focus();
          return;
        }

        submit.disabled = true;
        submit.textContent = "Saving…";

        try {
          if (isEdit) {
            await updateRecord("leads", lead.id, data);
          } else {
            await createRecord("leads", data);
          }
          closeModal();
          toast(isEdit ? "Lead updated" : "Lead added", "success");
        } catch (error) {
          console.error(error);
          toast("Could not save the lead.", "error");
          submit.disabled = false;
          submit.textContent = isEdit ? "Save changes" : "Add lead";
        }
      });
    }
  });
}
