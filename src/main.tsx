import ReactDOM from "react-dom/client";
import App from "./App";
import PresenteDetalhe from "./pages/PresenteDetalhe";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ImportPresentes from "./helpers/ImportPresentes";
import MainLayout from "./layouts/MainLayout";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<App />} />
        <Route path="/presente/:id" element={<PresenteDetalhe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/import-presentes" element={<ImportPresentes />} />
      </Route>
    </Routes>
  </BrowserRouter>
);