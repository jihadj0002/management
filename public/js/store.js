import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc
} from "../vendor/firebase/13.4.0/firebase-firestore.js";
import { toast } from "./ui.js";

export const COLLECTIONS = ["clients", "tasks", "content", "analytics", "leads", "reports"];

function blankData() {
  return {
    clients: [],
    tasks: [],
    content: [],
    analytics: [],
    leads: [],
    reports: []
  };
}

function blankLoaded() {
  return Object.fromEntries(COLLECTIONS.map((name) => [name, false]));
}

export const store = {
  uid: null,
  data: blankData(),
  loaded: blankLoaded(),
  onChange: null,
  unsubs: []
};

export function startStore(uid, onChange) {
  stopStore();
  store.uid = uid;
  store.onChange = onChange;
  store.data = blankData();
  store.loaded = blankLoaded();

  COLLECTIONS.forEach((name) => {
    const ref = collection(db, "users", uid, name);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        store.data[name] = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        store.loaded[name] = true;
        notify();
      },
      (error) => {
        console.error(`Firestore ${name}:`, error);
        store.loaded[name] = true;
        const denied = String(error?.code || "").includes("permission-denied");
        toast(
          denied
            ? `Firestore rules blocked ${name}. Deploy the included security rules.`
            : `Could not sync ${name} from Firestore.`,
          "error"
        );
        notify();
      }
    );
    store.unsubs.push(unsubscribe);
  });
}

export function stopStore() {
  store.unsubs.forEach((unsubscribe) => unsubscribe());
  store.unsubs = [];
  store.uid = null;
  store.data = blankData();
  store.loaded = blankLoaded();
  store.onChange = null;
}

function notify() {
  if (typeof store.onChange === "function") store.onChange();
}

export function isLoaded(name) {
  return Boolean(store.loaded[name]);
}

export function allLoaded() {
  return COLLECTIONS.every((name) => store.loaded[name]);
}

export function clientById(id) {
  if (!id) return null;
  return store.data.clients.find((client) => client.id === id) || null;
}

export function clientName(id, fallback = "Unassigned") {
  const client = clientById(id);
  if (!client) return fallback;
  return client.company || client.name || fallback;
}

export function clientItems(placeholder = "No client") {
  return store.data.clients
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .map((client) => ({
      value: client.id,
      label: client.company ? `${client.name} · ${client.company}` : client.name
    }));
}

export function sumBy(items, field) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

export async function createRecord(collectionName, data) {
  if (!store.uid) throw new Error("Not signed in");
  return addDoc(collection(db, "users", store.uid, collectionName), {
    ...data,
    createdAt: Date.now()
  });
}

export async function updateRecord(collectionName, id, data) {
  if (!store.uid) throw new Error("Not signed in");
  return updateDoc(doc(db, "users", store.uid, collectionName, id), data);
}

export async function removeRecord(collectionName, id) {
  if (!store.uid) throw new Error("Not signed in");
  return deleteDoc(doc(db, "users", store.uid, collectionName, id));
}
