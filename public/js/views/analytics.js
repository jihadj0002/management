import {
  store,
  clientItems,
  clientName,
  createRecord,
  updateRecord,
  removeRecord,
  sumBy
} from "../store.js";
import {
  esc,
  icon,
  money,
  number,
  pct,
  options,
  openModal,
  closeModal,
  confirmAction,
  toast,
  emptyState,
  currentMonth,
  formatMonth
} from "../ui.js";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook", "Google Ads", "Other"];

let month = currentMonth();
let clientFilter = "all";

export function render(root) {
  const rows = store.data.analytics;
  const loading = !store.loaded.analytics;
  const clients = clientItems();

  const filtered = rows
    .filter((row) => row.month === month)
    .filter((row) => clientFilter === "all" || row.clientId === clientFilter)
    .sort((a, b) => (Number(b.reach) || 0) - (Number(a.reach) || 0));

  const reach = sumBy(filtered, "reach");
  const engagement = sumBy(filtered, "engagement");
  const adSpend = sumBy(filtered, "adSpend");
  const conversions = sumBy(filtered, "conversions");
  const revenue = sumBy(filtered, "revenue");
  const engagementRate = reach ? (engagement / reach) * 100 : 0;
  const roas = adSpend ? revenue / adSpend : 0;

  const platformMap = new Map();
  filtered.forEach((row) => {
    const key = row.platform || "Other";
    platformMap.set(key, (platformMap.get(key) || 0) + (Number(row.reach) || 0));
  });
  const platformRows = Array.from(platformMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const maxPlatform = Math.max(...platformRows.map((row) => row.value), 1);

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Analytics</h2>
        <p class="view-sub">Reach, engagement, ads and conversions by month.</p>
      </div>
      <div class="head-actions">
        <input class="mini-input" id="analyticsMonth" type="month" value="${esc(month)}" aria-label="Analytics month">
        <select class="mini-select" id="analyticsClient" aria-label="Filter by client">
          ${options([{ value: "all", label: "All clients" }, ...clients], clientFilter, null)}
        </select>
        <button class="btn btn-primary" type="button" data-action="new-metric">${icon("plus")} Add metrics</button>
      </div>
    </div>

    <section class="kpi-grid kpi-grid-3">
      <article class="kpi">
        <p class="kpi-label">Reach</p>
        <p class="kpi-value">${number(reach, true)}</p>
        <p class="kpi-hint">${esc(formatMonth(month))}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Engagement</p>
        <p class="kpi-value">${pct(engagementRate, 1)}</p>
        <p class="kpi-hint">${number(engagement, true)} interactions</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Ad spend</p>
        <p class="kpi-value">${money(adSpend, true)}</p>
        <p class="kpi-hint">${roas ? `${roas.toFixed(1)}× ROAS` : "No spend recorded"}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Conversions</p>
        <p class="kpi-value">${number(conversions, true)}</p>
        <p class="kpi-hint">${filtered.length} entr${filtered.length === 1 ? "y" : "ies"} this month</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Revenue</p>
        <p class="kpi-value">${money(revenue, true)}</p>
        <p class="kpi-hint">Attributed to channels</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Revenue / conversion</p>
        <p class="kpi-value">${conversions ? money(revenue / conversions) : "—"}</p>
        <p class="kpi-hint">Average order value</p>
      </article>
    </section>

    ${loading
      ? `<div class="card"><p class="muted-note">Loading analytics…</p></div>`
      : filtered.length
        ? `<section class="grid-2 grid-wide-left">
            <article class="card">
              <header class="card-head"><div><h3>Reach by channel</h3><p>${esc(formatMonth(month))}</p></div></header>
              <ul class="pipeline-list">
                ${platformRows.map((row) => `
                  <li>
                    <div class="pipeline-row">
                      <span class="pipeline-label">${esc(row.label)}</span>
                      <span class="pipeline-meta">${number(row.value)}</span>
                    </div>
                    <div class="bar-track"><span class="bar-fill tone-cyan" style="width:${Math.max(4, Math.round((row.value / maxPlatform) * 100))}%"></span></div>
                  </li>`).join("")}
              </ul>
            </article>
            <article class="card">
              <header class="card-head"><div><h3>Month summary</h3><p>Totals across selected filters</p></div></header>
              <dl class="summary-list">
                <div><dt>Total reach</dt><dd>${number(reach)}</dd></div>
                <div><dt>Engagement</dt><dd>${number(engagement)}</dd></div>
                <div><dt>Ad spend</dt><dd>${money(adSpend)}</dd></div>
                <div><dt>Conversions</dt><dd>${number(conversions)}</dd></div>
                <div><dt>Revenue</dt><dd>${money(revenue)}</dd></div>
              </dl>
            </article>
          </section>

          <section class="card">
            <header class="card-head"><div><h3>Monthly entries</h3><p>${filtered.length} record${filtered.length === 1 ? "" : "s"} for ${esc(formatMonth(month))}</p></div></header>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr><th>Client</th><th>Channel</th><th>Reach</th><th>Engagement</th><th>Spend</th><th>Conversions</th><th>Revenue</th><th></th></tr>
                </thead>
                <tbody>
                  ${filtered.map((row) => `
                    <tr>
                      <td>${esc(clientName(row.clientId, "Workspace"))}</td>
                      <td>${esc(row.platform || "—")}</td>
                      <td>${number(row.reach)}</td>
                      <td>${number(row.engagement)}</td>
                      <td>${money(row.adSpend)}</td>
                      <td>${number(row.conversions)}</td>
                      <td>${money(row.revenue)}</td>
                      <td class="table-actions">
                        <button type="button" class="icon-btn icon-xs" data-edit-metric="${esc(row.id)}" aria-label="Edit entry">${icon("edit")}</button>
                        <button type="button" class="icon-btn icon-xs" data-delete-metric="${esc(row.id)}" aria-label="Delete entry">${icon("trash")}</button>
                      </td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>
          </section>`
        : emptyState(
            "No analytics for this view",
            `Nothing recorded for ${formatMonth(month)}${clientFilter === "all" ? "" : " for this client"}. Add reach, engagement and conversion numbers to build the report.`,
            `<button type="button" class="btn btn-primary" data-action="new-metric">${icon("plus")} Add metrics</button>`
          )}`;

  bind(root);
}

function bind(root) {
  root.querySelectorAll("[data-action='new-metric']").forEach((button) => {
    button.addEventListener("click", () => openMetricForm(null, { month }));
  });

  const monthInput = root.querySelector("#analyticsMonth");
  if (monthInput) {
    monthInput.addEventListener("change", () => {
      month = monthInput.value || currentMonth();
      render(root);
    });
  }

  const clientSelect = root.querySelector("#analyticsClient");
  if (clientSelect) {
    clientSelect.addEventListener("change", () => {
      clientFilter = clientSelect.value;
      render(root);
    });
  }

  root.querySelectorAll("[data-edit-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = store.data.analytics.find((item) => item.id === button.dataset.editMetric);
      if (row) openMetricForm(row);
    });
  });

  root.querySelectorAll("[data-delete-metric]").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = store.data.analytics.find((item) => item.id === button.dataset.deleteMetric);
      if (!row) return;
      const confirmed = await confirmAction({
        title: "Delete analytics entry?",
        message: `${clientName(row.clientId, "Workspace")} · ${row.platform || "Other"} for ${formatMonth(row.month)} will be removed.`,
        confirmLabel: "Delete entry"
      });
      if (!confirmed) return;
      try {
        await removeRecord("analytics", row.id);
        toast("Analytics entry deleted", "success");
      } catch (error) {
        console.error(error);
        toast("Could not delete the entry.", "error");
      }
    });
  });
}

export function openMetricForm(row = null, defaults = {}) {
  const isEdit = Boolean(row);
  const value = row || defaults;
  const clients = clientItems();

  openModal({
    title: isEdit ? "Edit metrics" : "Add monthly metrics",
    subtitle: "Reach, engagement, ads and conversions.",
    body: `
      <form id="metricForm" class="form" novalidate>
        <div class="form-grid">
          <label class="field">
            <span>Month *</span>
            <input name="month" type="month" required value="${esc(value.month || currentMonth())}">
          </label>
          <label class="field">
            <span>Client</span>
            <select name="clientId">${options(clients, value.clientId || "", "No client")}</select>
          </label>
          <label class="field">
            <span>Channel</span>
            <select name="platform">${options(PLATFORMS, value.platform || "Instagram", null)}</select>
          </label>
          <label class="field">
            <span>Reach</span>
            <input name="reach" type="number" min="0" step="1" value="${value.reach ?? ""}" placeholder="0">
          </label>
          <label class="field">
            <span>Engagement</span>
            <input name="engagement" type="number" min="0" step="1" value="${value.engagement ?? ""}" placeholder="0">
          </label>
          <label class="field">
            <span>Ad spend (USD)</span>
            <input name="adSpend" type="number" min="0" step="10" value="${value.adSpend ?? ""}" placeholder="0">
          </label>
          <label class="field">
            <span>Conversions</span>
            <input name="conversions" type="number" min="0" step="1" value="${value.conversions ?? ""}" placeholder="0">
          </label>
          <label class="field">
            <span>Revenue (USD)</span>
            <input name="revenue" type="number" min="0" step="10" value="${value.revenue ?? ""}" placeholder="0">
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <textarea name="notes" rows="2" placeholder="Campaign highlights, anomalies, context…">${esc(value.notes || "")}</textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? "Save changes" : "Save metrics"}</button>
        </div>
      </form>`,
    onMount: (modal) => {
      const form = modal.querySelector("#metricForm");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const data = {
          month: form.elements.month.value,
          clientId: form.elements.clientId.value,
          platform: form.elements.platform.value,
          reach: Number(form.elements.reach.value) || 0,
          engagement: Number(form.elements.engagement.value) || 0,
          adSpend: Number(form.elements.adSpend.value) || 0,
          conversions: Number(form.elements.conversions.value) || 0,
          revenue: Number(form.elements.revenue.value) || 0,
          notes: form.elements.notes.value.trim()
        };

        if (!data.month) {
          toast("Choose the month for these metrics.", "error");
          return;
        }

        submit.disabled = true;
        submit.textContent = "Saving…";

        try {
          if (isEdit) {
            await updateRecord("analytics", row.id, data);
          } else {
            await createRecord("analytics", data);
          }
          closeModal();
          if (!isEdit) month = data.month;
          toast(isEdit ? "Metrics updated" : "Metrics added", "success");
        } catch (error) {
          console.error(error);
          toast("Could not save the metrics.", "error");
          submit.disabled = false;
          submit.textContent = isEdit ? "Save changes" : "Save metrics";
        }
      });
    }
  });
}
