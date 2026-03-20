import ReactDOM from "react-dom/client";
import App from "./App";
import PresenteDetalhe from "./pages/PresenteDetalhe";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Confirmacao from "./pages/Confirmacao";
import ImportPresentes from "./helpers/ImportPresentes";
import MainLayout from "./layouts/MainLayout";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.scss";
import 'swiper/css';
import 'swiper/css/pagination';
import "swiper/css/navigation";
import ListaPresentes from "./pages/ListaPresentes";
import Dicas from "./pages/Dicas";
import ImportConvidados from "./helpers/ImportConvidados";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<App />} />
        <Route path="/presente/:id" element={<PresenteDetalhe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
        <Route path="/lista" element={<ListaPresentes />} />
        <Route path = "/dicas" element = {<Dicas />} />
        <Route path="/import-presentes" element={<ImportPresentes />} />
        <Route path="/import-convidados" element={<ImportConvidados />} />
      </Route>
    </Routes>
  </BrowserRouter>
);