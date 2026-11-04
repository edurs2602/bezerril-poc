import { useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { Carimbo, Cnj, DiasUteis, Titulo } from "../components/ui";
import { ehHoje } from "../domain/dates";
import { FASES, type Fase } from "../domain/types";
import { nomeUsuario, useStore, useUsuario } from "../store/store";
import { proximoPrazo } from "./Processos";

const POR_COLUNA = 25;

export function Quadro() {
  const { estado, processosVisiveis, moverFase } = useStore();
  const usuario = useUsuario();
  const [responsavel, setResponsavel] = useState<string>(usuario.papel === "admin" ? "" : usuario.id);
  const [sobre, setSobre] = useState<Fase | null>(null);
  const [expandidas, setExpandidas] = useState<Set<Fase>>(new Set());

  const filtrados = useMemo(
    () => (responsavel ? processosVisiveis.filter((p) => p.responsavelId === responsavel) : processosVisiveis),
    [processosVisiveis, responsavel],
  );

  function soltar(e: DragEvent, fase: Fase) {
    e.preventDefault();
    setSobre(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) moverFase(id, fase);
  }

  return (
    <div>
      <Titulo
        nota="A consulta coloca cada processo na coluna do seu andamento. Um ajuste à mão vale até o próximo andamento capturado (RN09)."
        acao={
          <select aria-label="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            <option value="">Todo o escritório</option>
            {estado.usuarios.filter((u) => u.ativo).map((u) => (
              <option key={u.id} value={u.id}>{u.id === usuario.id ? `Meus (${u.nome})` : u.nome}</option>
            ))}
          </select>
        }
      >
        Quadro por fase
      </Titulo>

      <div className="quadro">
        {FASES.map((fase) => {
          const coluna = filtrados
            .filter((p) => p.fase === fase)
            .sort((a, b) => {
              const hoje = Number(b.andamentos.some((x) => ehHoje(x.data))) - Number(a.andamentos.some((x) => ehHoje(x.data)));
              return hoje || (proximoPrazo(a)?.vencimento ?? "9999").localeCompare(proximoPrazo(b)?.vencimento ?? "9999");
            });
          const aberta = expandidas.has(fase);
          const visiveis = aberta ? coluna : coluna.slice(0, POR_COLUNA);
          return (
            <section
              key={fase}
              className={sobre === fase ? "coluna sobre" : "coluna"}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(fase);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobre(null);
              }}
              onDrop={(e) => soltar(e, fase)}
            >
              <header>
                <h2>{fase}</h2>
                <span className="num">{coluna.length}</span>
              </header>
              {visiveis.map((p) => {
                const z = proximoPrazo(p);
                const novo = p.andamentos.some((x) => ehHoje(x.data));
                return (
                  <article
                    key={p.id}
                    className="ficha"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                  >
                    <div className="ficha-topo">{z && <DiasUteis vencimento={z.vencimento} />}</div>
                    <Link to={`/processos/${p.id}`} className="ficha-cnj" draggable={false}><Cnj p={p} curto /></Link>
                    <p className="ficha-autor">{p.autor}</p>
                    <p className="ficha-meta">
                      <span>{p.assunto}</span> <span>{p.sistema}</span>
                    </p>
                    <p className="ficha-meta">{nomeUsuario(estado, p.responsavelId)}</p>
                    <div className="ficha-rodape">
                      {novo && <span className="marca-novo">Andou hoje</span>}
                      {p.faseManual && <Carimbo tom="alerta">À mão</Carimbo>}
                      {p.segredo && <Carimbo tom="neutro">Segredo</Carimbo>}
                    </div>
                    <select
                      className="ficha-mover"
                      aria-label={`Mover ${p.cnj}`}
                      value={p.fase}
                      onChange={(e) => moverFase(p.id, e.target.value as Fase)}
                    >
                      {FASES.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </article>
                );
              })}
              {coluna.length > POR_COLUNA && !aberta && (
                <button
                  type="button"
                  className="link coluna-mais"
                  onClick={() => setExpandidas((s) => new Set(s).add(fase))}
                >
                  Mais {coluna.length - POR_COLUNA}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
