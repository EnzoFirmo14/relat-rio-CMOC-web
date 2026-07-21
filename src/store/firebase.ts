import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkEzrbkGFq8jEutYvQvOd6nOST0Vh9siw",
  authDomain: "cmoc-relatorio.firebaseapp.com",
  projectId: "cmoc-relatorio",
  storageBucket: "cmoc-relatorio.firebasestorage.app",
  messagingSenderId: "279433346974",
  appId: "1:279433346974:web:df020affeb3225985ae08f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);