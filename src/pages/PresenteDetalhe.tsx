import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import emailjs from "@emailjs/browser";
import {
  doc,
  getDoc,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import QRCode from "react-qr-code";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  reservado: boolean;
  descricao?: string;
  qrCodeValue: string;
};

export default function PresenteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [presente, setPresente] = useState<Presente | null>(null);
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [email, setEmail] = useState("");

  // 🔥 carregar presente
useEffect(() => {
  async function carregar() {
    if (!id) return;

    const ref = doc(db, "presentes", id);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const dados = snap.data() as Omit<Presente, "id">;
      const presenteCarregado: Presente = {
        id: snap.id,
        ...dados,
        qrCodeValue: dados.qrCodeValue || "", // se já existir, usa, senão vazio
      };

      setPresente(presenteCarregado);

      // ⚡ Se não tiver qrCodeValue, gera e salva
      //if (!dados.qrCodeValue) {
      //  await salvarQrCode(presenteCarregado.id, presenteCarregado);
      //  // Atualiza localmente depois de salvar
      //  const qrCodeGerado = gerarPix(presenteCarregado);
      //  setPresente(prev => prev ? { ...prev, qrCodeValue: qrCodeGerado } : null);
      //}
    }
  }

  carregar();
}, [id]);

  // 🔥 reservar presente com segurança
  async function reservarPresente() {
    if (!id) return;
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "presentes", id);
        const snap = await transaction.get(ref);

        if (!snap.exists()) throw "Presente não existe";

        const dados = snap.data();

        if (dados.reservado) {
          alert("😢 Esse presente já foi escolhido!");
          throw "Já reservado";
        }

        transaction.update(ref, {
          reservado: true,
          reservadoPor: nome || "Convidado",
          //mensagemConvidado: mensagem || "",
        });
      });

      alert("🎉 Presente reservado com sucesso!");
      setShowPix(false);
      navigate("/");
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  async function enviarEmail() {
  try {
    await emailjs.send(
      "service_li6djxs",
      "template_7ok3rdj",
      {
        nome: nome,
        presente: presente?.nome,
        valor: presente?.preco,
        mensagem: mensagem || "Sem mensagem",
        to_email: email,
      },
      "emvFITicujaJMTYks"
    );

    console.log("Email enviado!");
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
}

  // 🔹 confirma PIX manualmente
  async function confirmarPix() {
    if (!nome.trim()) {
      alert("Por favor, informe seu nome!");
      return;
    }

    // 1️⃣ reservar presente
    await reservarPresente();

  // 2️⃣ salvar confirmação no Firestore
  await addDoc(collection(db, "pagamentos"), {
    presenteId: id,
    nomeConvidado: nome,
    confirmado: true,
    data: serverTimestamp(),
  });

  // 3️⃣ salvar mensagem do convidado na coleção 'mensagens'
  if (mensagem.trim()) {
    await addDoc(collection(db, "mensagens"), {
      presenteId: id,
      nomeConvidado: nome,
      mensagem: mensagem,
      data: serverTimestamp(), // Firebase cria timestamp automático
    });
  }

  await enviarEmail();


    alert("✅ Pagamento confirmado! Obrigado pelo presente 💖");
  }

  if (!presente) return <p>Carregando...</p>;

//// Função para calcular CRC16-CCITT
//function crc16ccitt(str: string) {
//  let crc = 0xFFFF;
//  for (let i = 0; i < str.length; i++) {
//    crc ^= str.charCodeAt(i) << 8;
//    for (let j = 0; j < 8; j++) {
//      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) : (crc << 1);
//      crc &= 0xFFFF;
//    }
//  }
//  return crc.toString(16).toUpperCase().padStart(4, "0");
//}
//
//// Função corrigida gerarPix
//function gerarPix(presente: { nome: string; preco: number }) {
//  const chavePix = "22869d59-aa4c-4462-bf98-4ddb3e91196e";
//  const nomeRecebedor = "Renata e Pedro";
//  const cidade = "São Paulo";
//
//  const valor = presente.preco.toFixed(2);
//
//  const msg = `Presente ${presente.nome} para ${nomeRecebedor}`;
//  const subcampo01 = `01${msg.length.toString().padStart(2,'0')}${msg}`;
//  const campo62 = `62${subcampo01.length.toString().padStart(2,'0')}${subcampo01}`;
//
//  let qr = 
//    `000201` + 
//    `26360014BR.GOV.BCB.PIX01${chavePix}` + 
//    `52040000` + 
//    `5303986` + 
//    `54${valor.length.toString().padStart(2,'0')}${valor}` + 
//    `5802BR` + 
//    `59${nomeRecebedor.length.toString().padStart(2,'0')}${nomeRecebedor}` + 
//    `60${cidade.length.toString().padStart(2,'0')}${cidade}` + 
//    campo62 +
//    `6304`; // CRC placeholder
//
//  const crc = crc16ccitt(qr);
//  qr += crc;
//
//  return qr;
//}

//async function salvarQrCode(presenteId: string, presente: { nome: string; preco: number }) {
//  const qrCodeValue = gerarPix(presente);
//  const ref = doc(db, "presentes", presenteId);
//
//  await updateDoc(ref, { qrCodeValue });
//}

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate("/")}>← Voltar</button>

      <h1>{presente.nome}</h1>
      <p>R$ {presente.preco}</p>
      <p>{presente.descricao || "Sem descrição"}</p>

      <hr />

      {presente.reservado ? (
        <h2>❌ Este presente já foi escolhido</h2>
      ) : (
        <>
          {/* Botão comprar */}
          <button
            style={{
              marginTop: 10,
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
            onClick={() => setShowPix(true)}
          >
            🛒 Comprar Presente
          </button>

          {/* Modal PIX */}
          {showPix && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: 20,
                  borderRadius: 8,
                  maxWidth: 400,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                <h2>💸 Faça o PIX</h2>
                <p>Chave PIX: <b>chavepix@email.com</b></p>
                <QRCode value={presente.qrCodeValue} size={180} />

                <hr />

                {/* Formulário dentro do modal */}
                <input
                  placeholder="Seu nome *"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={{ marginTop: 10, width: "100%", padding: 8 }}
                />
                <input
                  placeholder="Seu e-mail *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ marginTop: 10, width: "100%", padding: 8 }}
                />
                <textarea
                  placeholder="Deixe uma mensagem 💌 (opcional)"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  style={{ marginTop: 10, width: "100%", padding: 8 }}
                />

                <button
                  style={{
                    marginTop: 10,
                    padding: "8px 16px",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  onClick={confirmarPix}
                  disabled={loading}
                >
                  ✅ Confirmar PIX
                </button>

                <button
                  style={{
                    marginTop: 10,
                    padding: "8px 16px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowPix(false)}
                  disabled={loading}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}