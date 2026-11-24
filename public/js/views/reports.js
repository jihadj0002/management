import {
  store,
  clientItems,
  clientName,
  createRecord,
  removeRecord,
  sumBy
} from "../store.js";
import {
  esc,
  icon,
  money,
  number,
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
  formatDateTime,
  toISODate,
  todayISO
} from "../ui.js";

let clientFilter = "all";
let typeFilter = "all";

export function render(root) {
  const reports = store.data.reports;
  const loading = !store.loaded.reports;

  const filtered = reports.filter((report) => {
    const matchesClient = clientFilter === "all" || report.clientId === clientFilter;
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    return matchesClient && matchesType;
  });

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Reports</h2>
        <p class="view-sub">Weekly and monthly client reports, generated from live workspace data.</p>
      </div>
      <div class="head-actions">
        <select class="mini-select" id="reportClientFilter" aria-label="Filter reports by client">
          ${options([{ value: "all", label: "All clients" }, ...clientItems()], clientFilter, null)}
        </select>
        <select class="mini-select" id="reportTypeFilter" aria-label="Filter reports by type">
          ${options([{ value: "all", label: "All types" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }], typeFilter, null)}
        </select>
        <button class="btn btn-primary" type="button" data-action="new-report">${icon("plus")} Generate report</button>
      </div>
    </div>

    ${loading
      ? skeletonRows(3)
      : filtered.length
        ? `<div class="report-grid">${filtered.map(reportCard).join("")}</div>`
        : emptyState(
            reports.length ? "No reports match" : "No reports yet",
            reports.length
              ? "Try another client or report type."
              : "Generate a weekly or monthly report to snapshot performance for a client.",
            reports.length
              ? ""
              : `<button type="button" class="btn btn-primary" data-action="new-report">${icon("plus")} Generate report</button>`
          )}`;

  bind(root);
}

function reportCard(report) {
  const metrics = report.metrics || {};
  const isMonthly = report.type === "monthly";

  return `
    <article class="report-card">
      <header class="report-card-head">
        <div>
          <div class="tag-row">
            ${tag(isMonthly ? "Monthly" : "Weekly", isMonthly ? "indigo" : "cyan")}
            <span class="report-period">${esc(periodLabel(report))}</span>
          </div>
          <h3>${esc(report.title || `${clientName(report.clientId, "Workspace")} report`)}</h3>
          <p>${esc(clientName(report.clientId, report.clientLabel || "Workspace"))} · generated ${esc(formatDateTime(report.createdAt))}</p>
        </div>
        <button type="button" class="icon-btn icon-sm" data-view-report="${esc(report.id)}" aria-label="Open report">${icon("right")}</button>
      </header>
      <div class="report-mini-metrics">
        <div><span>Reach</span><strong>${number(metrics.reach, true)}</strong></div>
        <div><span>Engagement</span><strong>${number(metrics.engagement, true)}</strong></div>
        <div><span>Tasks done</span><strong>${number(metrics.tasksCompleted)}</strong></div>
        <div><span>Published</span><strong>${number(metrics.contentPublished)}</strong></div>
      </div>
      <footer class="report-card-foot">
        <span>${metrics.revenue ? `${money(metrics.revenue)} revenue` : "No revenue recorded"}</span>
        <button type="button" class="text-link" data-view-report="${esc(report.id)}">View report →</button>
      </footer>
    </article>`;
}

function periodLabel(report) {
  if (!report.startDate || !report.endDate) return "No period";
  return `${formatDate(report.startDate, { month: "short", day: "numeric", year: "numeric" })} – ${formatDate(report.endDate, { month: "short", day: "numeric", year: "numeric" })}`;
}

function bind(root) {
  root.querySelectorAll("[data-action='new-report']").forEach((button) => {
    button.addEventListener("click", () => openReportForm());
  });

  const clientSelect = root.querySelector("#reportClientFilter");
  if (clientSelect) {
    clientSelect.addEventListener("change", () => {
      clientFilter = clientSelect.value;
      render(root);
    });
  }

  const typeSelect = root.querySelector("#reportTypeFilter");
  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      typeFilter = typeSelect.value;
      render(root);
    });
  }

  root.querySelectorAll("[data-view-report]").forEach((element) => {
    element.addEventListener("click", () => {
      const report = store.data.reports.find((item) => item.id === element.dataset.viewReport);
      if (report) openReportView(report);
    });
  });
}

function defaultRange(type) {
  const today = new Date();
  if (type === "monthly") {
    return {
      start: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
      end: todayISO()
    };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return { start: toISODate(start), end: todayISO() };
}

export function openReportForm() {
  const clients = clientItems();
  const range = defaultRange("weekly");

  openModal({
    title: "Generate report",
    subtitle: "Snapshot performance from tasks, content and analytics.",
    wide: true,
    body: `
      <form id="reportForm" class="form" novalidate>
        ${clients.length ? "" : `<div class="alert alert-info">Add a client first so the report has something to attach to.</div>`}
        <div class="form-grid">
          <label class="field">
            <span>Client *</span>
            <select name="clientId" required>${options(clients, "", "Choose a client")}</select>
          </label>
          <label class="field">
            <span>Report type</span>
            <select name="type">${options([{ value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }], "weekly", null)}</select>
          </label>
          <label class="field">
            <span>Period start</span>
            <input name="startDate" type="date" value="${range.start}">
          </label>
          <label class="field">
            <span>Period end</span>
            <input name="endDate" type="date" value="${range.end}">
          </label>
        </div>
        <label class="field">
          <span>Report title</span>
          <input name="title" maxlength="140" placeholder="Leave blank to auto-generate">
        </label>
        <label class="field">
          <span>Summary &amp; highlights</span>
          <textarea name="summary" rows="4" placeholder="Wins, challenges, priorities for the next period…"></textarea>
        </label>
        <p class="form-note">Metrics are calculated when you generate the report. Tasks and content are counted by their dates; analytics by month.</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary"${clients.length ? "" : " disabled"}>${icon("file")} Generate report</button>
        </div>
      </form>`,
    onMount: (modal) => {
      const form = modal.querySelector("#reportForm");
      const typeField = form.elements.type;

      typeField.addEventListener("change", () => {
        const next = defaultRange(typeField.value);
        form.elements.startDate.value = next.start;
        form.elements.endDate.value = next.end;
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const clientId = form.elements.clientId.value;
        const type = form.elements.type.value;
        const startDate = form.elements.startDate.value;
        const endDate = form.elements.endDate.value;

        if (!clientId) {
          toast("Choose a client for the report.", "error");
          return;
        }
        if (!startDate || !endDate || startDate > endDate) {
          toast("Choose a valid date range.", "error");
          return;
        }

        const metrics = computeMetrics(clientId, startDate, endDate);
        const label = clientName(clientId, "Workspace");
        const title = form.elements.title.value.trim()
          || `${label} ${type} report · ${formatDate(startDate)} – ${formatDate(endDate)}`;

        const data = {
          clientId,
          clientLabel: label,
          type,
          startDate,
          endDate,
          title,
          summary: form.elements.summary.value.trim(),
          metrics
        };

        submit.disabled = true;
        submit.textContent = "Generating…";

        try {
          await createRecord("reports", data);
          closeModal();
          toast("Report generated", "success");
        } catch (error) {
          console.error(error);
          toast("Could not generate the report.", "error");
          submit.disabled = false;
          submit.innerHTML = `${icon("file")} Generate report`;
        }
      });
    }
  });
}

function computeMetrics(clientId, startDate, endDate) {
  const inRange = (iso) => Boolean(iso) && iso >= startDate && iso <= endDate;
  const monthInRange = (month) => Boolean(month) && month >= startDate.slice(0, 7) && month <= endDate.slice(0, 7);

  const tasks = store.data.tasks.filter((task) => task.clientId === clientId && inRange(task.dueDate));
  const content = store.data.content.filter(
    (item) => item.clientId === clientId && inRange(item.date)
  );
  const analytics = store.data.analytics.filter(
    (row) => row.clientId === clientId && monthInRange(row.month)
  );

  const reach = sumBy(analytics, "reach");
  const engagement = sumBy(analytics, "engagement");
  const adSpend = sumBy(analytics, "adSpend");
  const conversions = sumBy(analytics, "conversions");
  const revenue = sumBy(analytics, "revenue");

  return {
    reach,
    engagement,
    engagementRate: reach ? (engagement / reach) * 100 : 0,
    adSpend,
    conversions,
    revenue,
    roas: adSpend ? revenue / adSpend : 0,
    tasksCompleted: tasks.filter((task) => task.status === "done").length,
    tasksOpen: tasks.filter((task) => task.status !== "done").length,
    contentPlanned: content.length,
    contentPublished: content.filter((item) => item.status === "published").length
  };
}

export function openReportView(report) {
  openModal({
    title: "Report preview",
    subtitle: `${clientName(report.clientId, report.clientLabel || "Workspace")} · ${periodLabel(report)}`,
    wide: true,
    body: `
      ${reportBody(report)}
      <div class="modal-actions">
        <button type="button" class="btn btn-danger-ghost" data-delete-report>${icon("trash")} Delete</button>
        <div class="actions-right">
          <button type="button" class="btn btn-ghost" data-modal-close>Close</button>
          <button type="button" class="btn btn-primary" data-print-report>${icon("print")} Print / PDF</button>
        </div>
      </div>`,
    onMount: (modal) => {
      modal.querySelector("[data-print-report]").addEventListener("click", () => printReport(report));
      modal.querySelector("[data-delete-report]").addEventListener("click", async () => {
        const confirmed = await confirmAction({
          title: "Delete report?",
          message: "This report snapshot will be permanently removed.",
          confirmLabel: "Delete report"
        });
        if (!confirmed) return;
        try {
          await removeRecord("reports", report.id);
          closeModal();
          toast("Report deleted", "success");
        } catch (error) {
          console.error(error);
          toast("Could not delete the report.", "error");
        }
      });
    }
  });
}

function reportBody(report) {
  const metrics = report.metrics || {};
  const rate = metrics.engagementRate ?? (metrics.reach ? (metrics.engagement / metrics.reach) * 100 : 0);

  return `
    <div class="report-doc">
      <header class="report-doc-head">
        <div>
          <p class="eyebrow">${esc(report.type === "monthly" ? "Monthly report" : "Weekly report")}</p>
          <h3>${esc(report.title || "Client report")}</h3>
          <p>${esc(clientName(report.clientId, report.clientLabel || "Workspace"))} · ${esc(periodLabel(report))}</p>
        </div>
        <div class="report-generated">Generated ${esc(formatDateTime(report.createdAt))}</div>
      </header>

      <div class="report-metrics">
        <div><span>Reach</span><strong>${number(metrics.reach)}</strong></div>
        <div><span>Engagement rate</span><strong>${pct(rate, 1)}</strong></div>
        <div><span>Ad spend</span><strong>${money(metrics.adSpend)}</strong></div>
        <div><span>Conversions</span><strong>${number(metrics.conversions)}</strong></div>
        <div><span>Revenue</span><strong>${money(metrics.revenue)}</strong></div>
        <div><span>ROAS</span><strong>${metrics.roas ? `${Number(metrics.roas).toFixed(1)}×` : "—"}</strong></div>
        <div><span>Tasks completed</span><strong>${number(metrics.tasksCompleted)}</strong></div>
        <div><span>Tasks open</span><strong>${number(metrics.tasksOpen)}</strong></div>
        <div><span>Content planned</span><strong>${number(metrics.contentPlanned)}</strong></div>
        <div><span>Content published</span><strong>${number(metrics.contentPublished)}</strong></div>
      </div>

      <div class="report-summary">
        <h4>Summary &amp; highlights</h4>
        <p class="pre-line">${esc(report.summary || "No summary was added to this report.")}</p>
      </div>
    </div>`;
}

function printReport(report) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    toast("Allow pop-ups to print reports.", "error");
    return;
  }

  win.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${esc(report.title || "Client report")}</title>
      <style>
        body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.5; }
        h1, h2, h3, h4, p { margin: 0; }
        .head { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
        .eyebrow { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #6366f1; font-weight: 700; }
        h1 { font-size: 24px; margin-top: 6px; }
        .meta { color: #64748b; font-size: 13px; margin-top: 6px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
        .metric { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
        .metric span { display: block; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #64748b; }
        .metric strong { font-size: 18px; }
        h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; margin-bottom: 8px; }
        .summary { white-space: pre-line; font-size: 14px; }
        .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div class="head">
        <p class="eyebrow">${esc(report.type === "monthly" ? "Monthly report" : "Weekly report")}</p>
        <h1>${esc(report.title || "Client report")}</h1>
        <p class="meta">${esc(clientName(report.clientId, report.clientLabel || "Workspace"))} · ${esc(periodLabel(report))} · generated ${esc(formatDateTime(report.createdAt))}</p>
      </div>
      <div class="grid">
        <div class="metric"><span>Reach</span><strong>${number(report.metrics?.reach)}</strong></div>
        <div class="metric"><span>Engagement rate</span><strong>${pct(report.metrics?.engagementRate ?? 0, 1)}</strong></div>
        <div class="metric"><span>Ad spend</span><strong>${money(report.metrics?.adSpend)}</strong></div>
        <div class="metric"><span>Conversions</span><strong>${number(report.metrics?.conversions)}</strong></div>
        <div class="metric"><span>Revenue</span><strong>${money(report.metrics?.revenue)}</strong></div>
        <div class="metric"><span>ROAS</span><strong>${report.metrics?.roas ? `${Number(report.metrics.roas).toFixed(1)}×` : "—"}</strong></div>
        <div class="metric"><span>Tasks completed</span><strong>${number(report.metrics?.tasksCompleted)}</strong></div>
        <div class="metric"><span>Tasks open</span><strong>${number(report.metrics?.tasksOpen)}</strong></div>
        <div class="metric"><span>Content published</span><strong>${number(report.metrics?.contentPublished)}</strong></div>
        <div class="metric"><span>Content planned</span><strong>${number(report.metrics?.contentPlanned)}</strong></div>
      </div>
      <h2>Summary &amp; highlights</h2>
      <p class="summary">${esc(report.summary || "No summary was added to this report.")}</p>
      <p class="footer">Generated from the Management workspace.</p>
    </body>
    </html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 250);
}
