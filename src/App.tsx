import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Acessos } from "./pages/Acessos";
import { Alertas } from "./pages/Alertas";
import { Login } from "./pages/Login";
import { Painel } from "./pages/Painel";
import { ProcessoDetalhe } from "./pages/ProcessoDetalhe";
import { Processos } from "./pages/Processos";
import { Quadro } from "./pages/Quadro";
import { Falhas } from "./pages/admin/Falhas";
import { Historico } from "./pages/admin/Historico";
import { Importar } from "./pages/admin/Importar";
import { SemResponsavel } from "./pages/admin/SemResponsavel";
import { Usuarios } from "./pages/admin/Usuarios";
import { useStore } from "./store/store";

export function App() {
  const { usuario } = useStore();
  if (!usuario) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  const admin = usuario.papel === "admin";
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Painel />} />
        <Route path="processos" element={<Processos />} />
        <Route path="processos/:id" element={<ProcessoDetalhe />} />
        <Route path="quadro" element={<Quadro />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="acessos" element={<Acessos />} />
        {admin && (
          <>
            <Route path="admin" element={<Navigate to="/admin/falhas" replace />} />
            <Route path="admin/falhas" element={<Falhas />} />
            <Route path="admin/sem-responsavel" element={<SemResponsavel />} />
            <Route path="admin/usuarios" element={<Usuarios />} />
            <Route path="admin/historico" element={<Historico />} />
            <Route path="admin/importar" element={<Importar />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
