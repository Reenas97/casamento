import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import { db } from "../firebase";
import { swalError, swalSuccess } from "../helpers/swalAlert";
import emailjs from "@emailjs/browser";

export default function Confirmacao() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [grupo, setGrupo] = useState<any>(null);
  const [modoManual, setModoManual] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [convidados, setConvidados] = useState<any[]>([]);
  const [mensagemConfirmacao, setMensagemConfirmacao] = useState("");
  
  async function buscarGrupoPorToken(tokenBusca: string) {
    setLoading(true);
    setErro("");

    try {
      const q = query(
        collection(db, "grupos"),
        where("token", "==", tokenBusca)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setGrupo(null);

        swalError(
          "Código inválido",
          "Confira o código do convite e tente novamente. Se não der certo com o código enviado, entre em contato com a noiva."
        );
      } else {
        const doc = snapshot.docs[0];

        const grupoData = {
          id: doc.id,
          ...doc.data(),
        };
        
        setGrupo(grupoData);
        setModoManual(false);
        
        await buscarConvidados(grupoData.id); // ✅ agora existe
      }
    } catch (e) {
      console.error(e);
      setErro("Erro ao buscar convite");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!token) {
      setModoManual(true);
    } else {
      buscarGrupoPorToken(token);
    }
  }, [token]);

  async function buscarConvidados(grupoId: string) {
    try {
      const q = query(
        collection(db, "convidados"),
        where("grupo_id", "==", grupoId)
      );

      const snapshot = await getDocs(q);

      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setConvidados(lista);
    } catch (e) {
      console.error(e);
    }
  }



  async function salvarConfirmacao() {
    const principal = convidados.find(c => c.principal);

    if (!principal?.email) {
      return swalError(
        "Email obrigatório",
        "Por favor, informe o email do convidado principal."
      );
    }

    try {
      // Monta string com todos os nomes
      const nomesDoGrupo = convidados.map(c => c.nome).join(", ");
      const dataConfirmacao = new Date();

      // 1️⃣ Envia email para você apenas **uma vez**
      await emailjs.send(
        "service_15m06v9",
        "template_gvlgpk8",
        {
          nomes_do_grupo: nomesDoGrupo,
          grupo: grupo.nome_grupo,
          status: convidados.map(c => c.status || "pendente").join(", "),
          data_confirmacao: dataConfirmacao.toLocaleString("pt-BR")
        },
        "vMbgZBpGnITp0wp_m"
      );

      // 2️⃣ Envia email para o convidado principal, se confirmou
      if (principal.status === "confirmado") {
        await emailjs.send(
          "service_15m06v9",
          "template_gs1ecx4",
          {
            nome: principal.nome,
            nomes_do_grupo: nomesDoGrupo,
            data_evento: "30/08/2026",
            data_confirmacao: dataConfirmacao.toLocaleString("pt-BR"),
            email_convidado: principal.email
          },
          "vMbgZBpGnITp0wp_m"
        );
      }

      // Depois que todos os emails foram enviados, salva no banco
      const promises = convidados.map((c) => {
        const statusAtual = c.status || "pendente";

        return updateDoc(doc(db, "convidados", c.id), {
          status: statusAtual,
          confirmou: statusAtual === "confirmado",
          data_confirmacao:
            statusAtual === "confirmado" || statusAtual === "recusado"
              ? new Date()
              : null,
          email: c.email || null,
        });
      });

      await Promise.all(promises);

      swalSuccess(
        "Confirmação enviada com sucesso 💜",
        "Estamos ansiosos para celebrar com você!!"
      );
    } catch (err) {
      console.error(err);
      swalError(
        "Erro ao confirmar presença",
        "Ocorreu um problema ao enviar o email ou salvar no banco. Tente novamente."
      );
    }
  }

  function formatarNomes(lista: any[]) {
    const nomes = lista.map((c) => c.nome);

    if (nomes.length === 1) return nomes[0];
    if (nomes.length === 2) return nomes.join(" e ");

    return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
  }

  useEffect(() => {
    if (!convidados.length) {
      setMensagemConfirmacao("");
      return;
    }
  
    const confirmados = convidados.filter((c) => c.confirmou);
  
    if (confirmados.length === 0) {
      setMensagemConfirmacao("");
      return;
    }
  
    const nomesFormatados = formatarNomes(confirmados);
  
    const confirmadoPalavra =
      confirmados.length === 1 ? "confirmado" : "confirmados";
  
    setMensagemConfirmacao(
      `${nomesFormatados} ${confirmadoPalavra}! Estamos ansiosos para comemorar com vocês! 💜`
    );
  }, [convidados]);

  function atualizarStatus(id: string, status: "confirmado" | "recusado") {
    setConvidados((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              confirmou: status === "confirmado", // compatibilidade
            }
          : c
      )
    );
  }

  function getStatus(convidado: any) {
    if (convidado.status) return convidado.status;

    if (convidado.confirmou === true) return "confirmado";

    return "pendente";
  }

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center h-100 my-auto confirmacao">
    
      {/* 🔄 LOADING */}
      {loading && <p>Carregando...</p>}
    
      {/*  ERRO */}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
    
      {/* 🟣 MODO MANUAL (SEM TOKEN) */}
      {modoManual && !grupo && (
        <>
          <h1>Confirmação de presença</h1>
            
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              buscarGrupoPorToken(tokenInput);
            }}
            style={{ maxWidth: 400, width: "100%" }}
          >
            <FormGroup>
              <Label for="token" className="fs-5 mt-3">Digite o código do seu convite:</Label>
          
              <Input
                id="token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Ex: abc123"
              />
            </FormGroup>
          
            <Button
              type="submit"
              className="btn--purple w-100"
            >
              Buscar convite
            </Button>
          </Form>
        </>
      )}
  
      {/* 🟢 GRUPO ENCONTRADO */}
{grupo && (
  <>
    <h1 className="mb-4">Confirmação de Presença</h1>

    <p className="fs-5">
      Convite de <strong>{grupo.nome_grupo}</strong>
    </p>

    <p>Selecione quem irá ao evento:</p>

    {convidados.map((c) => (
      <div key={c.id} className="mb-3">
        <strong>{c.nome}</strong>
              
        <div className="mt-1">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name={`status-${c.id}`}
              checked={getStatus(c) === "confirmado"}
              onChange={() => atualizarStatus(c.id, "confirmado")}
            />
            <label className="form-check-label">Vou</label>
          </div>
              
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name={`status-${c.id}`}
              checked={getStatus(c) === "recusado"}
              onChange={() => atualizarStatus(c.id, "recusado")}
            />
            <label className="form-check-label">Não vou</label>
          </div>
        </div>
      </div>
    ))}

    {/* Input de email do convidado principal */}
    {convidados.some(c => c.principal ) && convidados.some(c => c.principal) && (
      <FormGroup className="mt-3" style={{ maxWidth: 400, width: "100%" }}>
        <Label for="emailPrincipal" className="fs-6">
          Seu email para confirmação (convidado principal):
        </Label>
        <Input
          type="email"
          id="emailPrincipal"
          placeholder="exemplo@email.com"
          value={convidados.find(c => c.principal)?.email || ""}
          onChange={(e) =>
            setConvidados(prev =>
              prev.map(c =>
                c.principal ? { ...c, email: e.target.value } : c
              )
            )
          }
        />
      </FormGroup>
    )}

    <Button
      onClick={salvarConfirmacao}
      className="mt-3 btn btn--purple text-white"
    >
      Confirmar presença
    </Button>

    {mensagemConfirmacao && (
      <p className="mt-3 text-center text-success fw-bold">
        {mensagemConfirmacao}
      </p>
    )}
  </>
)}
    </Container>
  );
}