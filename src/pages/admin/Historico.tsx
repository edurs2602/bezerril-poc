import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Titulo, Vazio } from "../../components/ui";
import { dataHora } from "../../domain/dates";
import { nomeUsuario, useStore } from "../../store/store";

const LIMITE = 60;

export function Historico() {
  const { estado } = useStore();
  const [quem, setQuem] = useState("");
  const [busca, setBusca] = useState("");

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return [...estado.historico]
      .sort((a, b) => b.em.localeCompare(a.em))
      .filter((h) => !quem || h.usuarioId === quem)
      .filter((h) => !q || `${h.processoCnj ?? ""} ${h.campo} ${h.novo} ${h.anterior}`.toLowerCase().includes(q));
  }, [estado.historico, quem, busca]);

  return (
    <div>
      <Titulo nota="Registro permanente. Nenhum perfil edita ou apaga estas linhas (RN10).">
        Histórico de alterações
      </Titulo>
      <div className="filtros">
        <input className="filtro-busca" type="search" placeholder="Número, campo ou valor" aria-label="Buscar no histórico" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select aria-label="Autor" value={quem} onChange={(e) => setQuem(e.target.value)}>
          <option value="">Qualquer autor</option>
          <option value="sistema">Sistema</option>
          {estado.usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        <span className="nota">{linhas.length} registros</span>
      </div>
      {linhas.length === 0 ? (
        <Vazio>Nenhum registro com esses filtros.</Vazio>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Quem</th>
              <th scope="col">O quê</th>
              <th scope="col">Processo</th>
              <th scope="col">Antes</th>
              <th scope="col">Depois</th>
            </tr>
          </thead>
          <tbody>
            {linhas.slice(0, LIMITE).map((h) => (
              <tr key={h.id}>
                <td data-rotulo="Quando" className="mono-pequeno">{dataHora(h.em)}</td>
                <td data-rotulo="Quem">{nomeUsuario(estado, h.usuarioId)}</td>
                <td data-rotulo="O quê">{h.campo}</td>
                <td data-rotulo="Processo">
                  {h.processoId ? <Link className="cnj" to={`/processos/${h.processoId}`}>{h.processoCnj}</Link> : <span className="fraco">—</span>}
                </td>
                <td data-rotulo="Antes" className="fraco">{h.anterior || "—"}</td>
                <td data-rotulo="Depois">{h.novo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
