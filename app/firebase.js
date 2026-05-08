import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  authDomain: "artemis-reach.firebaseapp.com",
  projectId: "artemis-reach",
  storageBucket: "artemis-reach.firebasestorage.app",
  messagingSenderId: "36088536822",
  appId: "1:36088536822:web:9223bbe0ce211b1730d6d7",
  measurementId: "G-83H44SFZ4W"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)