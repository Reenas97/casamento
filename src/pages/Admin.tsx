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


    </Container>

    
  );
}