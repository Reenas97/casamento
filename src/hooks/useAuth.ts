import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export function useAuthAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  console.log("isAdmin mudou:", isAdmin);
}, [isAdmin]);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const adminRef = doc(db, "admins", u.uid);
        const snap = await getDoc(adminRef);
        console.log("UID logado:", u.uid);

          console.log("UID logado:", u.uid);
  console.log("snap.exists():", snap.exists());
  console.log("snap.data():", snap.data());
        
        setIsAdmin(snap.exists());
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    console.log(setIsAdmin)

    return () => unsubscribe();
  }, []);
  

  return { user, isAdmin, loading };
}