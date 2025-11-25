import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBq7PPg2ZyuP8ZHnJutTauj-UX2HPAlpw8",
  authDomain: "life-os-new.firebaseapp.com",
  projectId: "life-os-new",
  storageBucket: "life-os-new.firebasestorage.app",
  messagingSenderId: "261135811766",
  appId: "1:261135811766:web:ca5c110aa20b91b0dd5217"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
