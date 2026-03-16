import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  function handleAdminClick() {
    setIsOpen(false);
    if (!user) {
      navigate("/login");
    } else if (isAdmin) {
      navigate("/admin");
    }
  }

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavigate(path: string) {
    navigate(path);
    setIsOpen(false); // fecha o menu
  }

  return (
    <Navbar
      expand="md"
      fixed="top"
      light
      className={`header shadow-sm ${scrolled ? "header--scrolled" : ""}`}
    >
      <Container className="d-md-flex">
        {/* Logo */}
        <NavbarBrand
          style={{ cursor: "pointer" }}
          onClick={() => handleNavigate("/")}
        >
          <img className="logo" src={logo} alt="Logo do casal" />
        </NavbarBrand>

        <Collapse isOpen={isOpen} navbar>
          <Nav className="mx-auto" navbar>
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                onClick={() => handleNavigate("/")}
              >
                Início
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                onClick={() => handleNavigate("/lista")}
              >
                Lista de Presentes
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
               onClick={() => handleNavigate("/confirmacao")}
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
        <NavbarToggler onClick={toggle} className="ms-auto" />
      </Container>
    </Navbar>
  );
}