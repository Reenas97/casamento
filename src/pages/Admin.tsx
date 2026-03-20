import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
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
  const gruposPorPagina = 10;
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
  const confirmados = convidados.filter(c => c.confirmou).length;
  const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null);
  const [modalGrupo, setModalGrupo] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState({
    nome_grupo: "",
    token: "",
  });

  const [novosConvidados, setNovosConvidados] = useState<
    { nome: string; principal: boolean }[]
  >([{ nome: "", principal: false }]);

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
    });

    await swalSuccess("Convidado atualizado!");

    setModalEditarConvidado(false);
    setConvidadoEditando(null);
  }

  function adicionarCampoConvidado() {
    setNovosConvidados([
      ...novosConvidados,
      { nome: "", principal: false },
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
      // cria grupo
      const docRef = await addDoc(collection(db, "grupos"), {
        nome_grupo: novoGrupo.nome_grupo,
        token: novoGrupo.token || Math.random().toString(36).substring(2, 8),
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
      setNovosConvidados([{ nome: "", principal: false }]);
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

  return (
    <Container className="py-4">
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

      <h2 className="mt-5">Lista de Convidados</h2>
      <p>
        <b>Confirmados:</b> {confirmados} / {totalConvidados}
      </p>

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
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {grupo.nome_grupo}
                <small className="ms-2 text-muted">({grupo.token})</small>
              </h5>

              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  className="btn--purple"
                  onClick={() => {
                    setNovosConvidados([{ nome: "", principal: false }]);
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
      
            {lista.map((c) => (
              <div
                key={c.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>
                  {c.nome} {c.principal && "⭐"}
                  <br />
                  <small
                    style={{
                      color: c.confirmou ? "green" : "red",
                      fontWeight: 500,
                    }}
                  >
                    {c.confirmou ? "Confirmado" : "Pendente"}
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
              placeholder="Token (opcional)"
              value={novoGrupo.token}
              onChange={(e) =>
                setNovoGrupo({ ...novoGrupo, token: e.target.value })
              }
            />
          </Col>
        </Row>

        <hr />

        <h5>Convidados</h5>

        {novosConvidados.map((c, index) => (
            <Row key={index} className="mb-2">
              <Col md={6}>
                <Input
                  placeholder="Nome"
                  value={c.nome}
                  onChange={(e) =>
                    atualizarConvidado(index, "nome", e.target.value)
                  }
                />
              </Col>
                
              <Col md={3}>
                <Input
                  type="checkbox"
                  checked={c.principal}
                  onChange={(e) =>
                    atualizarConvidado(index, "principal", e.target.checked)
                  }
                />{" "}
                Principal
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

          <Button className="btn btn--purple" onClick={adicionarCampoConvidado}>
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
                <Label>Confirmou presença</Label>
                <div>
                  <Input
                    type="checkbox"
                    checked={convidadoEditando.confirmou}
                    onChange={(e) =>
                      setConvidadoEditando({
                        ...convidadoEditando,
                        confirmou: e.target.checked,
                      })
                    }
                  />{" "}
                  Confirmado
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
              <Col md={6}>
                <Input
                  placeholder="Nome"
                  value={c.nome}
                  onChange={(e) =>
                    atualizarConvidado(index, "nome", e.target.value)
                  }
                />
              </Col>
                
              <Col md={3}>
                <Input
                  type="checkbox"
                  checked={c.principal}
                  onChange={(e) =>
                    atualizarConvidado(index, "principal", e.target.checked)
                  }
                />{" "}
                Principal
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