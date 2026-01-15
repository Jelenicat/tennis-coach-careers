import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBKJXy7b1ZgwoopOjG46hWVMVvqz8g9zMM",
  authDomain: "tennis-coach-careers.firebaseapp.com",
  projectId: "tennis-coach-careers",
  storageBucket: "tennis-coach-careers.firebasestorage.app",
  messagingSenderId: "219938474634",
  appId: "1:219938474634:web:5c6e9e978b5eb0deeebb73"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
