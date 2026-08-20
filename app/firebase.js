import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-83H44SFZ4W"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Mantém o login salvo no dispositivo (não desloga ao fechar)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {})
}