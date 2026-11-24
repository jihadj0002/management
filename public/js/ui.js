const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

export const ICONS = {
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5.5-1 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M10 12h10m0 0-3-3m3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 10 11Zm6.5-5.7a3.2 3.2 0 0 1 0 6.1M17 14.2a3.5 3.5 0 0 1 3 3.4V19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6l1.2 1.2L7.5 4.8M4 12l1.2 1.2 2.3-2.4M4 18l1.2 1.2 2.3-2.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm0 3h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2M14 17.5h2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V5M4 20h16M8 17v-5M12.5 17V8M17 17v-8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  trend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5 9 11l3.5 3.5L20 7M20 7h-5m5 0v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3Zm9.5-12.5 3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .8 12.1A1.5 1.5 0 0 0 9.3 20h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7M10 11v5M14 11v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7v-6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4.5h2l1.2 3-1.6 1.3a11 11 0 0 0 4.6 4.6l1.3-1.6 3 1.2v2A2.5 2.5 0 0 1 15.5 17C10.3 16.5 7.5 13.7 7 8.5a2.5 2.5 0 0 1 .5-4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7.5" width="17" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12h17M11 12v2h2v-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
};

export function icon(name) {
  return ICONS[name] || "";
}

export function money(value, compact = false) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0
  }).format(amount);
}

export function number(value, compact = false) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0
  }).format(amount);
}

export function pct(value, digits = 0) {
  const amount = Number(value) || 0;
  return `${amount.toFixed(digits)}%`;
}

export function toISODate(date) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function currentMonth() {
  return todayISO().slice(0, 7);
}

export function parseISODate(iso) {
  if (!iso) return null;
  const parts = String(iso).split("-").map(Number);
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatDate(iso, options = { month: "short", day: "numeric" }) {
  const date = parseISODate(iso);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", options);
}

export function formatMonth(month) {
  const date = parseISODate(`${month}-01`);
  if (!date) return month || "—";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatDateTime(ms) {
  if (!ms) return "—";
  return new Date(Number(ms)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function relativeTime(ms) {
  if (!ms) return "just now";
  const diff = Math.max(0, Date.now() - Number(ms));
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(ms);
}

export function initials(value) {
  const words = String(value || "?").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function tag(label, tone = "slate") {
  return `<span class="tag tag-${tone}">${esc(label)}</span>`;
}

export function options(items, selectedValue, placeholder = "") {
  const head = placeholder !== null && placeholder !== undefined
    ? `<option value="">${esc(placeholder)}</option>`
    : "";
  const body = items.map((item) => {
    const value = typeof item === "string" ? item : item.value;
    const label = typeof item === "string" ? item : item.label;
    const selected = String(value) === String(selectedValue ?? "") ? " selected" : "";
    return `<option value="${esc(value)}"${selected}>${esc(label)}</option>`;
  }).join("");
  return head + body;
}

export function emptyState(title, text, action = "") {
  return `
    <div class="empty">
      <span class="empty-icon" aria-hidden="true">${icon("grid")}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      ${action ? `<div class="empty-action">${action}</div>` : ""}
    </div>`;
}

export function skeletonRows(count = 3) {
  return `<div class="skeleton-list">${Array.from({ length: count }, () => '<span class="skeleton-row"></span>').join("")}</div>`;
}

let toastTimer = null;

export function toast(message, type = "info") {
  const element = document.getElementById("toast");
  if (!element) return;
  clearTimeout(toastTimer);
  element.textContent = message;
  element.className = `toast is-${type}`;
  toastTimer = setTimeout(() => {
    element.classList.add("hidden");
  }, 3600);
}

let activeModal = null;

export function openModal({ title, subtitle = "", body, wide = false, onMount, onClose }) {
  closeModal();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal${wide ? " modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="modal-head">
        <div class="modal-heading">
          <h2>${esc(title)}</h2>
          ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
        </div>
        <button type="button" class="icon-btn icon-sm" data-modal-close aria-label="Close">${icon("close")}</button>
      </header>
      <div class="modal-body">${body}</div>
    </div>`;

  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");
  activeModal = overlay;
  activeModal.__onClose = onClose || null;

  const onKeydown = (event) => {
    if (event.key !== "Escape") return;
    if (document.querySelector(".confirm-overlay")) return;
    closeModal();
  };
  document.addEventListener("keydown", onKeydown);
  overlay.__onKeydown = onKeydown;

  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) closeModal();
  });
  overlay.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  if (typeof onMount === "function") onMount(overlay);

  const firstField = overlay.querySelector(".modal-body input:not([type='hidden']), .modal-body select, .modal-body textarea, .modal-body button");
  if (firstField) {
    window.setTimeout(() => firstField.focus(), 60);
  }
}

export function closeModal() {
  if (!activeModal) return;
  const overlay = activeModal;
  activeModal = null;
  document.removeEventListener("keydown", overlay.__onKeydown);
  overlay.remove();
  document.body.classList.remove("modal-open");
  if (typeof overlay.__onClose === "function") overlay.__onClose();
}

export function confirmAction({ title, message, confirmLabel = "Delete" }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      document.body.classList.toggle("modal-open", Boolean(document.querySelector(".modal-overlay")));
      document.removeEventListener("keydown", onKeydown);
      resolve(value);
    };

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay confirm-overlay";
    overlay.innerHTML = `
      <div class="modal modal-sm" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <header class="modal-head">
          <div class="modal-heading"><h2>${esc(title)}</h2></div>
          <button type="button" class="icon-btn icon-sm" data-no aria-label="Close">${icon("close")}</button>
        </header>
        <div class="modal-body">
          <p class="confirm-text">${esc(message)}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-no>Cancel</button>
            <button type="button" class="btn btn-danger" data-yes>${esc(confirmLabel)}</button>
          </div>
        </div>
      </div>`;

    const onKeydown = (event) => {
      if (event.key === "Escape") finish(false);
    };

    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    document.addEventListener("keydown", onKeydown);

    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) finish(false);
    });
    overlay.querySelectorAll("[data-no]").forEach((button) => {
      button.addEventListener("click", () => finish(false));
    });
    overlay.querySelector("[data-yes]").addEventListener("click", () => finish(true));
    window.setTimeout(() => overlay.querySelector("[data-yes]").focus(), 60);
  });
}
