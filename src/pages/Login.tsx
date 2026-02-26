import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

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
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h1>🔐 Login dos Noivos</h1>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {erro && (
          <p style={{ color: "red", fontSize: 14 }}>
            {erro}
          </p>
        )}
      </form>
    </div>
  );
}