import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {Container, Row, Col, Card, CardBody, Badge, PaginationItem, Pagination, PaginationLink, CardImg, Progress } from "reactstrap";
import bannerPhoto from "../src/assets/photo_banner2.jpg";
import FlipClockCountdown from "@leenguyen/react-flip-clock-countdown";
import "@leenguyen/react-flip-clock-countdown/dist/index.css";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  reservado: boolean;
  imagem?: string;
  link?: string;
  qrCodeValue?: string;
  valorArrecadado?: number; 
};

function App() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const navigate = useNavigate();
  const itensPorPagina = 12;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroPagamento, setFiltroPagamento] = useState<string>("todos");
  const [filtroValor, setFiltroValor] = useState<string>("todos");
  const [filtroFaltante, setFiltroFaltante] = useState<string>("todos");

  const presentesFiltrados = presentes.filter((p) => {
    const temLink = !!p.link?.trim();
    const temPix = !!p.qrCodeValue?.trim();

    const valorArrecadado = Number(p.valorArrecadado || 0);
    const precoTotal = Number(p.preco || 0);
    const faltante = Math.max(precoTotal - valorArrecadado, 0);

    //filtro por pagamento
    if (filtroPagamento === "pix" && !temPix) return false;
    if (filtroPagamento === "link" && !temLink) return false;
    if (filtroPagamento === "parcial" && precoTotal <= 0) return false;
    
    //filtro por valor
    if (filtroValor === "ate100" && precoTotal > 100) return false;
    if (filtroValor === "100a300" && (precoTotal < 100 || precoTotal > 300)) return false;
    if (filtroValor === "acima300" && precoTotal <= 300) return false;

    //filtro por faltante
    if (filtroFaltante === "quitado" && faltante > 0) return false;
    if (filtroFaltante === "faltando" && faltante === 0) return false;

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
      <Container>
      <div
        className="photo-banner"
        style={{ backgroundImage: `url(${bannerPhoto})` }}
      >
        <h1 className="banner-title">Renata & Pedro</h1>
        <p className="banner-text">30/08/2026</p>
      </div>

      <div className="d-flex pt-5 pb-4 align-items-center justify-content-center">
         <FlipClockCountdown
          to={new Date("2026-08-30T12:30:00")}
          labels={["Dias", "Horas", "Minutos", "Segundos"]}
          className="flip-custom"
        />
      </div>

      <h1>Lista de Presentes</h1>
      <Row className="mt-4">
        {/* filtro pagamento */}
        <Col md="4">
          <select
            className="form-select"
            value={filtroPagamento}
            onChange={(e) => {
              setFiltroPagamento(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todos pagamentos</option>
            <option value="pix">PIX total</option>
            <option value="link">Comprar na loja</option>
            <option value="parcial">Ajuda parcial</option>
          </select>
        </Col>
            
        {/* filtro valor */}
        <Col md="4">
          <select
            className="form-select"
            value={filtroValor}
            onChange={(e) => {
              setFiltroValor(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todos valores</option>
            <option value="ate100">Até R$100</option>
            <option value="100a300">R$100 a R$300</option>
            <option value="acima300">Acima de R$300</option>
          </select>
        </Col>
            
        {/* filtro faltante */}
        <Col md="4">
          <select
            className="form-select"
            value={filtroFaltante}
            onChange={(e) => {
              setFiltroFaltante(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todos status</option>
            <option value="faltando">Ainda faltando</option>
            <option value="quitado">Já quitado</option>
          </select>
        </Col>
        {presentesPaginados.map((p) => {
          //flags de pagamento
          const temLink = !!p.link?.trim();
          const temPix = !!p.qrCodeValue?.trim();
        
          const meiosPagamento = [
            "Ajudar com qualquer valor",
            temLink && "Comprar na loja",
            temPix && "Pagamento total via PIX",
          ].filter(Boolean);

          //progresso do presente
          const valorArrecadado = Number(p.valorArrecadado || 0);
          const precoTotal = Number(p.preco || 0);

          const porcentagem =
            precoTotal > 0
              ? Math.min((valorArrecadado / precoTotal) * 100, 100)
              : 0;

          const faltante = Math.max(precoTotal - valorArrecadado, 0);
        
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
                  <p className="fw-bold mb-2">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(p.preco)}
                  </p>

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
                  
                  {/*MEIOS DE PAGAMENTO */}
                  <div className="present-card__payments mb-2">
                    <p className="mb-0">Para esse presente é possível: </p>
                    {meiosPagamento.map((m, i) => (
                      <div key={i} className="present-card__payment-item">
                        • {m}
                      </div>
                    ))}
                  </div>
                  
                  <Badge
                    className={`border ${
                      p.reservado ? "border-danger" : "border-success"
                    }`}
                  >
                    {p.reservado ? "Já escolhido" : "Disponível"}
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

export default App;