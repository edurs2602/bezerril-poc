import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Campo, Carimbo, Cnj, DiasUteis, Modal, Titulo, Vazio } from "../components/ui";
import { TRIBUNAIS } from "../data/seed";
import { montarCnj } from "../domain/cnj";
import { diasUteisAte, ehHoje } from "../domain/dates";
import { FASES, SISTEMAS, type Processo } from "../domain/types";
import { nomeUsuario, useStore, useUsuario, validarNovoCnj } from "../store/store";

const POR_PAGINA = 40;

export function proximoPrazo(p: Processo) {
  return p.prazos.filter((z) => !z.concluido).sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];
}

export function Processos() {
  const { estado, processosVisiveis } = useStore();
  const usuario = useUsuario();
  const [params, setParams] = useSearchParams();
  const [limite, setLimite] = useState(POR_PAGINA);
  const [novo, setNovo] = useState(false);

  const busca = params.get("q") ?? "";
  const responsavel = params.get("resp") ?? "";
  const sistema = params.get("sis") ?? "";
  const tribunal = params.get("trib") ?? "";
  const fase = params.get("fase") ?? "";
  const prazo = params.get("prazo") ?? "";

  function filtrar(chave: string, valor: string) {
    setLimite(POR_PAGINA);
    setParams(
      (atual) => {
        const n = new URLSearchParams(atual);
        if (valor) n.set(chave, valor);
        else n.delete(chave);
        return n;
      },
      { replace: true },
    );
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const digitos = q.replace(/\D/g, "");
    return processosVisiveis
      .filter((p) => {
        if (responsavel === "sem" ? p.responsavelId !== null : responsavel && p.responsavelId !== responsavel) return false;
        if (sistema && p.sistema !== sistema) return false;
        if (tribunal && p.tribunal !== tribunal) return false;
        if (fase && p.fase !== fase) return false;
        if (prazo) {
          const z = proximoPrazo(p);
          if (!z || diasUteisAte(z.vencimento) > Number(prazo)) return false;
        }
        if (q) {
          const noNumero = digitos.length > 0 && p.cnj.replace(/\D/g, "").includes(digitos);
          const noTexto = `${p.autor} ${p.reu} ${p.assunto}`.toLowerCase().includes(q);
          if (!noNumero && !noTexto) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const za = proximoPrazo(a)?.vencimento ?? "9999";
        const zb = proximoPrazo(b)?.vencimento ?? "9999";
        return za.localeCompare(zb) || (b.andamentos[0]?.data ?? "").localeCompare(a.andamentos[0]?.data ?? "");
      });
  }, [processosVisiveis, busca, responsavel, sistema, tribunal, fase, prazo]);

  const temFiltro = params.size > 0;

  return (
    <div>
      <Titulo
        nota={`${filtrados.length} de ${processosVisiveis.length} processos visíveis para ${usuario.nome.split(" ")[0]}`}
        acao={
          <button type="button" className="botao" onClick={() => setNovo(true)}>
            Cadastrar processo
          </button>
        }
      >
        Processos
      </Titulo>

      <div className="filtros" role="search">
        <input
          className="filtro-busca"
          type="search"
          placeholder="Número CNJ, parte ou assunto"
          aria-label="Buscar processo"
          value={busca}
          onChange={(e) => filtrar("q", e.target.value)}
        />
        <select aria-label="Responsável" value={responsavel} onChange={(e) => filtrar("resp", e.target.value)}>
          <option value="">Responsável</option>
          <option value={usuario.id}>Só os meus</option>
          {estado.usuarios.filter((u) => u.ativo && u.id !== usuario.id).map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
          <option value="sem">Sem responsável</option>
        </select>
        <select aria-label="Sistema" value={sistema} onChange={(e) => filtrar("sis", e.target.value)}>
          <option value="">Sistema</option>
          {SISTEMAS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select aria-label="Tribunal" value={tribunal} onChange={(e) => filtrar("trib", e.target.value)}>
          <option value="">Tribunal</option>
          {TRIBUNAIS.map((t) => <option key={t.sigla}>{t.sigla}</option>)}
        </select>
        <select aria-label="Fase" value={fase} onChange={(e) => filtrar("fase", e.target.value)}>
          <option value="">Fase</option>
          {FASES.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select aria-label="Prazo" value={prazo} onChange={(e) => filtrar("prazo", e.target.value)}>
          <option value="">Prazo</option>
          <option value="1">Até 1 dia útil</option>
          <option value="3">Até 3 dias úteis</option>
          <option value="5">Até 5 dias úteis</option>
          <option value="15">Até 15 dias úteis</option>
        </select>
        {temFiltro && (
          <button type="button" className="link" onClick={() => setParams({}, { replace: true })}>
            Limpar
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <Vazio>Nenhum processo com esses filtros.</Vazio>
      ) : (
        <table className="tabela tabela-processos">
          <thead>
            <tr>
              <th scope="col">Prazo</th>
              <th scope="col">Processo</th>
              <th scope="col">Partes</th>
              <th scope="col">Fase</th>
              <th scope="col">Sistema</th>
              <th scope="col">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, limite).map((p) => {
              const z = proximoPrazo(p);
              const mudouHoje = p.andamentos.some((a) => ehHoje(a.data));
              return (
                <tr key={p.id}>
                  <td data-rotulo="Prazo">{z ? <DiasUteis vencimento={z.vencimento} /> : <span className="fraco">—</span>}</td>
                  <td data-rotulo="Processo">
                    <Link to={`/processos/${p.id}`}><Cnj p={p} /></Link>
                    <small>
                      {p.assunto} {mudouHoje && <span className="marca-novo">Andou hoje</span>}
                    </small>
                  </td>
                  <td data-rotulo="Partes">
                    {p.autor}
                    <small>{p.reu}</small>
                  </td>
                  <td data-rotulo="Fase">
                    {p.fase}
                    {p.segredo && <small><Carimbo tom="neutro">Segredo</Carimbo></small>}
                  </td>
                  <td data-rotulo="Sistema">
                    {p.sistema}
                    <small>
                      {p.tribunal}
                      {p.captura.status === "pendente" && " · consulta pendente"}
                    </small>
                  </td>
                  <td data-rotulo="Responsável" className={p.responsavelId ? "" : "fraco"}>
                    {nomeUsuario(estado, p.responsavelId)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {filtrados.length > limite && (
        <p className="mais">
          <button type="button" className="link" onClick={() => setLimite((n) => n + POR_PAGINA)}>
            Mostrar mais {Math.min(POR_PAGINA, filtrados.length - limite)} de {filtrados.length - limite} restantes
          </button>
        </p>
      )}

      {novo && <NovoProcesso onFechar={() => setNovo(false)} />}
    </div>
  );
}

function NovoProcesso({ onFechar }: { onFechar: () => void }) {
  const { estado, cadastrarProcesso } = useStore();
  const usuario = useUsuario();
  const navigate = useNavigate();
  const [cnj, setCnj] = useState("");
  const [tribunal, setTribunal] = useState("TJSC");
  const [autor, setAutor] = useState("");
  const [reu, setReu] = useState("");
  const [assunto, setAssunto] = useState("Atraso de voo");
  const [responsavelId, setResponsavelId] = useState(usuario.id);
  const [segredo, setSegredo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const t = TRIBUNAIS.find((x) => x.sigla === tribunal)!;

  function salvar(e: FormEvent) {
    e.preventDefault();
    const problema = validarNovoCnj(estado, cnj);
    if (problema) return setErro(problema);
    const id = cadastrarProcesso({ cnj, tribunal, vara: "", autor, reu, assunto, responsavelId, segredo });
    navigate(`/processos/${id}`);
  }

  function exemplo() {
    setCnj(montarCnj(1000000 + Math.floor(Math.random() * 8000000), 2026, t.tr, t.orgao));
    setErro(null);
  }

  return (
    <Modal titulo="Cadastrar processo" onFechar={onFechar}>
      <form onSubmit={salvar} className="form-grade">
        <Campo rotulo="Número CNJ" erro={erro} ajuda="O número é validado e não pode repetir (RN14).">
          <input
            className="mono"
            required
            value={cnj}
            placeholder="0000000-00.0000.0.00.0000"
            onChange={(e) => {
              setCnj(e.target.value);
              setErro(null);
            }}
          />
        </Campo>
        <p className="form-dica">
          <button type="button" className="link" onClick={exemplo}>Gerar um número válido para a demo</button>
        </p>
        <Campo rotulo="Tribunal">
          <select value={tribunal} onChange={(e) => setTribunal(e.target.value)}>
            {TRIBUNAIS.map((x) => <option key={x.sigla} value={x.sigla}>{x.sigla} ({x.sistema})</option>)}
          </select>
        </Campo>
        <Campo rotulo="Responsável">
          <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
            {estado.usuarios.filter((u) => u.ativo).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Autor">
          <input required value={autor} onChange={(e) => setAutor(e.target.value)} />
        </Campo>
        <Campo rotulo="Réu">
          <input required value={reu} onChange={(e) => setReu(e.target.value)} />
        </Campo>
        <Campo rotulo="Assunto">
          <select value={assunto} onChange={(e) => setAssunto(e.target.value)}>
            {["Atraso de voo", "Cancelamento de voo", "Preterição de embarque", "Extravio de bagagem", "Perda de conexão"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Campo>
        <label className="campo-check">
          <input type="checkbox" checked={segredo} onChange={(e) => setSegredo(e.target.checked)} />
          Segredo de justiça
        </label>
        <div className="form-acoes span-2">
          <button className="botao" type="submit">Cadastrar</button>
          <span className="nota">Na primeira consulta, o sistema baixa o processo completo (RN13).</span>
        </div>
      </form>
    </Modal>
  );
}
