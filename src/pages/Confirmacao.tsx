import { FaSmileBeam } from "react-icons/fa";
import { Container } from "reactstrap";

export default function Confirmacao() {

  return (
    <Container className="d-flex justify-content-center align-items-center h-100 my-auto">
      <h1>
        Em construção 
        <FaSmileBeam
          style={{marginLeft: 15 , color: '#CD67FF'}}
        />
      </h1>
    </Container>
  );
}