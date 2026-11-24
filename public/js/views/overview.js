import { store, clientName, sumBy } from "../store.js";
import {
  esc,
  icon,
  money,
  number,
  tag,
  todayISO,
  currentMonth,
  formatDate,
  initials,
  toISODate
} from "../ui.js";
import { openTaskForm } from "./tasks.js";
import { openClientForm } from "./clients.js";

const PIPELINE = {
  new: ["New inquiry", "blue"],
  contacted: ["Contacted", "purple"],
  proposal: ["Proposal", "amber"],
  won: ["Won", "green"],
  lost: ["Lost", "red"]
};

const CLIENT_STATUS = {
  active: ["Active", "green"],
  paused: ["Paused", "amber"],
  lead: ["Lead", "blue"]
};

export function render(root) {
  const { clients, tasks, content, analytics, leads } = store.data;
  const loading = !store.loaded.clients || !store.loaded.tasks || !store.loaded.analytics || !store.loaded.leads;
  const today = todayISO();
  const month = currentMonth();

  const activeClients = clients.filter((client) => client.status === "active");
  const openTasks = tasks.filter((task) => task.status !== "done");
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < today);
  const monthRevenue = analytics
    .filter((row) => row.month === month)
    .reduce((total, row) => total + (Number(row.revenue) || 0), 0);
  const openLeads = leads.filter((lead) => lead.stage !== "won" && lead.stage !== "lost");
  const openLeadValue = sumBy(openLeads, "value");

  const agenda = buildAgenda(tasks, content, today);
  const months = lastMonths(6);
  const reachSeries = months.map((entry) => ({
    ...entry,
    reach: analytics
      .filter((row) => row.month === entry.key)
      .reduce((total, row) => total + (Number(row.reach) || 0), 0)
  }));
  const maxReach = Math.max(...reachSeries.map((entry) => entry.reach), 1);

  const pipelineRows = Object.entries(PIPELINE).map(([stage, meta]) => {
    const rows = leads.filter((lead) => lead.stage === stage);
    return { stage, label: meta[0], tone: meta[1], count: rows.length, value: sumBy(rows, "value") };
  });
  const maxPipeline = Math.max(...pipelineRows.map((row) => row.value), 1);

  const recentClients = clients.slice(0, 5);
  const emptyWorkspace = clients.length === 0 && tasks.length === 0;

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Workspace overview</h2>
        <p class="view-sub">${loading
          ? "Syncing your workspace…"
          : `${clients.length} client${clients.length === 1 ? "" : "s"} · ${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} · ${openLeads.length} active lead${openLeads.length === 1 ? "" : "s"}`}</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href="#/reports">${icon("file")} Reports</a>
        <button class="btn btn-primary" type="button" data-action="new-task">${icon("plus")} New task</button>
      </div>
    </div>

    ${emptyWorkspace ? welcomeCard() : ""}

    <section class="kpi-grid">
      <article class="kpi">
        <div class="kpi-icon kpi-icon-indigo">${icon("users")}</div>
        <p class="kpi-label">Active clients</p>
        <p class="kpi-value">${activeClients.length}</p>
        <p class="kpi-hint">${clients.length} total in workspace</p>
      </article>
      <article class="kpi">
        <div class="kpi-icon kpi-icon-cyan">${icon("tasks")}</div>
        <p class="kpi-label">Open tasks</p>
        <p class="kpi-value">${openTasks.length}</p>
        <p class="kpi-hint ${overdue.length ? "is-danger" : ""}">${overdue.length ? `${overdue.length} overdue` : "Nothing overdue"}</p>
      </article>
      <article class="kpi">
        <div class="kpi-icon kpi-icon-amber">${icon("trend")}</div>
        <p class="kpi-label">Open pipeline</p>
        <p class="kpi-value">${money(openLeadValue, true)}</p>
        <p class="kpi-hint">${openLeads.length} lead${openLeads.length === 1 ? "" : "s"} in progress</p>
      </article>
      <article class="kpi">
        <div class="kpi-icon kpi-icon-green">${icon("chart")}</div>
        <p class="kpi-label">Revenue this month</p>
        <p class="kpi-value">${money(monthRevenue, true)}</p>
        <p class="kpi-hint">From analytics entries</p>
      </article>
    </section>

    <section class="grid-2 grid-wide-left">
      <article class="card">
        <header class="card-head">
          <div><h3>Next up</h3><p>Deadlines and publishes in the next two weeks</p></div>
          <a class="text-link" href="#/tasks">Task board</a>
        </header>
        ${agenda.length
          ? `<ul class="agenda">${agenda.map(agendaRow).join("")}</ul>`
          : `<p class="muted-note">Nothing scheduled. Add tasks with due dates or content with publish dates.</p>`}
      </article>

      <article class="card">
        <header class="card-head">
          <div><h3>Sales pipeline</h3><p>Lead value by stage</p></div>
          <a class="text-link" href="#/leads">All leads</a>
        </header>
        <ul class="pipeline-list">
          ${pipelineRows.map((row) => `
            <li>
              <div class="pipeline-row">
                <span class="pipeline-label">${tag(row.label, row.tone)}</span>
                <span class="pipeline-meta">${row.count} · ${money(row.value, true)}</span>
              </div>
              <div class="bar-track"><span class="bar-fill tone-${row.tone}" style="width:${Math.round((row.value / maxPipeline) * 100)}%"></span></div>
            </li>`).join("")}
        </ul>
      </article>
    </section>

    <section class="grid-2 grid-wide-left">
      <article class="card">
        <header class="card-head">
          <div><h3>Reach across channels</h3><p>Total monthly reach from analytics</p></div>
          <a class="text-link" href="#/analytics">Analytics</a>
        </header>
        ${reachSeries.some((entry) => entry.reach)
          ? `<div class="chart" role="img" aria-label="Monthly reach for the last six months">
              ${reachSeries.map((entry) => `
                <div class="chart-col" title="${esc(entry.label)}: ${number(entry.reach)}">
                  <span class="chart-value">${entry.reach ? number(entry.reach, true) : ""}</span>
                  <span class="chart-bar" style="height:${Math.max(6, Math.round((entry.reach / maxReach) * 100))}%"></span>
                  <span class="chart-label">${esc(entry.label)}</span>
                </div>`).join("")}
            </div>`
          : `<p class="muted-note">No analytics yet. Add monthly reach, engagement and revenue to see the trend.</p>`}
      </article>

      <article class="card">
        <header class="card-head">
          <div><h3>Recent clients</h3><p>Newest additions to your roster</p></div>
          <a class="text-link" href="#/clients">All clients</a>
        </header>
        ${recentClients.length
          ? `<ul class="client-mini-list">
              ${recentClients.map((client) => {
                const status = CLIENT_STATUS[client.status] || ["Active", "green"];
                return `<li>
                  <span class="avatar avatar-soft">${esc(initials(client.name))}</span>
                  <div class="client-mini-main">
                    <span class="client-mini-name">${esc(client.name || "Untitled client")}</span>
                    <span class="client-mini-sub">${esc(client.company || "Independent")}</span>
                  </div>
                  ${tag(status[0], status[1])}
                </li>`;
              }).join("")}
            </ul>`
          : `<p class="muted-note">No clients yet. Add your first client to start organizing the work.</p>`}
      </article>
    </section>`;

  root.querySelector("[data-action='new-task']").addEventListener("click", () => openTaskForm());
  const addClient = root.querySelector("[data-action='new-client']");
  if (addClient) addClient.addEventListener("click", () => openClientForm());
}

function welcomeCard() {
  return `
    <section class="welcome">
      <div>
        <p class="eyebrow">Getting started</p>
        <h3>Build your workspace in three steps</h3>
        <p>Add a client, create the work, then connect analytics and reports. Everything you add is stored privately in your Firebase account.</p>
      </div>
      <div class="welcome-actions">
        <button type="button" class="btn btn-primary" data-action="new-client">${icon("plus")} Add first client</button>
        <a class="btn btn-ghost" href="#/content">Plan content</a>
      </div>
    </section>`;
}

function buildAgenda(tasks, content, today) {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 14);
  const horizonISO = toISODate(horizon);

  const rows = [
    ...tasks
      .filter((task) => task.status !== "done" && task.dueDate && task.dueDate <= horizonISO)
      .map((task) => ({
        date: task.dueDate,
        kind: "Task",
        tone: "indigo",
        title: task.title,
        clientId: task.clientId,
        overdue: task.dueDate < today
      })),
    ...content
      .filter((item) => item.status !== "published" && item.date && item.date <= horizonISO)
      .map((item) => ({
        date: item.date,
        kind: "Content",
        tone: "cyan",
        title: item.title,
        clientId: item.clientId,
        overdue: item.date < today
      }))
  ];

  return rows.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
}

function agendaRow(item) {
  return `
    <li class="agenda-row">
      <span class="date-badge ${item.overdue ? "is-overdue" : ""}">
        <strong>${esc(formatDate(item.date, { day: "numeric" }))}</strong>
        <span>${esc(formatDate(item.date, { month: "short" }))}</span>
      </span>
      <div class="agenda-main">
        <span class="agenda-title">${esc(item.title || "Untitled")}</span>
        <span class="agenda-sub">${esc(clientName(item.clientId))}</span>
      </div>
      ${tag(item.overdue ? "Overdue" : item.kind, item.overdue ? "red" : item.tone)}
    </li>`;
}

function lastMonths(count) {
  const months = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-US", { month: "short" })
    });
  }
  return months;
}
