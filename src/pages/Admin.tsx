import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, where, getDocs } from "firebase/firestore";
import { useAuthAdmin } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {  Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Form, Modal, ModalFooter, ModalBody, ModalHeader } from "reactstrap";
import DataTable from "react-data-table-component";
import { swalError, swalSuccess } from "../helpers/swalAlert";
import Swal from "sweetalert2";
import { FaEdit, FaTrash } from "react-icons/fa";
import { NumericFormat } from "react-number-format";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  descricao?: string;
  reservado: boolean;
  link?: string;
  valorArrecadado?: number;
};

type Grupo = {
  id: string;
  nome_grupo: string;
  token: string;
};

type Convidado = {
  id: string;
  nome: string;
  grupo_id: string;
  principal: boolean;
  confirmou: boolean;
  status?: "confirmado" | "recusado" | "pendente";
  crianca?: boolean;
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
    descricao: "",
    link: "",
    valorArrecadado: 0,
  });
  const { user, isAdmin, loading } = useAuthAdmin();
  const navigate = useNavigate();

  const [modalEditar, setModalEditar] = useState(false);
  const [presenteEditando, setPresenteEditando] = useState<Presente | null>(null);

  const toggleModalEditar = () => setModalEditar(!modalEditar);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [convidadoEditando, setConvidadoEditando] = useState<Convidado | null>(null);
  const [modalEditarConvidado, setModalEditarConvidado] = useState(false);
  const [modalAdicionarConvidado, setModalAdicionarConvidado] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const gruposPorPagina = 5;
  const indexInicial = (paginaAtual - 1) * gruposPorPagina;
  const indexFinal = indexInicial + gruposPorPagina;
  const [buscaGrupo, setBuscaGrupo] = useState("");
  const gruposFiltrados = grupos.filter((g) => {
    const busca = buscaGrupo.toLowerCase();

    // match no nome do grupo
    const matchGrupo = g.nome_grupo.toLowerCase().includes(busca);

    // convidados do grupo
    const convidadosDoGrupo = convidados.filter(
      (c) => c.grupo_id === g.id
    );

    // match em algum convidado
    const matchConvidado = convidadosDoGrupo.some((c) =>
      c.nome.toLowerCase().includes(busca)
    );

    return matchGrupo || matchConvidado;
  });
  
  const gruposPaginados = gruposFiltrados.slice(indexInicial, indexFinal);
  const totalPaginas = Math.ceil(gruposFiltrados.length / gruposPorPagina);
  const totalConvidados = convidados.length;
  const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null);
  const [modalGrupo, setModalGrupo] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState({
    nome_grupo: "",
    token: "",
  });

  const [novosConvidados, setNovosConvidados] = useState<
    { nome: string; principal: boolean; crianca: boolean }[]
  >([{ nome: "", principal: false, crianca: false }]);
  const confirmados = convidados.filter(c => getStatus(c) === "confirmado").length;
  const recusados = convidados.filter(c => getStatus(c) === "recusado").length;
  const pendentes = convidados.filter(c => getStatus(c) === "pendente").length;
  const [totalCriancas, setTotalCriancas] = useState(0);
  useEffect(() => {
    setTotalCriancas(convidados.filter(c => c.crianca).length);
  }, [convidados]);

  function editarGrupo(grupo: Grupo) {
    setGrupoEditando(grupo);
    setModalGrupo(true);
  }

  async function salvarGrupo() {
    if (!grupoEditando) return;

    try {
      await updateDoc(doc(db, "grupos", grupoEditando.id), {
        nome_grupo: grupoEditando.nome_grupo,
      });

      await swalSuccess("Grupo atualizado!");
      setModalGrupo(false);
      setGrupoEditando(null);
    } catch (err) {
      console.error(err);
      await swalError("Erro ao atualizar grupo");
    }
  }

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaGrupo]);

  useEffect(() => {
    const unsubscribeGrupos = onSnapshot(collection(db, "grupos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Grupo, "id">),
      }));

      setGrupos(
        lista.sort((a, b) =>
          a.nome_grupo.localeCompare(b.nome_grupo, "pt-BR", {
            sensitivity: "base",
          })
        )
      );
    });

    const unsubscribeConvidados = onSnapshot(collection(db, "convidados"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Convidado, "id">),
      }));

      setConvidados(lista);
    });

    return () => {
      unsubscribeGrupos();
      unsubscribeConvidados();
    };
  }, []);

  function getConvidadosPorGrupo(grupoId: string) {
    return convidados.filter((c) => c.grupo_id === grupoId);
  }

  async function excluirConvidado(id: string) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja excluir este convidado?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    await deleteDoc(doc(db, "convidados", id));
  }

  function editarConvidado(c: Convidado) {
    setConvidadoEditando(c);
    setModalEditarConvidado(true);
  }

  async function salvarConvidado() {
    if (!convidadoEditando) return;

    await updateDoc(doc(db, "convidados", convidadoEditando.id), {
      nome: convidadoEditando.nome,
      principal: convidadoEditando.principal,
      confirmou: convidadoEditando.confirmou,
      status: convidadoEditando.status || getStatus(convidadoEditando),
      crianca: convidadoEditando.crianca || false
    });

    await swalSuccess("Convidado atualizado!");

    setModalEditarConvidado(false);
    setConvidadoEditando(null);
  }

  function adicionarCampoConvidado() {
    setNovosConvidados([
      ...novosConvidados,
      { nome: "", principal: false, crianca: false },
    ]);
  }

  function removerCampoConvidado(index: number) {
    const lista = [...novosConvidados];
    lista.splice(index, 1);
    setNovosConvidados(lista);
  }

  function atualizarConvidado(index: number, campo: string, valor: any) {
    const lista = [...novosConvidados];
    lista[index] = { ...lista[index], [campo]: valor };
    setNovosConvidados(lista);
  }

  async function criarGrupoComConvidados() {
    if (!novoGrupo.nome_grupo.trim()) {
      await swalError("Nome do grupo é obrigatório");
      return;
    }

    try {
      // cria grupo]
      const tokenFinal =
        novoGrupo.token || (await gerarTokenUnico());
      const docRef = await addDoc(collection(db, "grupos"), {
        nome_grupo: novoGrupo.nome_grupo,
        token: tokenFinal,
      });
      // cria convidados vinculados
      const promises = novosConvidados
        .filter((c) => c.nome.trim() !== "")
        .map((c) =>
          addDoc(collection(db, "convidados"), {
            nome: c.nome,
            principal: c.principal,
            confirmou: false,
            grupo_id: docRef.id,
          })
        );

      await Promise.all(promises);

      await swalSuccess("Grupo criado com sucesso!");

      // reset
      setNovoGrupo({ nome_grupo: "", token: "" });
      setNovosConvidados([{ nome: "", principal: false, crianca: false }]);
    } catch (err) {
      console.error(err);
      await swalError("Erro ao criar grupo");
    }
  }

  async function adicionarConvidadosExistente(grupoId: string) {
    const promises = novosConvidados
      .filter((c) => c.nome.trim() !== "")
      .map((c) =>
        addDoc(collection(db, "convidados"), {
          nome: c.nome,
          principal: c.principal,
          confirmou: false,
          grupo_id: grupoId,
        })
      );

    await Promise.all(promises);

    await swalSuccess("Convidados adicionados!");
  }

  function toggleModalEditarConvidado() {
    setModalEditarConvidado(!modalEditarConvidado);
  }

  function toggleModalAdicionarConvidado() {
    setModalAdicionarConvidado(!modalAdicionarConvidado);
  }

  async function excluirGrupo(grupoId: string) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Isso irá excluir o grupo e TODOS os convidados!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const convidadosDoGrupo = convidados.filter(
        (c) => c.grupo_id === grupoId
      );

      const deletarConvidados = convidadosDoGrupo.map((c) =>
        deleteDoc(doc(db, "convidados", c.id))
      );

      await Promise.all(deletarConvidados);

      await deleteDoc(doc(db, "grupos", grupoId));

      await swalSuccess("Grupo e convidados excluídos!");
    } catch (err) {
      console.error(err);
      await swalError("Erro ao excluir grupo");
    }
  }

  

  async function gerarTokenUnico(): Promise<string> {
    const caracteres = "abcdefghijklmnopqrstuvwxyz0123456789";

  function gerarToken() {
      let token = "";
      for (let i = 0; i < 8; i++) {
        token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      return token;
    }
  
    let token = gerarToken();
    let existe = true;
  
    while (existe) {
      const q = query(
        collection(db, "grupos"),
        where("token", "==", token)
      );
    
      const snapshot = await getDocs(q);
    
      if (snapshot.empty) {
        existe = false;
      } else {
        token = gerarToken(); // tenta outro
      }
    }
  
    return token;
  }

  const columns = [
    {
      name: "Nome",
      selector: (row: Presente) => row.nome,
      sortable: true,
    },
    {
      name: "Preço",
      selector: (row: Presente) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(row.preco),
    },
    {
      name: "Ações",
      cell: (row: Presente) => (
        <>
          <button
            onClick={() => abrirModalEdicao(row)}
            className="btn btn-sm btn-primary me-2"
          >
            <FaEdit />
          </button>

          <button
            onClick={() => excluirPresente(row.id!)}
            className="btn btn-sm btn-danger"
          >
            <FaTrash />
          </button>
        </>
      ),
    },
  ];

  const [filtro, setFiltro] = useState("");

  const presentesFiltrados = presentes.filter((p) =>
    p.nome.toLowerCase().includes(filtro.toLowerCase())
  );


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
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja realmente excluir este produto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#CD67FF",
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "presentes", id));
      await swalSuccess("Produto excluído com sucesso!");
    } catch (err) {
      console.error(err);
      await swalError("Erro ao excluir produto");
    }
  }

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
        await swalError("Preencha o nome e o preço corretamente!");
        return;
      }

      try {
        await addDoc(collection(db, "presentes"), novoPresente);
        await swalSuccess("Presente adicionado com sucesso!");

        setNovoPresente({
          nome: "",
          preco: 0,
          imagem: "",
          qrCodeValue: "",
          reservado: false,
          descricao: "",
          link: "",
          valorArrecadado: 0,
        });
      } catch (e) {
        console.error(e);
        await swalError("Erro ao adicionar presente");
      }
    }


  function abrirModalEdicao(presente: Presente) {
     setPresenteEditando({
      ...presente,
      descricao: presente.descricao ?? "",
      link: presente.link ?? "",
    });
    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!presenteEditando?.id) return;

    try {
      await updateDoc(doc(db, "presentes", presenteEditando.id), {
        nome: presenteEditando.nome,
        preco: presenteEditando.preco,
        imagem: presenteEditando.imagem,
        qrCodeValue: presenteEditando.qrCodeValue,
        reservado: presenteEditando.reservado,
        link: presenteEditando.link,
        descricao: presenteEditando.descricao,
        valorArrecadado: presenteEditando.valorArrecadado || 0
      });

      await swalSuccess("Produto atualizado com sucesso!");
      setModalEditar(false);
    } catch (err) {
      console.error(err);
      await swalError("Erro ao atualizar produto");
    }
  }

  function getStatus(convidado: Convidado) {
    if (convidado.status) return convidado.status;

    if (convidado.confirmou === true) return "confirmado";

    return "pendente";
  }

  function exportarConvidados() {
    // Dados principais
    const dadosParaExcel = convidados.map(c => ({
      Nome: c.nome,
      Criança: c.crianca ? "Sim" : "Não",
      Status: !c.status ? "Pendente" : c.status,
    }));

    // Totais gerais
    const totalConvidados = convidados.length;
    const totalCriancas = convidados.filter(c => c.crianca).length;
    const totalPendentes = convidados.filter(c => !c.status || c.status === "pendente").length;
    const totalVai = convidados.filter(c => c.status === "confirmado").length;
    const totalNaoVai = convidados.filter(c => c.status === "recusado").length;

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(dadosParaExcel);

    // Adicionar resumo na coluna E
    const resumo = [
      ["Resumo Geral", ""],
      ["Total de Convidados", totalConvidados],
      ["Número de Crianças", totalCriancas],
      ["Pendentes", totalPendentes],
      ["Vai", totalVai],
      ["Não Vai", totalNaoVai],
    ];

    // Colocar o resumo na coluna E (índice 4, pois A=0)
    resumo.forEach((row, i) => {
      ws[`E${i + 1}`] = { t: "s", v: row[0] };
      ws[`F${i + 1}`] = { t: typeof row[1] === "number" ? "n" : "s", v: row[1] };
    });

    // Atualizar o range da planilha para incluir as colunas E e F
    const range = XLSX.utils.decode_range(ws['!ref']!);
    range.e.c = Math.max(range.e.c, 5); // coluna F
    range.e.r = Math.max(range.e.r, resumo.length - 1);
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Criar workbook e baixar
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Convidados");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "lista_convidados_site.xlsx");
  }

  return (
    <Container className="py-4 admin">
        <Button
          onClick={handleLogout}
          className="btn--white"
        >
          Sair
        </Button>
      <h1>Painel dos Noivos</h1>

      {/* mensagens */}

      {mensagens.length === 0 && <p>Nenhuma mensagem ainda</p>}

      {mensagens.length > 0 && (
        <Swiper
          className="py-5 mb-5"
          modules={[Pagination, Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 2 },
            1200: { slidesPerView: 3 },
          }}
          pagination={{ clickable: true }}
            navigation
            loop
          >
          {mensagens.map((m) => {
            const presente = presentes.find(p => p.id === m.presenteId);

            return (
              <SwiperSlide key={m.id}>
                <div>
                  <div className="swiper-content">
                    <p><b className="fs-5">{m.nomeConvidado}</b></p>
                    <hr />
                    <p><b>Mensagem:</b> {m.mensagem}</p>
                    <hr />
                    <p>
                      <b>Presente:</b> {presente?.nome ?? "Presente não encontrado"}
                    </p>
                    <p>
                      <hr />
                      <b>Valor: </b>
                      {presente
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(presente.preco)
                        : "Presente não encontrado"}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}

      {/* Tabela de produtos */}
      <Input
        type="text"
        placeholder="Buscar presente..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-100 mb-2"
      />
      <DataTable
        title="Lista de Presentes"
        columns={columns}
        data={presentesFiltrados}
        pagination
        highlightOnHover
        striped
      />

      {/* Sessão adicionar presente */}
      <Card className="mt-3 shadow-sm">
        <CardBody>
          <h2 className="mb-4">Adicionar Produto</h2>

          <Form>
            <Row className="g-3">
              <Col md={8}>
                <FormGroup>
                  <Label>Nome do presente</Label>
                  <Input
                  className="bg-transparent"
                    value={novoPresente.nome}
                    onChange={(e) =>
                      setNovoPresente({ ...novoPresente, nome: e.target.value })
                    }
                    placeholder="Ex: Jogo de panelas"
                  />
                </FormGroup>
              </Col>
                  
              <Col md={4}>
                <FormGroup>
                  <Label>Preço</Label>
                  <NumericFormat
                    className="form-control bg-transparent"
                    value={novoPresente.preco}
                    onValueChange={(values) => {
                      setNovoPresente({
                        ...novoPresente,
                        preco: values.floatValue || 0, // pega o valor como número
                      });
                    }}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                    prefix="R$ "
                    placeholder="0,00"
                  />
                </FormGroup>
              </Col>
                  
              <Col md={12}>
                <FormGroup>
                  <Label>QR Code PIX</Label>
                  <Input
                    className="bg-transparent"
                    value={novoPresente.qrCodeValue}
                    onChange={(e) =>
                      setNovoPresente({
                        ...novoPresente,
                        qrCodeValue: e.target.value,
                      })
                    }
                    placeholder="Código PIX"
                  />
                </FormGroup>
              </Col>
                  
              <Col md={12}>
                <FormGroup>
                  <Label>URL da imagem (opcional)</Label>
                  <Input
                    className="bg-transparent"
                    value={novoPresente.imagem}
                    onChange={(e) =>
                      setNovoPresente({
                        ...novoPresente,
                        imagem: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label>Link</Label>
                  <Input
                    type="text"
                    className="bg-transparent"
                    value={novoPresente.link}
                    onChange={(e) =>
                      setNovoPresente({
                        ...novoPresente,
                        link: e.target.value,
                      })
                    }
                    placeholder="Link"
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label>Descrição</Label>
                  <Input
                    type="textarea"
                    className="bg-transparent"
                    value={novoPresente.descricao}
                    onChange={(e) =>
                      setNovoPresente({
                        ...novoPresente,
                        descricao: e.target.value,
                      })
                    }
                    placeholder="Descrição"
                  />
                </FormGroup>
              </Col>
            </Row>
                  
            <div className="text-end mt-3">
              <Button
                className="btn--purple"
                onClick={adicionarPresente}
              >
                Adicionar Presente
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>

      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mt-5">Lista de Convidados</h2>
        <Button className="btn--purple" onClick={exportarConvidados}>
          Exportar Excel
        </Button>
      </div>
      <Card className="bg--blue text-white mb-4 card-infos">
        <CardBody>
          <b>Confirmados:</b> {confirmados} <br />
          <b>Não vão:</b> {recusados} <br />
          <b>Pendentes:</b> {pendentes} <br / >
          <b>Total de crianças:</b> {totalCriancas} <br />
        </CardBody>
      </Card>

    <Input
      type="text"
      placeholder="Buscar grupo..."
      value={buscaGrupo}
      onChange={(e) => setBuscaGrupo(e.target.value)}
      className="w-100 mb-3"
    />  

    {gruposFiltrados.length === 0 && (
      <p className="text-center mt-3">Nenhum grupo encontrado</p>
    )}

    {gruposPaginados.map((grupo) => {
      const lista = getConvidadosPorGrupo(grupo.id);

      return (
        <Card key={grupo.id} className="mb-3 shadow-sm">
          <CardBody>
            <div className="d-md-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {grupo.nome_grupo}
                <small className="ms-2 text-muted">({grupo.token})</small>
              </h5>

              <div className="d-flex">
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    className="btn btn--purple "
                    onClick={() => {
                      setNovosConvidados([{ nome: "", principal: false, crianca: false }]);
                      setGrupoEditando(grupo);
                      setModalAdicionarConvidado(true);
                    }}
                  >
                    + Convidado
                  </Button>
                  
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => editarGrupo(grupo)}
                  >
                    <FaEdit />
                  </button>
                  
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => excluirGrupo(grupo.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
      
            {lista.map((c) => (
              <div
                key={c.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>
                  {c.nome} {c.principal && "⭐"} {c.crianca && "(criança)"}
                  <br />
                  <small
                    style={{
                      color:
                        getStatus(c) === "confirmado"
                          ? "green"
                          : getStatus(c) === "recusado"
                          ? "red"
                          : "orange",
                      fontWeight: 500,
                    }}
                  >
                    {getStatus(c) === "confirmado" && "🟢 Confirmado"}
                    {getStatus(c) === "recusado" && "🔴 Não vai"}
                    {getStatus(c) === "pendente" && "🟡 Pendente"}
                  </small>
                </div>
            
                <div>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => editarConvidado(c)}
                  >
                    <FaEdit />
                  </button>
            
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => excluirConvidado(c.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      );
      })}
      <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
        <Button
          className="btn btn--purple"
          disabled={paginaAtual === 1}
          onClick={() => setPaginaAtual((p) => p - 1)}
        >
          ←
        </Button>

        <span>
          Página {paginaAtual} de {totalPaginas}
        </span>

        <Button
          className="btn btn--purple"
          disabled={paginaAtual === totalPaginas}
          onClick={() => setPaginaAtual((p) => p + 1)}
        >
          →
        </Button>
      </div>
      <small className="d-block text-center mt-3 ">Total de convidados: {totalConvidados}</small>

      <Card className="mt-4 shadow-sm">
        <CardBody>
        <h2 className="mb-3">Adicionar Grupo</h2>

        <Row className="g-3">
          <Col md={6}>
            <Input
              placeholder="Nome do grupo"
              value={novoGrupo.nome_grupo}
              onChange={(e) =>
                setNovoGrupo({ ...novoGrupo, nome_grupo: e.target.value })
              }
            />
          </Col>
            
          <Col md={6}>
           <Input
            placeholder="Token (automático)"
            value={novoGrupo.token}
            onFocus={async () => {
              if (!novoGrupo.token) {
                const token = await gerarTokenUnico();
              
                setNovoGrupo((prev) => ({
                  ...prev,
                  token,
                }));
              }
            }}
            readOnly
          />
          </Col>
        </Row>

        <hr />

        <h5>Convidados</h5>

        {novosConvidados.map((c, index) => (
            <Row key={index} className="mb-2">
              <Col md={4}>
                <Input
                  placeholder="Nome"
                  value={c.nome}
                  onChange={(e) =>
                    atualizarConvidado(index, "nome", e.target.value)
                  }
                />
              </Col>
                
              <Col md={2}>
                <Input
                  type="checkbox"
                  checked={c.principal}
                  onChange={(e) =>
                    atualizarConvidado(index, "principal", e.target.checked)
                  }
                />{" "}
                Principal
              </Col>

              <Col md={2}>
                <Input
                  type="checkbox"
                  checked={c.crianca}
                  onChange={(e) =>
                    atualizarConvidado(index, "crianca", e.target.checked)
                  }
                />{" "}
                Criança
              </Col>
                
              <Col md={3}>
                <Button
                  color="danger"
                  size="sm"
                  onClick={() => removerCampoConvidado(index)}
                >
                  Remover
                </Button>
              </Col>
            </Row>
          ))}

          <Button className="btn btn--purple mt-2" onClick={adicionarCampoConvidado}>
            + convidado
          </Button>
        
          <div className="text-end mt-3">
            <Button className="btn--purple" onClick={criarGrupoComConvidados}>
              Criar Grupo
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* modal editar */}
      <Modal isOpen={modalEditar} toggle={toggleModalEditar} centered size="lg">
        <ModalHeader toggle={toggleModalEditar}>
          Editar Presente: {presenteEditando?.nome}
        </ModalHeader>

        <ModalBody>
          {presenteEditando && (
            <Row className="g-3">
              <Col md={8}>
                <FormGroup>
                  <Label>Nome</Label>
                  <Input
                    className="bg-transparent"
                    value={presenteEditando.nome}
                    onChange={(e) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        nome: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
                  
              <Col md={2}>
                <FormGroup>
                  <Label>Preço</Label>
                  <NumericFormat
                    className="form-control bg-transparent"
                    value={presenteEditando.preco}
                    onValueChange={(values) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        preco: values.floatValue || 0,
                      })
                    }
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                    prefix="R$ "
                  />
                </FormGroup>
              </Col>

              <Col md={2}>
                <FormGroup>
                  <Label>Valor Arrecadado</Label>
                  <NumericFormat
                    className="form-control bg-transparent"
                    value={presenteEditando.valorArrecadado}
                    onValueChange={(values) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        valorArrecadado: values.floatValue || 0,
                      })
                    }
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                    prefix="R$ "
                  />
                </FormGroup>
              </Col>
                  
              <Col md={12}>
                <FormGroup>
                  <Label>QR Code PIX</Label>
                  <Input
                    className="bg-transparent"
                    value={presenteEditando.qrCodeValue}
                    onChange={(e) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        qrCodeValue: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
                  
              <Col md={12}>
                <FormGroup>
                  <Label>Imagem</Label>
                  <Input
                    className="bg-transparent"
                    value={presenteEditando.imagem}
                    onChange={(e) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        imagem: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label>Reservado</Label>
                  <div>
                    <FormGroup check inline>
                      <Input
                        type="radio"
                        name="reservado"
                        checked={presenteEditando.reservado === true}
                        onChange={() =>
                          setPresenteEditando({ ...presenteEditando, reservado: true })
                        }
                      />
                      <Label check>Sim</Label>
                    </FormGroup>
                      
                    <FormGroup check inline>
                      <Input
                        type="radio"
                        name="reservado"
                        checked={presenteEditando.reservado === false}
                        onChange={() =>
                          setPresenteEditando({ ...presenteEditando, reservado: false })
                        }
                      />
                      <Label check>Não</Label>
                    </FormGroup>
                  </div>
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label>Link</Label>
                  <Input
                    type="text"
                    className="bg-transparent"
                    value={presenteEditando.link ?? ""}
                    onChange={(e) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        link: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label>Descrição</Label>
                  <Input
                    type="textarea"
                    className="bg-transparent"
                    value={presenteEditando.descricao ?? ""}
                    onChange={(e) =>
                      setPresenteEditando({
                        ...presenteEditando,
                        descricao: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
            </Row>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button className="btn--purple" onClick={salvarEdicao}>
            Salvar alterações
          </Button>
          <Button color="secondary" onClick={toggleModalEditar}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* modal editar grupo */}
      <Modal isOpen={modalGrupo} toggle={() => setModalGrupo(!modalGrupo)} centered>
        <ModalHeader toggle={() => setModalGrupo(!modalGrupo)}>
          Editar Grupo
        </ModalHeader>

        <ModalBody>
          {grupoEditando && (
            <FormGroup>
              <Label>Nome do grupo</Label>
              <Input
                value={grupoEditando.nome_grupo}
                onChange={(e) =>
                  setGrupoEditando({
                    ...grupoEditando,
                    nome_grupo: e.target.value,
                  })
                }
              />
            </FormGroup>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button className="btn--purple" onClick={salvarGrupo}>
            Salvar
          </Button>
        
          <Button color="secondary" onClick={() => setModalGrupo(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      {/* modal editar convidado */}
      <Modal isOpen={modalEditarConvidado} toggle={toggleModalEditarConvidado} centered>
        <ModalHeader toggle={toggleModalEditarConvidado}>
          Editar Convidado
        </ModalHeader>

        <ModalBody>
          {convidadoEditando && (
            <>
              <FormGroup>
                <Label>Nome</Label>
                <Input
                  value={convidadoEditando.nome}
                  onChange={(e) =>
                    setConvidadoEditando({
                      ...convidadoEditando,
                      nome: e.target.value,
                    })
                  }
                />
              </FormGroup>
                
              <FormGroup className="mt-3">
                <Label>Principal</Label>
                <div>
                  <Input
                    type="checkbox"
                    checked={convidadoEditando.principal}
                    onChange={(e) =>
                      setConvidadoEditando({
                        ...convidadoEditando,
                        principal: e.target.checked,
                      })
                    }
                  />{" "}
                  É o principal do grupo
                </div>
              </FormGroup>

              <FormGroup className="mt-3">
                <Label>Criança</Label>
                <div>
                  <Input
                    type="checkbox"
                    checked={convidadoEditando?.crianca || false}
                    onChange={(e) =>
                      setConvidadoEditando({
                        ...convidadoEditando!,
                        crianca: e.target.checked,
                      })
                    }
                  />{" "}
                  É uma criança
                </div>
              </FormGroup>
                  
              <FormGroup className="mt-3">
                <Label>Status</Label>
                <div>
                  <FormGroup check inline>
                    <Input
                      type="radio"
                      name="status"
                      checked={getStatus(convidadoEditando) === "confirmado"}
                      onChange={() =>
                        setConvidadoEditando({
                          ...convidadoEditando,
                          status: "confirmado",
                          confirmou: true,
                        })
                      }
                    />
                    <Label check>Confirmado</Label>
                  </FormGroup>
                    
                  <FormGroup check inline>
                    <Input
                      type="radio"
                      name="status"
                      checked={getStatus(convidadoEditando) === "recusado"}
                      onChange={() =>
                        setConvidadoEditando({
                          ...convidadoEditando,
                          status: "recusado",
                          confirmou: false,
                        })
                      }
                    />
                    <Label check>Não vai</Label>
                  </FormGroup>
                    
                  <FormGroup check inline>
                    <Input
                      type="radio"
                      name="status"
                      checked={getStatus(convidadoEditando) === "pendente"}
                      onChange={() =>
                        setConvidadoEditando({
                          ...convidadoEditando,
                          status: "pendente",
                          confirmou: false,
                        })
                      }
                    />
                    <Label check>Pendente</Label>
                  </FormGroup>
                </div>
              </FormGroup>
            </>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button className="btn--purple" onClick={salvarConvidado}>
            Salvar
          </Button>
        
          <Button color="secondary" onClick={toggleModalEditarConvidado}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modalAdicionarConvidado} toggle={toggleModalAdicionarConvidado}>
        <ModalHeader toggle={toggleModalAdicionarConvidado}>
          Adicionar Convidados
        </ModalHeader>
              
        <ModalBody>
          {novosConvidados.map((c, index) => (
            <Row key={index} className="mb-2">
              <Col md={4}>
                <Input
                  placeholder="Nome"
                  value={c.nome}
                  onChange={(e) =>
                    atualizarConvidado(index, "nome", e.target.value)
                  }
                />
              </Col>
                
              <Col md={2}>
                <Input
                  type="checkbox"
                  checked={c.principal}
                  onChange={(e) =>
                    atualizarConvidado(index, "principal", e.target.checked)
                  }
                />{" "}
                Principal
              </Col>

              <Col md={2}>
                <Input
                  type="checkbox"
                  checked={c.crianca}
                  onChange={(e) =>
                    atualizarConvidado(index, "crianca", e.target.checked)
                  }
                />{" "}
                Criança
              </Col>
                
              <Col md={3}>
                <Button
                  color="danger"
                  size="sm"
                  onClick={() => removerCampoConvidado(index)}
                >
                  Remover
                </Button>
              </Col>
            </Row>
          ))}
      
          <Button size="sm" onClick={adicionarCampoConvidado}>
            + Adicionar campo
          </Button>
        </ModalBody>
        
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => {
              if (!grupoEditando) return;
              adicionarConvidadosExistente(grupoEditando.id);
              setModalAdicionarConvidado(false);
            }}
          >
            Salvar
          </Button>
        </ModalFooter>
      </Modal>


    </Container>

    
  );
}