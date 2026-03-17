import { useState } from "react";
import {
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Container,
  Button,
  InputGroup,
  Input,
  Label
} from "reactstrap";
import classnames from "classnames";

import { FaMapMarkerAlt, FaLandmark, FaTshirt, FaGoogle, FaWaze, FaRegMeh } from "react-icons/fa";
import { PiSmileyMeh } from "react-icons/pi";

export default function Dicas() {
  const [activeTab, setActiveTab] = useState("1");

  const toggle = (tab: string) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const [origem, setOrigem] = useState("");

  const destino = "Recanto Premier";

  const abrirGoogleMaps = () => {
    if (!origem) return;

    const url = `https://www.google.com/maps/dir/${encodeURIComponent(
      origem
    )}/${encodeURIComponent(destino)}`;

    window.open(url, "_blank");
  };

  const abrirWaze = () => {
    const url = `https://www.waze.com/ul?q=${encodeURIComponent(destino)}`;

    window.open(url, "_blank");
  };

  return (
    <Container className="dicas-page my-5">

      <h2 className="text-center mb-4">Dicas</h2>

      <Nav tabs className="justify-content-center dicas-tabs">

        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === "1" })}
            onClick={() => toggle("1")}
          >
            <FaMapMarkerAlt className="me-2" />
            Como chegar
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === "2" })}
            onClick={() => toggle("2")}
          >
            <FaLandmark className="me-2" />
            Sobre o local
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === "3" })}
            onClick={() => toggle("3")}
          >
            <FaTshirt className="me-2" />
            Dresscode
          </NavLink>
        </NavItem>

      </Nav>

      <TabContent activeTab={activeTab} className="mt-4">

        <TabPane tabId="1">

          <h4 className="mb-3">Como chegar</h4>

          <p>
            O casamento será realizado no Recanto Premier, em Gararema - SP.
          </p>

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3662.608278226284!2d-46.13848042391994!3d-23.36620225445285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cdd4831737450b%3A0xd10c44432a13629f!2sRecanto%20Premier!5e0!3m2!1spt-BR!2sbr!4v1773711343917!5m2!1spt-BR!2sbr"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: "10px" }}
            loading="lazy"
          />


        <InputGroup className="my-4">
            <Label>
                Digite seu endereço para traçar a melhor rota:
            </Label>
            <Input
            className="w-100"
                placeholder="Digite seu endereço ou bairro"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
            />
        </InputGroup>

      <div className="d-flex gap-3 flex-wrap">

        <Button className="btn btn--purple" onClick={abrirGoogleMaps}>
          <FaGoogle className="me-2" />
          Ver rota no Google Maps
        </Button>

        <Button className="btn btn--white" onClick={abrirWaze}>
          <FaWaze className="me-2" />
          Abrir no Waze
        </Button>

      </div>


        </TabPane>

        <TabPane tabId="2">

          <h4>Sobre o local</h4>

          <p>
            O Recanto possui uma área arborizada, estacionamento
            próprio e estrutura completa.
          </p>

          <p>
            Recomendamos chegar com antecedência para aproveitar o local
            com tranquilidade.
          </p>

          <p>
            Segundo as regras do local, não é permitido: <b>fumar nas áreas internas do local</b>, <b>utilizar a piscina</b> e <b>nadar, pescar ou jogar objetos no lago</b>. Por favor, pedimos que respeite essas regras para que não tenhamos que pagar nenhuma taxa adicional <FaRegMeh />.
          </p>
          <p>
            Tanto a cerimônia quanto a festa serão realizados no mesmo local.
          </p>

        </TabPane>

        <TabPane tabId="3">

          <h4>Dresscode</h4>

          <p>
            O traje sugerido é <strong>Esporte Fino</strong>, mas queremos que se sinta a vontade para se vestir como se sentir confortável.
          </p>

          <p>
            Talvez utilizar saltos muito finos não seja uma boa ideia, pois o caminho até a cerimônia é de grama e descida.
          </p>

          <p>
            Evite cores muito claras ou branco, para não competir comigo (a noiva). <PiSmileyMeh />
          </p>

        </TabPane>

      </TabContent>
    </Container>
  );
}