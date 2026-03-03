import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {Container, Row, Col, Card, CardBody, Badge, PaginationItem, Pagination, PaginationLink, CardImg } from "reactstrap";
import bannerPhoto from "../src/assets/photo_banner2.jpg";
import FlipClockCountdown from "@leenguyen/react-flip-clock-countdown";
import "@leenguyen/react-flip-clock-countdown/dist/index.css";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  reservado: boolean;
  imagem?: string;
};

function App() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const navigate = useNavigate();
  const itensPorPagina = 12;
  const [paginaAtual, setPaginaAtual] = useState(1);

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




  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;

  const presentesPaginados = presentes.slice(indexPrimeiro, indexUltimo);

  const totalPaginas = Math.ceil(presentes.length / itensPorPagina);



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
        {presentesPaginados.map((p) => (
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
                <div className="present-card__title">
                  {p.nome}
                </div>
              </div>
              <CardBody>
                <p className="fw-bold mb-2">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(p.preco)}
                </p>              
                <Badge
                  className={`border ${
                    p.reservado
                      ? "border-danger"
                      : "border-success"
                  }`}
                >
                  {p.reservado ? "Já escolhido" : "Disponível"}
                </Badge>
              </CardBody>
            </Card>
          </Col>
        ))}
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