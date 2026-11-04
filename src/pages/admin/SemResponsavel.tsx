import { useState } from "react";
import { Link } from "react-router-dom";
import { Carimbo, Cnj, Titulo, Vazio } from "../../components/ui";
import { nomeUsuario, useStore } from "../../store/store";

export function SemResponsavel() {
  const { estado, reatribuir, avisar } = useStore();
  const fila = estado.processos.filter((p) => p.responsavelId === null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [destino, setDestino] = useState("ana");

  const vigentes = fila.filter((p) => marcados.has(p.id));
  const todos = fila.length > 0 && vigentes.length === fila.length;

  function alternar(id: string) {
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function redistribuir() {
    reatribuir(vigentes.map((p) => p.id), destino);
    avisar(`${vigentes.length} processos atribuídos a ${nomeUsuario(estado, destino)}.`);
    setMarcados(new Set());
  }

  return (
    <div>
      <Titulo nota="Quando um usuário é desativado, os processos dele ficam aqui até serem redistribuídos (RN07). Enquanto isso, os avisos vêm para o administrador (RN06).">
        Processos sem responsável
      </Titulo>
      {fila.length === 0 ? (
        <Vazio>A fila está vazia: todo processo tem responsável.</Vazio>
      ) : (
        <>
          <div className="filtros barra-acao">
            <span className="nota">{vigentes.length} de {fila.length} selecionados</span>
            <div className="barra-acao-destino">
            <label className="filtro-rotulo">
              Atribuir a
              <select value={destino} onChange={(e) => setDestino(e.target.value)}>
                {estado.usuarios.filter((u) => u.ativo).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </label>
            <button type="button" className="botao botao-pequeno" disabled={!vigentes.length} onClick={redistribuir}>
              Redistribuir
            </button>
            </div>
          </div>
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col" className="col-marca">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={todos}
                    onChange={() => setMarcados(todos ? new Set() : new Set(fila.map((p) => p.id)))}
                  />
                </th>
                <th scope="col">Processo</th>
                <th scope="col">Autor</th>
                <th scope="col">Fase</th>
                <th scope="col">Sistema</th>
                <th scope="col">Último responsável</th>
              </tr>
            </thead>
            <tbody>
              {fila.map((p) => {
                const ultimo = estado.historico.find((h) => h.processoId === p.id && h.campo === "Responsável" && h.novo === "Sem responsável");
                return (
                  <tr key={p.id} className={marcados.has(p.id) ? "marcada" : undefined}>
                    <td className="col-marca">
                      <input type="checkbox" aria-label={`Selecionar ${p.cnj}`} checked={marcados.has(p.id)} onChange={() => alternar(p.id)} />
                    </td>
                    <td data-rotulo="Processo">
                      <Link to={`/processos/${p.id}`}><Cnj p={p} /></Link>
                      {p.segredo && <small><Carimbo tom="neutro">Segredo</Carimbo></small>}
                    </td>
                    <td data-rotulo="Autor">{p.autor}</td>
                    <td data-rotulo="Fase">{p.fase}</td>
                    <td data-rotulo="Sistema">{p.sistema} · {p.tribunal}</td>
                    <td data-rotulo="Último responsável">{ultimo?.anterior ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
