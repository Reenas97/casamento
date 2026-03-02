import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardTitle, FormGroup, Input, Label, Form, Container } from "reactstrap";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);

      // 🔥 login ok → vai pro admin
      navigate("/admin");
    } catch (err: any) {
      console.error(err);

      if (err.code === "auth/invalid-credential") {
        setErro("Email ou senha inválidos");
      } else {
        setErro("Erro ao fazer login");
      }
    }

    setLoading(false);
  }

  return (
    <Container className="d-flex justify-content-center align-items-center h-100 my-auto">
      <Card className="p-4 text-white login-card">
        <CardBody>
          <CardTitle tag="h1">
            Login dos Noivos
          </CardTitle>

          <Form onSubmit={handleLogin} className="mt-4">
            <FormGroup>
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent"
              />
            </FormGroup>

            <FormGroup>
              <Label for="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="bg-transparent"
              />
            </FormGroup>

            <Button  type="submit" className="btn--purple mx-auto d-block" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            {erro && (
              <p className="text-danger mt-2 text-center" style={{ fontSize: 14 }}>
                {erro}
              </p>
            )}
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}