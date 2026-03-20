import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import convidadosData from "../listas/convidados.json";

export default function ImportConvidados() {
  const [loading, setLoading] = useState(false);

  async function importarConvidados() {
    setLoading(true);

    try {
      for (const grupo of convidadosData) {

        // cria grupo
        const grupoRef = await addDoc(collection(db, "grupos"), {
          nome_grupo: grupo.nome_grupo,
          token: grupo.token,
          criado_em: serverTimestamp()
        });

        const grupoId = grupoRef.id;

        // cria convidados
        for (const convidado of grupo.convidados) {
          await addDoc(collection(db, "convidados"), {
            nome: convidado.nome,
            grupo_id: grupoId,
            principal: convidado.principal || false,
            confirmou: false,
            data_confirmacao: null
          });
        }
      }

      alert("✅ Importado com sucesso!");
    } catch (e) {
      console.error(e);
      alert("❌ Erro ao importar.");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Importar Convidados</h1>

      <button onClick={importarConvidados} disabled={loading}>
        {loading ? "Importando..." : "Importar"}
      </button>
    </div>
  );
}