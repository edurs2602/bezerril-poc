import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Carimbo, Cnj, DiasUteis, Indicador, Secao, Titulo, Vazio } from "../components/ui";
import { dataCurta, diaDaSemana, diasUteisAte, ehHoje, hora, rotuloDiasUteis } from "../domain/dates";
import { FASES, SISTEMAS, type Processo } from "../domain/types";
import { nomeUsuario, useStore, useUsuario } from "../store/store";

export function Painel() {
  const { estado, processosVisiveis } = useStore();
  const usuario = useUsuario();
  const admin = usuario.papel === "admin";
  const [escopo, setEscopo] = useState<"meus" | "todos">(admin ? "todos" : "meus");

  const base = useMemo(
    () => (escopo === "meus" ? processosVisiveis.filter((p) => p.responsavelId === usuario.id) : processosVisiveis),
    [escopo, processosVisiveis, usuario.id],
  );

  const prazos = useMemo(
    () =>
      base
        .flatMap((p) => p.prazos.filter((z) => !z.concluido).map((z) => ({ p, z, d: diasUteisAte(z.vencimento) })))
        .sort((a, b) => a.z.vencimento.localeCompare(b.z.vencimento))
        .slice(0, 5),
    [base],
  );
  const prazosNaSemana = base.flatMap((p) => p.prazos).filter((z) => !z.concluido && diasUteisAte(z.vencimento) <= 5).length;

  const movimentacoes = useMemo(
    () =>
      base
        .flatMap((p) => p.andamentos.filter((a) => ehHoje(a.data)).map((a) => ({ p, a })))
        .sort((x, y) => y.a.data.localeCompare(x.a.data)),
    [base],
  );

  const porFase = FASES.map((f) => ({ fase: f, n: base.filter((p) => p.fase === f).length }));
  const maxFase = Math.max(1, ...porFase.map((x) => x.n));
  const consulta = `Consulta das ${hora(ultimaConsulta(base))}`;

  return (
    <div className="painel">
      <Titulo
        acao={
          <div className="alternador" role="group" aria-label="Escopo">
            <button type="button" className={escopo === "meus" ? "on" : ""} onClick={() => setEscopo("meus")}>
              Meus processos
            </button>
            <button type="button" className={escopo === "todos" ? "on" : ""} onClick={() => setEscopo("todos")}>
              Todo o escritório
            </button>
          </div>
        }
      >
        Painel
      </Titulo>

      <div className="indicadores">
        <Indicador rotulo="Processos acompanhados" valor={base.length} para="/processos" />
        <Indicador rotulo="Movimentações hoje" valor={movimentacoes.length} detalhe={consulta} />
        <Indicador rotulo="Prazos em até 5 dias úteis" valor={prazosNaSemana} perigo={prazosNaSemana > 0} para="/processos?prazo=5" />
        {admin ? (
          <>
            <Indicador
              rotulo="Falhas de captura"
              valor={estado.processos.filter((p) => p.captura.status === "pendente").length}
              para="/admin/falhas"
              perigo
            />
            <Indicador
              rotulo="Sem responsável"
              valor={estado.processos.filter((p) => !p.responsavelId).length}
              para="/admin/sem-responsavel"
              perigo
            />
          </>
        ) : (
          <Indicador
            rotulo="Próximo prazo"
            valor={prazos[0] ? rotuloDiasUteis(prazos[0].d) : "—"}
            detalhe={prazos[0] ? `${diaDaSemana(prazos[0].z.vencimento)}, ${dataCurta(prazos[0].z.vencimento).slice(0, 5)}` : "Nenhum prazo em aberto"}
          />
        )}
      </div>

      <div className="painel-grade">
        <div className="painel-principal">
          <Secao titulo="Próximos prazos" nota="Contados em dias úteis" acao={<Link to="/processos?prazo=5">Ver todos</Link>}>
            {prazos.length === 0 ? (
              <Vazio>Nenhum prazo em aberto neste recorte.</Vazio>
            ) : (
              <table className="tabela tabela-lista">
                <thead>
                  <tr>
                    <th scope="col">Restam</th>
                    <th scope="col">Prazo</th>
                    <th scope="col">Vencimento</th>
                    {escopo === "todos" && <th scope="col">Responsável</th>}
                  </tr>
                </thead>
                <tbody>
                  {prazos.map(({ p, z }) => (
                    <tr key={z.id}>
                      <td data-rotulo="Restam"><DiasUteis vencimento={z.vencimento} /></td>
                      <td data-rotulo="Prazo">
                        <Link to={`/processos/${p.id}`}>{z.descricao}</Link>
                        <small>
                          <Cnj p={p} /> · {p.assunto}
                          {p.segredo && " · segredo de justiça"}
                        </small>
                      </td>
                      <td data-rotulo="Vencimento" className="sem-quebra">
                        {diaDaSemana(z.vencimento)}, {dataCurta(z.vencimento).slice(0, 5)}
                      </td>
                      {escopo === "todos" && <td data-rotulo="Responsável">{nomeUsuario(estado, p.responsavelId)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>

          <Secao titulo="Movimentações de hoje" nota={consulta}>
            {movimentacoes.length === 0 ? (
              <Vazio>Nenhuma movimentação neste recorte.</Vazio>
            ) : (
              <table className="tabela tabela-lista">
                <thead>
                  <tr>
                    <th scope="col">Movimentação</th>
                    <th scope="col">Processo</th>
                    <th scope="col">Sistema</th>
                    {escopo === "todos" && <th scope="col">Responsável</th>}
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map(({ p, a }) => (
                    <tr key={a.id}>
                      <td data-rotulo="Movimentação">
                        {a.texto}
                        {a.documentoId && <small>Documento baixado</small>}
                      </td>
                      <td data-rotulo="Processo">
                        <Link to={`/processos/${p.id}`}><Cnj p={p} /></Link>
                        <small>{p.autor}</small>
                      </td>
                      <td data-rotulo="Sistema">{p.sistema}</td>
                      {escopo === "todos" && <td data-rotulo="Responsável">{nomeUsuario(estado, p.responsavelId)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>
        </div>

        <aside className="painel-lateral">
          <Secao titulo="Processos por fase" acao={<Link to="/quadro">Abrir quadro</Link>}>
            <table className="fases">
              <caption className="sr">Quantidade de processos por fase</caption>
              <tbody>
                {porFase.map(({ fase, n }) => (
                  <tr key={fase} title={`${fase}: ${n} processos`}>
                    <th scope="row">{fase}</th>
                    <td className="fases-barra">
                      <span style={{ width: `${(n / maxFase) * 100}%` }} />
                    </td>
                    <td className="num">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>

          {admin && <Madrugada processos={estado.processos} />}
        </aside>
      </div>
    </div>
  );
}

function Madrugada({ processos }: { processos: Processo[] }) {
  const linhas = SISTEMAS.map((s) => {
    const doSistema = processos.filter((p) => p.sistema === s);
    const pendentes = doSistema.filter((p) => p.captura.status === "pendente").length;
    return { s, total: doSistema.length, pendentes };
  });
  return (
    <Secao titulo="Consulta da madrugada" nota="Terminou às 03h40. Avisos enviados às 07h00." acao={<Link to="/admin/falhas">Ver falhas</Link>}>
      <table className="tabela">
        <thead>
          <tr>
            <th scope="col">Sistema</th>
            <th scope="col" className="num">Consultados</th>
            <th scope="col" className="num">Pendentes</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ s, total, pendentes }) => (
            <tr key={s}>
              <th scope="row" data-rotulo="Sistema">{s}</th>
              <td data-rotulo="Consultados" className="num">{total - pendentes}</td>
              <td data-rotulo="Pendentes" className="num">{pendentes > 0 ? <Carimbo>{pendentes}</Carimbo> : "0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Secao>
  );
}

function ultimaConsulta(processos: Processo[]): string {
  return processos.find((p) => p.captura.status === "ok" && p.captura.ultimaConsulta)?.captura.ultimaConsulta ?? "2026-11-17T03:12:00";
}
