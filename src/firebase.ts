import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPd6UMwxFtp0NORlDzjEcfcaBxwqrI7hM",
  authDomain: "lista-casamento-renata-pedro.firebaseapp.com",
  projectId: "lista-casamento-renata-pedro",
  storageBucket: "lista-casamento-renata-pedro.firebasestorage.app",
  messagingSenderId: "1020041742282",
  appId: "1:1020041742282:web:49fd8b7d1c981918a83133",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); 
