import {Col, Container, Row} from "reactstrap";
import bannerPhoto from "../src/assets/photo_banner2.jpg";
import nossaFoto from "../src/assets/nossa-foto.jpg";
import FlipClockCountdown from "@leenguyen/react-flip-clock-countdown";
import "@leenguyen/react-flip-clock-countdown/dist/index.css";

function App() {
  return (
      <Container>
      <div
        className="photo-banner"
        style={{ backgroundImage: `url(${bannerPhoto})` }}
      >
        <h1 className="banner-title">Renata & Pedro</h1>
        <p className="banner-text">30/08/2026</p>
      </div>

      <div className="d-flex flex-column pt-5 pb-4 align-items-center justify-content-center">
          <h2 className="mb-4">Contagem Regressiva: </h2>
         <FlipClockCountdown
          to={new Date("2026-08-30T12:30:00")}
          labels={["Dias", "Horas", "Minutos", "Segundos"]}
          className="flip-custom"
        />
      </div>

      <Row>
        <Col md="8" className="bg--blue p-3">

          <img src={nossaFoto} alt="Foto do casal" className="foto-casal"/>

        </Col>
        <Col md="4" className="bg--blue text-white p-3 d-flex align-items-center">
          <p>
            Oii!
            <br /><br />
            Ficaremos muito felizes em ter você presente no nosso grande dia e mal podemos esperar para compartilhar esse momento tão especial ao seu lado!
            <br /><br />
            Aqui no nosso site você encontrará nossa lista de presentes, dicas e informações sobre o local do casamento, além de um espaço para confirmar sua presença.
            <br /><br />
            Sua presença tornará esse dia ainda mais especial para nós!
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default App;