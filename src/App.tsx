import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuthAdmin } from "./hooks/useAuth"; // <-- hook de auth

type Presente = {
  id: string;
  nome: string;
  preco: number;
  reservado: boolean;
};

function App() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthAdmin(); // <-- pegando user/admin

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "presentes"), (snapshot) => {
      const lista: Presente[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Presente, "id">),
      }));

      setPresentes(lista);
    });

    return () => unsubscribe();
  }, []);

  // Função do botão condicional
  function handleAdminButton() {
    if (!user) {
      navigate("/login");
    } else if (isAdmin) {
      navigate("/admin");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Total de presentes: {presentes.length}</h2>
      {/* Botão condicional */}
      <button
        onClick={handleAdminButton}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {!user ? "Login" : isAdmin ? "🔒 Painel Admin" : "Acesso restrito"}
      </button>

      <h1>Lista de Casamento 💍</h1>

      {presentes.map((p) => (
        <div
          key={p.id}
          onClick={() => navigate(`/presente/${p.id}`)}
          style={{
            border: "1px solid #ccc",
            margin: 10,
            padding: 10,
            cursor: "pointer",
            opacity: p.reservado ? 0.5 : 1,
          }}
        >
          <h3>{p.nome}</h3>
          <p>R$ {p.preco}</p>
          <p>{p.reservado ? "❌ Já escolhido" : "✅ Disponível"}</p>
        </div>
      ))}
    </div>
  );
}

export default App;