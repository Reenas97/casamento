import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { Container, Row, Col, Card, CardBody, Badge, PaginationItem, Pagination, PaginationLink, CardImg, Progress, Label, Input, Tooltip  } from "reactstrap";
import { FiInfo } from "react-icons/fi";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  reservado: boolean;
  imagem?: string;
  link?: string;
  qrCodeValue?: string;
  valorArrecadado?: number; 
  descricao?: string;
};


export default function ListaPresentes() {

  const [presentes, setPresentes] = useState<Presente[]>([]);
  const navigate = useNavigate();
  const itensPorPagina = 12;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroPagamento, setFiltroPagamento] = useState<string>("todos");
  const [filtroValor, setFiltroValor] = useState<string>("todos");
  const [filtroFaltante, setFiltroFaltante] = useState<string>("todos");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTooltip = () => setTooltipOpen(!tooltipOpen);

  const presentesFiltrados = presentes.filter((p) => {
    const temLink = !!p.link?.trim();
    const temPix = !!p.qrCodeValue?.trim();

    const valorArrecadado = Number(p.valorArrecadado || 0);
    const precoTotal = Number(p.preco || 0);
    //const faltante = Math.max(precoTotal - valorArrecadado, 0);
    const porcentagem =
    precoTotal > 0 ? (valorArrecadado / precoTotal) * 100 : 0;

    //filtro por pagamento
    if (filtroPagamento === "pix" && (!temPix || valorArrecadado > 0))
      return false;
    if (filtroPagamento === "link" && (!temLink || valorArrecadado > 0)) return false;
    
    //filtro por valor
    if (filtroValor === "ate100" && precoTotal > 100) return false;

    if (filtroValor === "100a300" && (precoTotal < 100 || precoTotal > 300))
      return false;

    if (filtroValor === "300a500" && (precoTotal < 300 || precoTotal > 500))
      return false;

    if (filtroValor === "500a1000" && (precoTotal < 500 || precoTotal > 1000))
      return false;

    if (filtroValor === "acima1000" && precoTotal <= 1000)
      return false;

    //filtro por faltante
    if (filtroFaltante === "naoIniciado" && valorArrecadado > 0)
      return false;

    if (filtroFaltante === "iniciado" && valorArrecadado === 0)
      return false;

    if (filtroFaltante === "menos50" && porcentagem < 50)
      return false;

    if (filtroFaltante === "mais50" && porcentagem >= 50)
      return false;

      return true;
  });


  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;

  const presentesPaginados = presentesFiltrados.slice(
    indexPrimeiro,
    indexUltimo
  );

  const totalPaginas = Math.ceil(
    presentesFiltrados.length / itensPorPagina
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "presentes"), (snapshot) => {
      const lista: Presente[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Presente, "id">),
      }));

      setPresentes(lista);
    });

    return () => unsubscribe();
  }, []);



  //const totalPaginas = Math.ceil(presentes.length / itensPorPagina);

  return (
    <Container className="py-5 my-5">
      <h1 className="d-flex align-items-center justify-content-center gap-3">
        Lista de Presentes
        <span
          id="infoPresentes"
          style={{ cursor: "pointer", fontSize: "18px" }}
        >
          <FiInfo size={50}  className="icon-info"/>
        </span>
      </h1>

      <Tooltip
        placement="right"
        isOpen={tooltipOpen}
        target="infoPresentes"
        toggle={toggleTooltip}
      >
        <div style={{ textAlign: "left" }}>
          <strong>Formas de presentear:</strong>
          <br /><br />
          <span className="dot--pix-parcial tooltip-dot"></span>
          <b>Pix parcial</b>: você pode contribuir com qualquer valor.
          <br />
          <span className="dot--pix-total tooltip-dot"></span>
          <b>Pix total</b>: pagar o valor completo do presente via Pix.
          <br />
          <span className="dot--loja tooltip-dot"></span>
          <b>Loja</b>: comprar o presente diretamente na loja.
        </div>
      </Tooltip>
      <Row className="mt-4">
        {/* filtro pagamento */}
        <Col md="4" className="mb-3 filter">
            <Label>Filtro por forma de pagamento do presente: </Label>
          <Input
            className="form-select"
            type="select"
            value={filtroPagamento}
            onChange={(e) => {
              setFiltroPagamento(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todas as formas de pagamento</option>
            <option value="pix">PIX do valor total</option>
            <option value="link">Comprar na loja</option>
            <option value="parcial">Ajuda com pix de qualquer valor</option>
          </Input>
        </Col>
            
        {/* filtro valor */}
        <Col md="4" className="mb-3 filter">
          <Label>Filtro por valor do presente: </Label>
          <Input
            className="form-select"
            type="select"
            value={filtroValor}
            onChange={(e) => {
              setFiltroValor(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todos os valores</option>
            <option value="ate100">Até R$100</option>
            <option value="100a300">R$100 a R$300</option>
            <option value="300a500">R$300 a R$500</option>
            <option value="500a1000">R$500 a R$1000</option>
            <option value="acima1000">Acima de R$1000</option>
          </Input>
        </Col>
            
        {/* filtro faltante */}
        <Col md="4" className="mb-3 filter">
          <Label>Filtro por quanto falta pagar do presente: </Label>
          <Input
            className="form-select"
            type="select"
            value={filtroFaltante}
            onChange={(e) => {
              setFiltroFaltante(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todos os status</option>
            <option value="naoIniciado">Pagamento não iniciado</option>
            <option value="iniciado">Pagamento iniciado</option>
            <option value="menos50">Falta menos de 50%</option>
            <option value="mais50">Falta mais de 50%</option>
          </Input>
        </Col>
        {presentesPaginados.map((p) => {
          //flags de pagamento
          const temLink = !!p.link?.trim();
          const temPix = !!p.qrCodeValue?.trim();

          //progresso do presente
          const valorArrecadado = Number(p.valorArrecadado || 0);
          const precoTotal = Number(p.preco || 0);

          let meiosPagamento = [];

          if (valorArrecadado > 0) {
            meiosPagamento = ["Ajudar com qualquer valor"];
          } else {
            meiosPagamento = [
              "Ajudar com qualquer valor",
              temLink && "Comprar na loja",
              temPix && "Pagamento total via PIX",
            ].filter(Boolean);
          }

          let tagsPagamento: string[] = [];

          meiosPagamento.forEach((m) => {
            if (m === "Ajudar com qualquer valor") {
              tagsPagamento.push("Pix parcial");
            }
          
            if (m === "Pagamento total via PIX") {
              tagsPagamento.push("Pix total");
            }
          
            if (m === "Comprar na loja") {
              tagsPagamento.push("Loja");
            }
          });


          const porcentagem =
            precoTotal > 0
              ? Math.min((valorArrecadado / precoTotal) * 100, 100)
              : 0;

          const faltante = Math.max(precoTotal - valorArrecadado, 0);
          const indisponivel = p.reservado || valorArrecadado >= precoTotal;

          console.log(p.nome, indisponivel, tagsPagamento)
        
          return (
            <Col key={p.id} xs="12" md="6" lg="4" className="mb-3">
              <Card
                className="h-100 present-card shadow-sm"
                onClick={() => navigate(`/presente/${p.id}`)}
              >
                <div className="present-card__image-wrapper">
                  <CardImg
                    src={p.imagem || "/placeholder.jpg"}
                    alt={p.nome}
                    className="present-card__img"
                  />
                  <div className="present-card__overlay" />
                  <div className="present-card__title">{p.nome}</div>
                </div>
          
                <CardBody>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <p className="fw-bold mb-0">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(p.preco)}
                    </p>
                    {/*MEIOS DE PAGAMENTO */}
                    {!indisponivel && (
                      <div className="d-flex gap-1 flex-wrap">
                        {tagsPagamento.map((tag, i) => {
                          let badgeClass = "";

                          if (tag === "Pix parcial") badgeClass = "badge--pix-parcial";
                          if (tag === "Pix total") badgeClass = "badge--pix-total";
                          if (tag === "Loja") badgeClass = "badge--loja";

                          return (
                            <Badge key={i} pill className={badgeClass}>
                              {tag}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* PROGRESSO */}
                  <div className="mb-2">
                    <small className="text-white">
                      Arrecadado:{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(valorArrecadado)}
                    </small>
                    
                    <Progress
                      value={porcentagem}
                      className="mt-1"
                      style={{ height: "8px" }}
                    />
                  
                    {faltante > 0 && (
                      <small className="text-white">
                        Falta:{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(faltante)}
                      </small>
                    )}
                  </div>

                  <p>{p.descricao}</p>
                  
                  <Badge
                    className={`border ${
                      p.reservado || valorArrecadado >= precoTotal
                        ? "border-danger"
                        : "border-success"
                    } badge--disponibility`}
                  >
                    {p.reservado || valorArrecadado >= precoTotal
                      ? "Indisponível"
                      : "Disponível"}
                  </Badge>
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>
      {totalPaginas > 1 && (
        <Pagination className="d-flex justify-content-center mt-2">
          <PaginationItem disabled={paginaAtual === 1}>
            <PaginationLink
              previous
              onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
            />
          </PaginationItem>
            
          {[...Array(totalPaginas)].map((_, i) => (
            <PaginationItem active={paginaAtual === i + 1} key={i}>
              <PaginationLink onClick={() => setPaginaAtual(i + 1)}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
      
          <PaginationItem disabled={paginaAtual === totalPaginas}>
            <PaginationLink
              next
              onClick={() =>
                setPaginaAtual((p) => Math.min(p + 1, totalPaginas))
              }
            />
          </PaginationItem>
        </Pagination>
      )}
      <p className="text-sm-center mt-1"><small>Total de presentes: {presentes.length}</small></p>
    </Container>
  );
}