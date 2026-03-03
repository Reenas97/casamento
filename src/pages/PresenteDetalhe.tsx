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
import { Button, Container, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Form, Tooltip, Row, Col } from "reactstrap";
import { FaHandSparkles, FaInfoCircle, FaSmile, FaSmileBeam } from "react-icons/fa";
import { swalError, swalSuccess } from "../helpers/swalAlert";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  reservado: boolean;
  descricao?: string;
  qrCodeValue: string;
  link: string;
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
  const togglePix = () => setShowPix(!showPix);
  const [modoPix, setModoPix] = useState<"full" | "partial" | "externo">("full");
  const [valorParcial, setValorParcial] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(false);
const toggleTooltip = () => setTooltipOpen(!tooltipOpen);

//carregar presente
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
    }
  }

  carregar();
}, [id]);

//reservar presente
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
        await swalError(
          "Ops!",
          "Esse presente já foi escolhido."
        );
        throw "Já reservado";
      }
      transaction.update(ref, {
        reservado: true,
        reservadoPor: nome || "Convidado",
        //mensagemConvidado: mensagem || "",
      });
    });
    await swalSuccess(
      "Presente reservado!",
      "Muito obrigada pelo carinho 💜"
    );
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

// confirma PIX manualmente
async function confirmarPix() {
if (!nome.trim()) {
  alert("Por favor, informe seu nome!");
  return;
}

//reservar presente
await reservarPresente();

// salvar confirmação no Firestore
await addDoc(collection(db, "pagamentos"), {
  presenteId: id,
  nomeConvidado: nome,
  valorPago: modoPix === "full" ? presente?.preco : Number(valorParcial),
  tipo: modoPix,
  confirmado: true,
  data: serverTimestamp(),
});

//salvar mensagem do convidado na coleção 'mensagens'
if (mensagem.trim()) {
  await addDoc(collection(db, "mensagens"), {
    presenteId: id,
    nomeConvidado: nome,
    mensagem: mensagem,
    data: serverTimestamp(), // Firebase cria timestamp automático
  });
}

await enviarEmail();
  await swalSuccess(
    "Pagamento confirmado!",
    "Obrigada pelo presente 💖"
  );
}

if (!presente) return <p>Carregando...</p>;

function abrirPixCompleto() {
  setModoPix("full");
  setShowPix(true);
}

function abrirPixParcial() {
  setModoPix("partial");
  setShowPix(true);
}

function abrirCompraExterna() {
  setModoPix("externo");
  setShowPix(true);
}

  return (
    <Container className="py-5">
      <Row>
        <Col xs="12" md="12" lg="12" className="mb-3">
          <h1>{presente.nome}</h1>
        </Col>
        <Col xs="12" md="6" lg="6" className="mb-4">
          <img
            src={presente.imagem || "/placeholder.jpg"}
            alt={presente.nome}
            className="present-card__img mb-3"
          />
          <p className="fs-3">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(presente.preco)}
          </p>
        </Col>
        <Col xs="12" md="6" lg="6" className="mb-4 d-flex align-items-center text-center">
          {presente.reservado ? (
            <h5 className="text-danger">
              Este presente já foi escolhido
            </h5>
            ) : (
            <div className="d-flex flex-column align-items-center justify-content-center gap-3 mt-3">
              {/*  compra inteira */}
              <div>
                <Button
                  className="btn--purple d-block mx-auto"
                  size="lg"
                  onClick={abrirPixCompleto}
                >
                  Comprar presente completo
                </Button>
                <small className="text-muted d-block mt-1">
                  Você paga o valor total e reserva este presente para você.
                </small>
              </div>
              {/*compra parcial */}
              <div className="mx-auto">
                <Button
                  className="btn--purple d-block mx-auto"
                  size="lg"
                  onClick={abrirPixParcial}
                >
                  Ajudar com qualquer valor
                </Button>
                <small className="text-muted d-block mt-1">
                  Contribua com qualquer quantia. O presente continua disponível até atingir o valor total.
                </small>
              </div>
              {/* compra externa */}
              {presente.link && (
                <div className="mx-auto">
                  <Button
                    color="secondary"
                    size="lg"
                    onClick={abrirCompraExterna}
                    className="d-block mx-auto btn--purple"
                  >
                    Comprar no site da loja
                  </Button>
                  <small className="text-muted d-block mt-1">
                    Você será direcionado para a loja para comprar este presente.
                  </small>
                </div>
              )}
            </div>
          )}
        </Col>
        <Col xs="12" md="12" lg="12" className="mt-4">
          <hr />
          <p>{presente.descricao || "Sem descrição"}</p>
        </Col>
      </Row>
      {/* Modal PIX */}
      <Modal isOpen={showPix} toggle={togglePix} size="lg" centered backdrop="static">
        <ModalHeader toggle={togglePix} className="text-center justify-content-between" tag={'h1'}>
          {modoPix === "full"
            ? "Fazer o PIX do valor inteiro"
            : modoPix === "partial"
            ? "Contribuir com este presente"
            : "Comprar na loja"
          }
            {modoPix === "full" && (
              <>
                <FaInfoCircle
                  id="infoCompra"
                  style={{ cursor: "pointer", marginLeft: 6 }}
                />
                <Tooltip
                  placement="top"
                  isOpen={tooltipOpen}
                  target="infoCompra"
                  toggle={toggleTooltip}
                >
                  Oii! É a Renata aqui 
                  <FaHandSparkles
                    style={{ cursor: "pointer", marginLeft: 6 }}
                  />
                  Infelizmente não tem como parcelar o presente, pois Gatways de pagamento são pagos e a gente nao queria pagar taxa. 
                  Então esse modo é apenas pix à vista. Caso queria "parcelar" escolha o outro modo, que é tipo um parcelamento coletivo. Obrigadaa
                  <FaSmileBeam
                    style={{ cursor: "pointer", marginLeft: 6 }}
                  />
                </Tooltip>
            </>
          )}
        </ModalHeader>
        <ModalBody className="text-center">
          {modoPix !== "externo" ? (
            <>
              <p>
                Chave PIX: <b>chavepix@email.com</b>
              </p>

              <div className="d-flex justify-content-center mb-3">
                <div className="pix-container">
                  <QRCode value={presente.qrCodeValue} size={180} />
                </div>
              </div>
              <p className="mt-5">
                Ao realizar o pix, por favor, não se esqueça de preencher o formulário abaixo
                <FaSmile
                  style={{ marginLeft: 6, color:  '#CD67FF' }}
                />
              </p>
            </>
          ) : (
            <div className="text-center mb-3">
              <p className="fs-5">
                Você será redirecionado para a loja para comprar este presente 💜
              </p>
          
              <p className="text-muted">
                Ao escolher esse modo, entre em contato com os noivos para combinar a etrega.
              </p>
          
              <Button
                size="lg"
                href={presente.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 btn--purple"
              >
                Ir para a loja
              </Button>
            <p className="mt-5">
              Ao realizar a compra do presente, por favor, não se esqueça de preencher o formulário abaixo
              <FaSmile
                style={{ marginLeft: 6, color:  '#CD67FF' }}
              />
            </p>
            </div>
          )}
          <Form>
            {modoPix === "partial" && (
            <FormGroup>
              <Label>Com quanto você deseja contribuir?</Label>
              <Input
                type="number"
                min="1"
                value={valorParcial}
                onChange={(e) => setValorParcial(e.target.value)}
                placeholder="Digite o valor"
                className="bg-transparent"
              />
            </FormGroup>
          )}
            <FormGroup>
              <Label>Seu nome:</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="bg-transparent"
              />
            </FormGroup>
            <FormGroup>
              <Label>Seu e-mail:</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="bg-transparent"
              />
            </FormGroup>
            <FormGroup>
              <Label>Deixe a sua mensagem para os noivos: </Label>
              <Input
                type="textarea"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Opcional"
                className="bg-transparent"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            className="btn--purple"
            onClick={confirmarPix}
            disabled={loading}
          >
            {loading
              ? <Spinner size="sm" />
              : modoPix === "externo"
              ? "Já comprei"
              : "Confirmar PIX"}
          </Button>
          <Button color="secondary" onClick={togglePix} disabled={loading}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}