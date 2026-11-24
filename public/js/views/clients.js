import { store, createRecord, updateRecord, removeRecord } from "../store.js";
import {
  esc,
  icon,
  money,
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
  todayISO
} from "../ui.js";

const STATUS = {
  active: ["Active", "green"],
  paused: ["Paused", "amber"],
  lead: ["Lead", "blue"]
};

let search = "";
let statusFilter = "all";

export function render(root) {
  const clients = store.data.clients;
  const loading = !store.loaded.clients;

  const filtered = clients.filter((client) => {
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const haystack = [client.name, client.company, client.email, client.services]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && (!search || haystack.includes(search));
  });

  const counts = {
    all: clients.length,
    active: clients.filter((client) => client.status === "active").length,
    paused: clients.filter((client) => client.status === "paused").length,
    lead: clients.filter((client) => client.status === "lead").length
  };

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Clients</h2>
        <p class="view-sub">Client information, access and requirements.</p>
      </div>
      <div class="head-actions">
        <label class="search">
          ${icon("search")}
          <input id="clientSearch" data-focus-key="client-search" type="search" placeholder="Search clients…" value="${esc(search)}" aria-label="Search clients">
        </label>
        <button class="btn btn-primary" type="button" data-action="new-client">${icon("plus")} Add client</button>
      </div>
    </div>

    <div class="filter-row">
      ${["all", "active", "paused", "lead"].map((key) => `
        <button type="button" class="chip${statusFilter === key ? " is-active" : ""}" data-status="${key}">
          ${key === "all" ? "All clients" : STATUS[key][0]} <span>${counts[key]}</span>
        </button>`).join("")}
    </div>

    ${loading
      ? skeletonRows(3)
      : filtered.length
        ? `<div class="client-grid">${filtered.map(clientCard).join("")}</div>`
        : emptyState(
            clients.length ? "No clients match" : "No clients yet",
            clients.length ? "Try a different search or status filter." : "Add your first client to start tracking work, content and reports.",
            clients.length ? "" : `<button type="button" class="btn btn-primary" data-action="new-client">${icon("plus")} Add client</button>`
          )}`;

  const searchInput = root.querySelector("#clientSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      search = searchInput.value.trim().toLowerCase();
      render(root);
      const next = root.querySelector("#clientSearch");
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    });
  }

  root.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      statusFilter = button.dataset.status;
      render(root);
    });
  });

  root.querySelectorAll("[data-action='new-client']").forEach((button) => {
    button.addEventListener("click", () => openClientForm());
  });

  root.querySelectorAll("[data-open-client]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      openClientDetail(card.dataset.openClient);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openClientDetail(card.dataset.openClient);
    });
  });
}

function clientCard(client) {
  const status = STATUS[client.status] || STATUS.active;
  const openTasks = store.data.tasks.filter(
    (task) => task.clientId === client.id && task.status !== "done"
  ).length;
  const activeContent = store.data.content.filter(
    (item) => item.clientId === client.id && item.status !== "published"
  ).length;
  const services = splitServices(client.services);

  return `
    <article class="client-card" data-open-client="${esc(client.id)}" tabindex="0" role="button" aria-label="Open ${esc(client.name)}">
      <header class="client-card-head">
        <span class="avatar avatar-soft avatar-lg">${esc(initials(client.name))}</span>
        <div class="client-card-title">
          <h3>${esc(client.name || "Untitled client")}</h3>
          <p>${esc(client.company || "No company")}</p>
        </div>
        ${tag(status[0], status[1])}
      </header>

      <div class="client-stats">
        <div><span>Retainer</span><strong>${client.retainer ? money(client.retainer) : "—"}${client.retainer ? "<small>/mo</small>" : ""}</strong></div>
        <div><span>Open tasks</span><strong>${openTasks}</strong></div>
        <div><span>Active content</span><strong>${activeContent}</strong></div>
      </div>

      ${services.length
        ? `<div class="tag-row">${services.slice(0, 3).map((service) => tag(service, "slate")).join("")}${services.length > 3 ? tag(`+${services.length - 3}`, "slate") : ""}</div>`
        : ""}

      <footer class="client-card-foot">
        <span>${esc(client.email || "No email on file")}</span>
        <span class="text-link">View profile →</span>
      </footer>
    </article>`;
}

export function openClientDetail(id) {
  const client = store.data.clients.find((item) => item.id === id);
  if (!client) return;

  const status = STATUS[client.status] || STATUS.active;
  const tasks = store.data.tasks.filter((task) => task.clientId === client.id);
  const openTasks = tasks.filter((task) => task.status !== "done");
  const items = store.data.content.filter((item) => item.clientId === client.id);
  const reports = store.data.reports.filter((report) => report.clientId === client.id);
  const analytics = store.data.analytics.filter((row) => row.clientId === client.id);
  const services = splitServices(client.services);

  openModal({
    title: "Client profile",
    subtitle: "Retainer, access and requirements.",
    wide: true,
    body: `
      <div class="profile-head">
        <span class="avatar avatar-soft avatar-lg">${esc(initials(client.name))}</span>
        <div class="profile-id">
          <h3>${esc(client.name || "Untitled client")}</h3>
          <p>${esc(client.company || "No company")} ${tag(status[0], status[1])}</p>
        </div>
      </div>

      <div class="profile-stats">
        <div><span>Retainer</span><strong>${client.retainer ? money(client.retainer) : "—"}</strong></div>
        <div><span>Open tasks</span><strong>${openTasks.length}</strong></div>
        <div><span>Content items</span><strong>${items.length}</strong></div>
        <div><span>Reports</span><strong>${reports.length}</strong></div>
      </div>

      <div class="detail-grid">
        <div class="detail-block">
          <h4>Contact</h4>
          <p>${esc(client.email || "No email")}</p>
          <p>${esc(client.phone || "No phone")}</p>
          <p>Started ${esc(client.startDate ? formatDate(client.startDate, { month: "short", day: "numeric", year: "numeric" }) : "—")}</p>
        </div>
        <div class="detail-block">
          <h4>Services</h4>
          ${services.length ? `<div class="tag-row">${services.map((service) => tag(service, "indigo")).join("")}</div>` : `<p>No services listed.</p>`}
        </div>
      </div>

      <div class="detail-block">
        <h4>Access details</h4>
        <p class="pre-line">${esc(client.access || "No access notes yet.")}</p>
      </div>

      <div class="detail-block">
        <h4>Requirements &amp; notes</h4>
        <p class="pre-line">${esc(client.requirements || "No requirements captured yet.")}</p>
      </div>

      <div class="detail-block detail-block-muted">
        <h4>Analytics on file</h4>
        <p>${analytics.length ? `${analytics.length} monthly entr${analytics.length === 1 ? "y" : "ies"} recorded.` : "No analytics recorded yet."}</p>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-danger-ghost" data-delete>${icon("trash")} Delete client</button>
        <div class="actions-right">
          <button type="button" class="btn btn-ghost" data-modal-close>Close</button>
          <button type="button" class="btn btn-primary" data-edit>${icon("edit")} Edit client</button>
        </div>
      </div>`,
    onMount: (modal) => {
      modal.querySelector("[data-edit]").addEventListener("click", () => {
        closeModal();
        openClientForm(client);
      });
      modal.querySelector("[data-delete]").addEventListener("click", async () => {
        const confirmed = await confirmAction({
          title: "Delete client?",
          message: `This removes ${client.name || "this client"}. Tasks, content and reports stay in the workspace but lose their client link.`,
          confirmLabel: "Delete client"
        });
        if (!confirmed) return;
        try {
          await removeRecord("clients", client.id);
          closeModal();
          toast("Client deleted", "success");
        } catch (error) {
          console.error(error);
          toast("Could not delete client.", "error");
        }
      });
    }
  });
}

export function openClientForm(client = null) {
  const isEdit = Boolean(client);
  const value = client || {};

  openModal({
    title: isEdit ? "Edit client" : "New client",
    subtitle: "Client information, access and requirements.",
    wide: true,
    body: `
      <form id="clientForm" class="form" novalidate>
        <div class="form-grid">
          <label class="field">
            <span>Client name *</span>
            <input name="name" maxlength="80" required value="${esc(value.name || "")}" placeholder="Amina Yusuf">
          </label>
          <label class="field">
            <span>Company</span>
            <input name="company" maxlength="80" value="${esc(value.company || "")}" placeholder="Acme Studio">
          </label>
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" value="${esc(value.email || "")}" placeholder="hello@acme.com">
          </label>
          <label class="field">
            <span>Phone</span>
            <input name="phone" maxlength="40" value="${esc(value.phone || "")}" placeholder="+1 555 0100">
          </label>
          <label class="field">
            <span>Status</span>
            <select name="status">${options(
              [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "lead", label: "Lead" }],
              value.status || "active",
              null
            )}</select>
          </label>
          <label class="field">
            <span>Monthly retainer (USD)</span>
            <input name="retainer" type="number" min="0" step="50" value="${value.retainer ?? ""}" placeholder="2500">
          </label>
          <label class="field">
            <span>Start date</span>
            <input name="startDate" type="date" value="${esc(value.startDate || todayISO())}">
          </label>
          <label class="field">
            <span>Services</span>
            <input name="services" value="${esc(value.services || "")}" placeholder="Social media, content, paid ads">
          </label>
        </div>
        <label class="field">
          <span>Access details</span>
          <textarea name="access" rows="3" placeholder="Platform logins, shared drive links, brand assets, approval contacts…">${esc(value.access || "")}</textarea>
        </label>
        <label class="field">
          <span>Requirements &amp; notes</span>
          <textarea name="requirements" rows="3" placeholder="Deliverables, brand rules, reporting cadence, anything the team must know…">${esc(value.requirements || "")}</textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? "Save changes" : "Create client"}</button>
        </div>
      </form>`,
    onMount: (modal) => {
      const form = modal.querySelector("#clientForm");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const data = {
          name: form.elements.name.value.trim(),
          company: form.elements.company.value.trim(),
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim(),
          status: form.elements.status.value,
          retainer: Number(form.elements.retainer.value) || 0,
          startDate: form.elements.startDate.value,
          services: form.elements.services.value.trim(),
          access: form.elements.access.value.trim(),
          requirements: form.elements.requirements.value.trim()
        };

        if (!data.name) {
          toast("Add the client's name first.", "error");
          form.elements.name.focus();
          return;
        }

        submit.disabled = true;
        submit.textContent = "Saving…";

        try {
          if (isEdit) {
            await updateRecord("clients", client.id, data);
          } else {
            await createRecord("clients", data);
          }
          closeModal();
          toast(isEdit ? "Client updated" : "Client added", "success");
        } catch (error) {
          console.error(error);
          toast("Could not save the client.", "error");
          submit.disabled = false;
          submit.textContent = isEdit ? "Save changes" : "Create client";
        }
      });
    }
  });
}

function splitServices(value) {
  return String(value || "")
    .split(",")
    .map((service) => service.trim())
    .filter(Boolean);
}
