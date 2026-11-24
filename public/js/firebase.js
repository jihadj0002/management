import { firebaseConfig } from "../firebase-config.js";
import { initializeApp } from "../vendor/firebase/13.4.0/firebase-app.js";
import { getAuth } from "../vendor/firebase/13.4.0/firebase-auth.js";
import { getFirestore } from "../vendor/firebase/13.4.0/firebase-firestore.js";

export const configured = Boolean(
  firebaseConfig &&
  typeof firebaseConfig.apiKey === "string" &&
  !firebaseConfig.apiKey.includes("PASTE") &&
  typeof firebaseConfig.appId === "string" &&
  !firebaseConfig.appId.includes("PASTE")
);

export let app = null;
export let auth = null;
export let db = null;

if (configured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}
