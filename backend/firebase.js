import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, update, get, child } from "firebase/database";

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} = process.env;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export async function createUser(data) {
  const usersRef = ref(db, "users");
  const newRef = push(usersRef);
  const id = newRef.key;
  const user = { id, ...data };
  await set(newRef, user);
  return user;
}

export async function updateUser(id, patch) {
  await update(ref(db, `users/${id}`), patch);
  const snap = await get(child(ref(db), `users/${id}`));
  return snap.val();
}
