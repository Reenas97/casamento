import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuthAdmin } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

type Mensagem = {
  id: string;
  nomeConvidado: string;
  mensagem: string;
  presenteId: string;
  data?: any;
};


type Presente = {
  id?: string;
  nome: string;
  preco: number;
  imagem: string;
  qrCodeValue: string;
  reservado: boolean;
};


export default function Admin() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [presentes, setPresentes] = useState<Presente[]>([]);

  const [novoPresente, setNovoPresente] = useState<Presente>({
    nome: "",
    preco: 0,
    imagem: "",
    qrCodeValue: "",
    reservado: false,
  });
  const { user, isAdmin, loading } = useAuthAdmin();
const navigate = useNavigate();

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "presentes"),
    (snapshot) => {
      const lista: Presente[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Presente, "id">),
      }));
      setPresentes(lista);
    }
  );

  return () => unsubscribe();
}, []);

async function excluirPresente(id: string) {
  if (!confirm("Deseja realmente excluir este produto?")) return;

  try {
    await deleteDoc(doc(db, "presentes", id));
    alert("Produto excluído com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro ao excluir produto");
  }
}

async function atualizarPresente(presente: Presente) {
  if (!presente.id) return;

  try {
    await updateDoc(doc(db, "presentes", presente.id), {
      nome: presente.nome,
      preco: presente.preco,
      imagem: presente.imagem,
      qrCodeValue: presente.qrCodeValue,
      reservado: presente.reservado,
    });
    alert("Produto atualizado com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar produto");
  }
}


console.log(isAdmin)

useEffect(() => {
  if (!loading && (!user || !isAdmin)) {
    navigate("/");
  }
}, [user, isAdmin, loading]);

  useEffect(() => {
    const q = query(
      collection(db, "mensagens"),
      orderBy("data", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Mensagem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Mensagem, "id">),
      }));

      setMensagens(lista);
    });

    return () => unsubscribe();
  }, []);


  function handleLogout() {
  signOut(auth)
    .then(() => {
      // redireciona para a página inicial depois do logout
      navigate("/");
    })
    .catch((error) => {
      console.error("Erro ao sair:", error);
    });
}


async function adicionarPresente() {
    if (!novoPresente.nome || novoPresente.preco <= 0) {
      alert("Preencha o nome e o preço corretamente!");
      return;
    }

    try {
      await addDoc(collection(db, "presentes"), novoPresente);
      alert("🎁 Presente adicionado com sucesso!");
      setNovoPresente({
        nome: "",
        preco: 0,
        imagem: "",
        qrCodeValue: "",
        reservado: false,
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao adicionar presente");
    }
  }

  return (
    <div style={{ padding: 20 }}>
        <button
  onClick={handleLogout}
  style={{
    marginBottom: 20,
    padding: "8px 16px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  }}
>
  Sair
</button>
      <h1>🔒 Painel dos Noivos</h1>

      {mensagens.length === 0 && <p>Nenhuma mensagem ainda 💭</p>}

      {mensagens.map((m) => (
        <div
          key={m.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p><b>👤 {m.nomeConvidado}</b></p>
          <p>💌 {m.mensagem}</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>
            🎁 Presente: {m.presenteId}
          </p>
        </div>
      ))}

      {/* Tabela de produtos */}
<div style={{ marginBottom: 40 }}>
  <h2>🛒 Lista de Produtos</h2>
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={{ border: "1px solid #ccc", padding: 8, textAlign: "left" }}>Nome</th>
        <th style={{ border: "1px solid #ccc", padding: 8, textAlign: "left" }}>Preço</th>
        <th style={{ border: "1px solid #ccc", padding: 8, textAlign: "left" }}>Ações</th>
      </tr>
    </thead>
    <tbody>
      {/** Lista de produtos */}
      {presentes.map((p) => (
        <tr key={p.id}>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>{p.nome}</td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>R$ {p.preco}</td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>
  <button
    onClick={() => {
      const novoNome = prompt("Digite o novo nome do produto:", p.nome);
      const novoPreco = prompt("Digite o novo preço do produto:", p.preco.toString());

      if (novoNome && novoPreco) {
        atualizarPresente({
          ...p,
          nome: novoNome,
          preco: Number(novoPreco)
        });
      }
    }}
    style={{
      padding: "4px 8px",
      backgroundColor: "#2196f3",
      color: "white",
      border: "none",
      borderRadius: 4,
      cursor: "pointer",
      marginRight: 8,
    }}
  >
    ✏️ Editar
  </button>

  <button
    onClick={async () => {
      if (confirm("Deseja realmente excluir este produto?")) {
        try {
          await excluirPresente(p.id!);
        } catch (err) {
          console.error(err);
          alert("Erro ao excluir produto");
        }
      }
    }}
    style={{
      padding: "4px 8px",
      backgroundColor: "#f44336",
      color: "white",
      border: "none",
      borderRadius: 4,
      cursor: "pointer",
    }}
  >
    ❌ Excluir
  </button>
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

            {/* Sessão adicionar presente */}
      <div style={{ marginBottom: 40, border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
        <h2>➕ Adicionar Produto</h2>

        <input
          type="text"
          placeholder="Nome do presente"
          value={novoPresente.nome}
          onChange={(e) => setNovoPresente({ ...novoPresente, nome: e.target.value })}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <input
          type="number"
          placeholder="Preço"
          value={novoPresente.preco}
          onChange={(e) => setNovoPresente({ ...novoPresente, preco: Number(e.target.value) })}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <input
          type="text"
          placeholder="URL da imagem (opcional)"
          value={novoPresente.imagem}
          onChange={(e) => setNovoPresente({ ...novoPresente, imagem: e.target.value })}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <input
          type="text"
          placeholder="qrCode"
          value={novoPresente.qrCodeValue}
          onChange={(e) => setNovoPresente({ ...novoPresente, qrCodeValue: e.target.value })}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <button
          onClick={adicionarPresente}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Adicionar Presente
        </button>
      </div>
    </div>
  );
}