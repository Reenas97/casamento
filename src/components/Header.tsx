import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Collapse,
  Nav,
  NavItem,
  NavLink,
  Button,
  Container,
} from "reactstrap";
import { useAuthAdmin } from "../hooks/useAuth";
import logo from "../assets/logo_white.svg";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const navigate = useNavigate();
  const { user, isAdmin } = useAuthAdmin();

  function handleAdminClick() {
    if (!user) {
      navigate("/login");
    } else if (isAdmin) {
      navigate("/admin");
    }
  }

  return (
    <Navbar expand="md" fixed="top" light className="header shadow-sm">
      <Container className="d-flex">
        {/* Logo */}
        <NavbarBrand
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <img className="logo" src={logo} alt="Logo do casal" />
        </NavbarBrand>

        <NavbarToggler onClick={toggle} />

        <Collapse isOpen={isOpen} navbar>
          <Nav className="mx-auto" navbar>
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/")}
              >
                Início
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/lista")}
              >
                Lista de Presentes
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/confirmacao")}
              >
                Confirmação de Presença
              </NavLink>
            </NavItem>
          </Nav>

          {/* Botão Admin */}
          <Button
            className="btn--white"
            onClick={handleAdminClick}
            disabled={!!user && !isAdmin}
          >
            {!user ? "Login" : isAdmin ? "Admin" : "Acesso restrito"}
          </Button>
        </Collapse>
      </Container>
    </Navbar>
  );
}