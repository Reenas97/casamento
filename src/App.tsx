import {Container} from "reactstrap";
import bannerPhoto from "../src/assets/photo_banner2.jpg";
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
    </Container>
  );
}

export default App;