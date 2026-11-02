import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  CloudOff,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  SquareKanban,
  Upload,
  UserRoundX,
  Users,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { alertasDe } from "../domain/alertas";
import { dataPorExtenso, HOJE } from "../domain/dates";
import { ehAdmin, podeTerAcessos } from "../domain/permissoes";
import { PAPEL_LABEL } from "../domain/types";
import { useStore, useUsuario } from "../store/store";

export function useAlertas() {
  const { estado, processosVisiveis } = useStore();
  const usuario = useUsuario();
  return useMemo(() => {
    const nomes = Object.fromEntries(estado.usuarios.map((u) => [u.id, u.nome]));
    return alertasDe(usuario, processosVisiveis, estado.acessos, nomes);
  }, [estado.acessos, estado.usuarios, processosVisiveis, usuario]);
}

function iniciais(nome: string): string {
  const partes = nome.split(" ");
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function Shell() {
  const { estado, entrar, sair, resetar, simularConsulta, aviso } = useStore();
  const usuario = useUsuario();
  const alertas = useAlertas();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const naoLidos = alertas.filter((a) => !estado.alertasLidos.includes(a.id)).length;
  const falhas = estado.processos.filter((p) => p.captura.status === "pendente").length;
  const semResponsavel = estado.processos.filter((p) => !p.responsavelId).length;

  const fechar = () => setMenuAberto(false);

  function Item({ para, icone, children, contagem, fim }: { para: string; icone: ReactNode; children: ReactNode; contagem?: number; fim?: boolean }) {
    return (
      <NavLink to={para} end={fim} onClick={fechar}>
        {icone}
        <span>{children}</span>
        {!!contagem && <b className="contagem">{contagem}</b>}
      </NavLink>
    );
  }

  return (
    <div className="app">
      <aside className={menuAberto ? "lateral aberta" : "lateral"}>
        <Link to="/" className="marca" onClick={fechar}>
          <span className="logo" aria-hidden>B</span>
          <span className="marca-texto">
            Bezerril Advocacia
            <small>Acompanhamento processual</small>
          </span>
        </Link>
        <nav className="nav" aria-label="Principal">
          <Item para="/" fim icone={<LayoutDashboard size={18} aria-hidden />}>Painel</Item>
          <Item para="/processos" icone={<FolderOpen size={18} aria-hidden />}>Processos</Item>
          <Item para="/quadro" icone={<SquareKanban size={18} aria-hidden />}>Quadro</Item>
          <Item para="/alertas" icone={<Bell size={18} aria-hidden />} contagem={naoLidos}>Avisos</Item>
          {podeTerAcessos(usuario) && (
            <Item para="/acessos" icone={<KeyRound size={18} aria-hidden />}>Acessos aos tribunais</Item>
          )}
          {ehAdmin(usuario) && (
            <>
              <p className="nav-grupo">Administração</p>
              <Item para="/admin/falhas" icone={<CloudOff size={18} aria-hidden />} contagem={falhas}>Falhas de captura</Item>
              <Item para="/admin/sem-responsavel" icone={<UserRoundX size={18} aria-hidden />} contagem={semResponsavel}>Sem responsável</Item>
              <Item para="/admin/usuarios" icone={<Users size={18} aria-hidden />}>Usuários</Item>
              <Item para="/admin/historico" icone={<History size={18} aria-hidden />}>Histórico</Item>
              <Item para="/admin/importar" icone={<Upload size={18} aria-hidden />}>Importar planilha</Item>
            </>
          )}
        </nav>
      </aside>
      {menuAberto && <div className="lateral-fundo" onClick={fechar} aria-hidden />}

      <div className="principal">
        <header className="topo">
          <button type="button" className="menu-botao" aria-label="Abrir menu" aria-expanded={menuAberto} onClick={() => setMenuAberto((v) => !v)}>
            <Menu size={20} aria-hidden />
          </button>
          <span className="topo-data">{dataPorExtenso(HOJE)}</span>
          <div className="topo-direita">
            <Link to="/alertas" className="topo-icone" aria-label={`Avisos: ${naoLidos} não lidos`}>
              <Bell size={18} aria-hidden />
              {naoLidos > 0 && <b className="contagem">{naoLidos}</b>}
            </Link>
            <span className="avatar" aria-hidden>{iniciais(usuario.nome)}</span>
            <span className="topo-usuario">
              {usuario.nome}
              <small>{PAPEL_LABEL[usuario.papel]}</small>
            </span>
            <button type="button" className="topo-icone" aria-label="Sair" title="Sair" onClick={sair}>
              <LogOut size={18} aria-hidden />
            </button>
          </div>
        </header>

        <main className="conteudo">
          <Outlet />
        </main>

        <footer className="barra-demo">
          <span className="barra-demo-tag">Protótipo · dados fictícios</span>
          <label>
            Ver como
            <select
              value={usuario.id}
              onChange={(e) => {
                entrar(e.target.value);
                navigate("/");
              }}
            >
              {estado.usuarios.filter((u) => u.ativo).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({PAPEL_LABEL[u.papel]})
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="link" onClick={simularConsulta}>
            Simular nova consulta
          </button>
          <button type="button" className="link" onClick={resetar}>
            Restaurar demo
          </button>
        </footer>
      </div>

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
