import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
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
import { Button, Container, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Form, Tooltip, Row, Col, Progress } from "reactstrap";
import { FaHandSparkles, FaInfoCircle, FaSmile, FaSmileBeam } from "react-icons/fa";
import { swalError, swalSuccess } from "../helpers/swalAlert";
import qrCodePartial from "../assets/qrcode.png";
import { NumericFormat } from "react-number-format";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  reservado: boolean;
  descricao?: string;
  qrCodeValue: string;
  link: string;
  valorArrecadado?: number // quanto já foi pago
};

export default function PresenteDetalhe() {
  const { id } = useParams();
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

async function enviarEmail(valorPago: number) {
  try {
    await emailjs.send(
      "service_li6djxs",
      "template_7ok3rdj",
      {
        nome: nome,
        presente: presente?.nome,
        valor: valorPago,
        mensagem: mensagem || "Sem mensagem",
        to_email: email,
      },
      "emvFITicujaJMTYks"
    );

    console.log("Email enviado!");
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    await swalError("Ops!", "Algo deu errado.");
  }
}

// confirma PIX manualmente
async function confirmarPix() {
  setLoading(true);
  let quitouPresente = false;

  try {
    if (!nome.trim()) {
      alert("Por favor, informe seu nome!");
      setLoading(false);
      return;
    }

    if (modoPix === "partial" && (!valorParcial || Number(valorParcial) <= 0)) {
      alert("Informe um valor válido para contribuir.");
      setLoading(false);
      return;
    }

    //atualizar arrecadação / reserva
    await runTransaction(db, async (transaction) => {
      if (!id) return;
    
      const ref = doc(db, "presentes", id);
      const snap = await transaction.get(ref);
    
      if (!snap.exists()) throw "Presente não existe";
    
      const dados = snap.data();
    
      if (dados.reservado) {
        throw new Error("Presente já reservado");
      }
    
      const precoTotal = Number(dados.preco || 0);
    
      const valorPago =
        modoPix === "full"
          ? precoTotal
          : Number(valorParcial || 0);
    
      const valorAtual = Number(dados.valorArrecadado || 0);
      const novoTotal = valorAtual + valorPago;
    
      const updateData: any = {
        valorArrecadado: novoTotal,
      };
    
      // ✅ verifica quitação
      quitouPresente =
        modoPix === "full" || novoTotal >= precoTotal;
    
      if (quitouPresente) {
        updateData.reservado = true;
        updateData.reservadoPor = nome || "Convidado";
      }
    
      transaction.update(ref, updateData);
      setPresente((prev) =>
        prev
          ? {
              ...prev,
              valorArrecadado:
                (prev.valorArrecadado || 0) + valorPago,
              reservado: quitouPresente ? true : prev.reservado,
            }
          : prev
      );
    });

    const valorPagoFinal =
      modoPix === "full"
      ? presente?.preco || 0
      : Number(valorParcial);

    // salvar confirmação no Firestore
    await addDoc(collection(db, "pagamentos"), {
      presenteId: id,
      nomeConvidado: nome,
      valorPago: valorPagoFinal,
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

    await enviarEmail(valorPagoFinal);

    if (quitouPresente) {
      await swalSuccess(
        "Presente reservado! 🎁",
        "Muito obrigada pelo carinho 💜"
      );
    } else {
      await swalSuccess(
        "Pagamento confirmado! 💖",
        "Sua contribuição foi registrada. Obrigada!"
      );
    }
  } catch (error) {
    console.error(error);
    await swalError("Ops!", "Não foi possível confirmar o pagamento.");
  } finally {
    setLoading(false);
  }
}

if (!presente) return <p>Carregando...</p>;

const valorArrecadado = presente.valorArrecadado || 0;
const faltante = Math.max(presente.preco - valorArrecadado, 0);
const pixColetivoIniciado = valorArrecadado > 0;
const percentual =
  presente.preco > 0
    ? Math.min((valorArrecadado / presente.preco) * 100, 100)
    : 0;

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
        <Col xs="12" md="6" lg="6" className="mb-4">
          {presente.reservado ? (
            <h5 className="text-danger">
              Este presente já foi escolhido
            </h5>
            ) : (
            <>
                {presente.preco > 0 && (
                  <div className="my-5 w-100">
                    <Progress value={percentual} />
                                
                    <div className="d-flex justify-content-between mt-1 small text-muted">
                      <span>
                        Arrecadado:{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(valorArrecadado)}
                      </span>
                      
                      <span>
                        Falta:{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(faltante)}
                      </span>
                    </div>
                  </div>
                )}
              <div className="d-flex flex-column align-items-center justify-content-center gap-3 mt-5">
               {/* compra inteira */}
                {!!presente.qrCodeValue?.trim() && !pixColetivoIniciado && (
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
                )}
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
            </>
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
                Chave PIX: <b>rdbsanchez@gmail.com</b>
              </p>

              <div className="d-flex justify-content-center mb-3">
                <div className="pix-container">
                  {modoPix === "full"
                    ?
                    <QRCode value={presente.qrCodeValue} size={180} />
                    : 
                    <img
                      src={qrCodePartial}
                      alt={'qr code'}
                    />
                  }
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
                Ao escolher esse modo, entre em contato com os noivos para combinar a entrega.
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
              <NumericFormat
                value={valorParcial}
                onValueChange={(values) => {
                  setValorParcial(values.value); // valor numérico limpo
                }}
                placeholder="Digite o valor"
                className="bg-transparent form-control"
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                prefix="R$ "
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