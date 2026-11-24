import { configured, auth } from "./js/firebase.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "./vendor/firebase/13.4.0/firebase-auth.js";
import { store, startStore, stopStore } from "./js/store.js";
import { toast } from "./js/ui.js";
import * as overviewView from "./js/views/overview.js";
import * as clientsView from "./js/views/clients.js";
import * as tasksView from "./js/views/tasks.js";
import * as contentView from "./js/views/content.js";
import * as analyticsView from "./js/views/analytics.js";
import * as leadsView from "./js/views/leads.js";
import * as reportsView from "./js/views/reports.js";

window.__appBooted = true;

const ROUTES = {
  overview: { label: "Overview", eyebrow: "Workspace", view: overviewView },
  clients: { label: "Clients", eyebrow: "Manage", view: clientsView },
  tasks: { label: "Tasks", eyebrow: "Manage", view: tasksView },
  content: { label: "Content calendar", eyebrow: "Manage", view: contentView },
  analytics: { label: "Analytics", eyebrow: "Performance", view: analyticsView },
  leads: { label: "Leads & sales", eyebrow: "Performance", view: leadsView },
  reports: { label: "Reports", eyebrow: "Client service", view: reportsView }
};

const els = {
  boot: document.getElementById("loadingScreen"),
  setup: document.getElementById("setupScreen"),
  reloadSetup: document.getElementById("reloadSetup"),
  authScreen: document.getElementById("authScreen"),
  authForm: document.getElementById("authForm"),
  authTitle: document.getElementById("authTitle"),
  authSubtitle: document.getElementById("authSubtitle"),
  authError: document.getElementById("authError"),
  authSubmit: document.getElementById("authSubmit"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  forgot: document.getElementById("forgotPassword"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  dashboard: document.getElementById("dashboard"),
  sidebar: document.getElementById("sidebar"),
  sidebarScrim: document.getElementById("sidebarScrim"),
  menuBtn: document.getElementById("menuBtn"),
  userEmail: document.getElementById("userEmail"),
  userAvatar: document.getElementById("userAvatar"),
  signOut: document.getElementById("signOutBtn"),
  pageTitle: document.getElementById("pageTitle"),
  pageEyebrow: document.getElementById("pageEyebrow"),
  todayChip: document.getElementById("todayChip"),
  view: document.getElementById("view"),
  navLinks: Array.from(document.querySelectorAll("[data-route]"))
};

const state = {
  mode: "signin",
  user: null
};

function boot() {
  bindEvents();
  setDateChip();
  ensureRoute();

  if (!configured) {
    els.boot.classList.add("hidden");
    els.setup.classList.remove("hidden");
    return;
  }

  setPersistence(auth, browserLocalPersistence).catch(() => {});
  onAuthStateChanged(auth, handleUser);
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  els.authForm.addEventListener("submit", submitAuth);
  els.forgot.addEventListener("click", resetPassword);
  els.reloadSetup.addEventListener("click", () => window.location.reload());
  els.signOut.addEventListener("click", handleSignOut);
  els.menuBtn.addEventListener("click", () => toggleSidebar());
  els.sidebarScrim.addEventListener("click", () => toggleSidebar(false));

  els.navLinks.forEach((link) => {
    link.addEventListener("click", () => toggleSidebar(false));
  });

  window.addEventListener("hashchange", () => renderView({ scrollTop: true }));
}

function setDateChip() {
  els.todayChip.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function ensureRoute() {
  const route = routeFromHash();
  if (!location.hash || !ROUTES[route]) {
    history.replaceState(null, "", "#/overview");
  }
}

function routeFromHash() {
  return location.hash.replace(/^#\/?/, "").split("?")[0] || "overview";
}

function toggleSidebar(force) {
  const open = typeof force === "boolean" ? force : !document.body.classList.contains("sidebar-open");
  document.body.classList.toggle("sidebar-open", open);
}

function setMode(mode) {
  if (mode !== "signin" && mode !== "signup") return;
  state.mode = mode;
  const signup = mode === "signup";

  els.tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  els.authTitle.textContent = signup ? "Create your account" : "Welcome back";
  els.authSubtitle.textContent = signup
    ? "Set up a private workspace in seconds."
    : "Sign in to open your workspace.";
  els.authSubmit.textContent = signup ? "Create account" : "Sign in";
  els.forgot.classList.toggle("hidden", signup);
  els.password.autocomplete = signup ? "new-password" : "current-password";
  hideAuthError();
}

async function submitAuth(event) {
  event.preventDefault();
  hideAuthError();

  const email = els.email.value.trim();
  const password = els.password.value;

  if (!email) {
    showAuthError("Enter your email address.");
    els.email.focus();
    return;
  }

  if (!password) {
    showAuthError("Enter your password.");
    els.password.focus();
    return;
  }

  if (state.mode === "signup" && password.length < 6) {
    showAuthError("Use at least 6 characters for your password.");
    els.password.focus();
    return;
  }

  setAuthBusy(true);

  try {
    if (state.mode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    els.password.value = "";
  } catch (error) {
    showAuthError(authMessage(error));
  } finally {
    setAuthBusy(false);
  }
}

async function resetPassword() {
  hideAuthError();
  const email = els.email.value.trim();

  if (!email) {
    showAuthError("Enter your email first, then request a reset link.");
    els.email.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    toast("Password reset link sent to " + email, "success");
  } catch (error) {
    showAuthError(authMessage(error));
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
    toggleSidebar(false);
    toast("Signed out");
  } catch (error) {
    toast(authMessage(error), "error");
  }
}

function setAuthBusy(busy) {
  els.authSubmit.disabled = busy;
  if (busy) {
    els.authSubmit.textContent = state.mode === "signup" ? "Creating account…" : "Signing in…";
  } else {
    els.authSubmit.textContent = state.mode === "signup" ? "Create account" : "Sign in";
  }
}

function showAuthError(message) {
  els.authError.textContent = message;
  els.authError.classList.remove("hidden");
}

function hideAuthError() {
  els.authError.classList.add("hidden");
  els.authError.textContent = "";
}

function handleUser(user) {
  els.boot.classList.add("hidden");
  state.user = user;

  if (!user) {
    stopStore();
    els.dashboard.classList.add("hidden");
    els.authScreen.classList.remove("hidden");
    els.password.value = "";
    setMode("signin");
    return;
  }

  els.authScreen.classList.add("hidden");
  els.dashboard.classList.remove("hidden");

  const email = user.email || "signed-in user";
  els.userEmail.textContent = email;
  els.userEmail.title = email;
  els.userAvatar.textContent = email.charAt(0).toUpperCase();

  startStore(user.uid, () => renderView());
  renderView({ scrollTop: true });
}

function renderView({ scrollTop = false } = {}) {
  const route = ROUTES[routeFromHash()] ? routeFromHash() : "overview";
  const definition = ROUTES[route];

  els.pageTitle.textContent = definition.label;
  els.pageEyebrow.textContent = definition.eyebrow;

  els.navLinks.forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const activeElement = document.activeElement;
  const focusKey = activeElement?.dataset?.focusKey;
  const selectionStart = activeElement?.selectionStart;
  const selectionEnd = activeElement?.selectionEnd;

  els.view.innerHTML = "";

  try {
    definition.view.render(els.view);
  } catch (error) {
    console.error(error);
    els.view.innerHTML = `<div class="card"><p class="muted-note">This page hit an error. Refresh to try again.</p></div>`;
  }

  if (focusKey) {
    const next = els.view.querySelector(`[data-focus-key="${focusKey}"]`);
    if (next) {
      next.focus();
      try {
        next.setSelectionRange(selectionStart, selectionEnd);
      } catch {
        /* ignore unsupported inputs */
      }
    }
  }

  updateBadges();

  if (scrollTop) {
    window.scrollTo({ top: 0 });
  }
}

function updateBadges() {
  const taskBadge = document.querySelector('[data-badge="tasks"]');
  const openTasks = store.data.tasks.filter((task) => task.status !== "done").length;
  if (taskBadge) {
    taskBadge.textContent = String(openTasks);
    taskBadge.classList.toggle("hidden", openTasks === 0);
  }

  const leadBadge = document.querySelector('[data-badge="leads"]');
  const openLeads = store.data.leads.filter(
    (lead) => lead.stage !== "won" && lead.stage !== "lost"
  ).length;
  if (leadBadge) {
    leadBadge.textContent = String(openLeads);
    leadBadge.classList.toggle("hidden", openLeads === 0);
  }
}

function authMessage(error) {
  const code = String(error?.code || "");
  const messages = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/missing-password": "Enter your password.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/email-already-in-use": "An account already exists for this email. Try signing in.",
    "auth/user-not-found": "No account found for this email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is disabled in this Firebase project.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/unauthorized-domain": "This domain isn't authorized for Firebase Authentication."
  };
  return messages[code] || error?.message || "Something went wrong. Try again.";
}

try {
  boot();
} catch (error) {
  console.error(error);
  els.boot.classList.remove("hidden");
  const spinner = els.boot.querySelector(".spinner");
  if (spinner) spinner.classList.add("hidden");
  const message = els.boot.querySelector("p");
  if (message) {
    message.classList.add("boot-error");
    message.textContent = "The app could not start. Open the browser console for details, then reload.";
  }
}
