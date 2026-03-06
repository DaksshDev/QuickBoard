import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBEn9PoxTarTr6DcV4VtlMfbXKXPU9Ru0I",
  authDomain: "quickboard-b8c64.firebaseapp.com",
  databaseURL: "https://quickboard-b8c64-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quickboard-b8c64",
  storageBucket: "quickboard-b8c64.firebasestorage.app",
  messagingSenderId: "529109908558",
  appId: "1:529109908558:web:607348bfe7454d7ec7571f",
  measurementId: "G-229D2X07D1"
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;

if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
} else {
  console.warn("Firebase configuration is missing. Please set VITE_FIREBASE_* environment variables.");
}

export { app, auth, db, rtdb };
