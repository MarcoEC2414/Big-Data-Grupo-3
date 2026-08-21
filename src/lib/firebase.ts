import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuWkujSjc9BuSWyJUEZKctnJAvCq-BFeI",
  authDomain: "big-data-grupo-3.firebaseapp.com",
  projectId: "big-data-grupo-3",
  storageBucket: "big-data-grupo-3.firebasestorage.app",
  messagingSenderId: "466353005486",
  appId: "1:466353005486:web:2a842df917c932a2af9e3f",
  measurementId: "G-Q74TL5S6XD"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la instancia de Firestore para conectar React con la DB
export const db = getFirestore(app);