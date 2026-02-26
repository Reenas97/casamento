import {  useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import presentes from "../listas/presentes.json";

export default function ImportProdutos() {
  const [loading, setLoading] = useState(false);

  async function importarProdutos() {
    setLoading(true);

    try {
      for (const item of presentes) {
        await addDoc(collection(db, "presentes"), {
          imagem: item.imagem || "",
          nome: item.nome,
          preco: item.preco,
          qrCodeValue: item.qrCodeValue || "",
          reservado: item.reservado || false,
        });
      }

      alert("✅ Todos os produtos foram importados!");
    } catch (e) {
      console.error(e);
      alert("❌ Ocorreu um erro ao importar os produtos.");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Importar Produtos</h1>
      <button
        onClick={importarProdutos}
        disabled={loading}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {loading ? "Importando..." : "Importar JSON para Firestore"}
      </button>
    </div>
  );
}