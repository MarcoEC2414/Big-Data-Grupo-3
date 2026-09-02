import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider,
  OAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signInAnonymously,
  sendEmailVerification,
  signOut 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCuWkujSjc9BuSwYJUEZKctnJAvCq-BFeI",
  authDomain: "big-data-grupo-3.firebaseapp.com",
  projectId: "big-data-grupo-3",
  storageBucket: "big-data-grupo-3.firebasestorage.app",
  messagingSenderId: "466353005486",
  appId: "1:466353005486:web:2a842df917c932a2af9e3f",
  measurementId: "G-Q74TL5S6XD"
};

const app = initializeApp(firebaseConfig);

export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");

export const loginWithEmail = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const loginWithGoogle = () => 
  signInWithPopup(auth, googleProvider);

export const loginWithGithub = () => 
  signInWithPopup(auth, githubProvider);

export const loginWithFacebook = () => 
  signInWithPopup(auth, facebookProvider);

export const loginWithMicrosoft = () => 
  signInWithPopup(auth, microsoftProvider);

export const loginAnonymously = () => 
  signInAnonymously(auth);

export const sendVerification = () => {
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser);
  }
  return Promise.reject(new Error("No hay usuario autenticado."));
};

export const logout = () => signOut(auth);