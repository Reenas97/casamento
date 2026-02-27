import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {Container, Row, Col, Card, CardBody, CardTitle, Badge, PaginationItem, Pagination, PaginationLink } from "reactstrap";
import bannerPhoto from "../src/assets/photo_banner2.jpg";
import FlipClockCountdown from "@leenguyen/react-flip-clock-countdown";
import "@leenguyen/react-flip-clock-countdown/dist/index.css";

type Presente = {
  id: string;
  nome: string;
  preco: number;
  reservado: boolean;
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

      <div className="d-flex p-5 align-items-center justify-content-center">
         <FlipClockCountdown
          to={new Date("2026-08-30T12:30:00")}
          labels={["Dias", "Horas", "Minutos", "Segundos"]}
          className="flip-custom"
        />
      </div>

      <h1>Lista de Casamento 💍</h1>
      <Row>
        {presentesPaginados.map((p) => (
          <Col key={p.id} xs="12" md="6" lg="4" className="mb-3">
            <Card
              className="h-100 present-card shadow-sm"
              style={{ cursor: "pointer", opacity: p.reservado ? 0.5 : 1 }}
              onClick={() => navigate(`/presente/${p.id}`)}
            >
              <CardBody>
                <CardTitle tag="h5">{p.nome}</CardTitle>

                <p className="fw-bold mb-2">R$ {p.preco}</p>

                <Badge color={p.reservado ? "danger" : "success"}>
                  {p.reservado ? "❌ Já escolhido" : "✅ Disponível"}
                </Badge>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
      {totalPaginas > 1 && (
        <Pagination className="d-flex justify-content-center mt-4">
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
      <p className="text-sm-center">Total de presentes: {presentes.length}</p>
    </Container>
  );
}

export default App;