import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Campo, Carimbo, Cnj, Dado, DiasUteis, Modal, Secao, Vazio } from "../components/ui";
import { MOTIVO_LABEL } from "../domain/alertas";
import { dataCurta, dataHora, datasDeAviso, diaDaSemana, ehDiaUtil, ehHoje, HOJE, somarDiasUteis } from "../domain/dates";
import { ehAdmin, podeVer } from "../domain/permissoes";
import { FASES, type Documento, type Fase, type Processo } from "../domain/types";
import { nomeUsuario, useStore, useUsuario } from "../store/store";

export function ProcessoDetalhe() {
  const { id } = useParams();
  const { estado, moverFase, reatribuir, concluirPrazo, consultarAgora, avisar } = useStore();
  const usuario = useUsuario();
  const [novoPrazo, setNovoPrazo] = useState(false);
  const [doc, setDoc] = useState<Documento | null>(null);

  const p = estado.processos.find((x) => x.id === id);

  // RN03: para quem não pode ver, o processo em segredo simplesmente não existe.
  if (!p || !podeVer(usuario, p)) {
    return (
      <div className="nao-encontrado">
        <h1>Processo não disponível</h1>
        <p>Ele não existe ou você não tem permissão para vê-lo.</p>
        <Link to="/processos">Voltar para a lista</Link>
      </div>
    );
  }

  const abertos = p.prazos.filter((z) => !z.concluido).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const intimacaoSemPrazo =
    abertos.length === 0 && p.andamentos.some((a) => ehHoje(a.data) && a.texto.toLowerCase().includes("intima"));
  const integra = p.documentos.find((d) => d.nome === "Íntegra do processo");
  const historico = estado.historico.filter((h) => h.processoId === p.id);
  const responsavel = estado.usuarios.find((u) => u.id === p.responsavelId);
  const usaReferencia = !responsavel || responsavel.papel === "estagiario";

  return (
    <article className="detalhe">
      <p className="migalha"><Link to="/processos">Processos</Link> / {p.tribunal}</p>
      <header className="detalhe-cab">
        <h1><Cnj p={p} /></h1>
        <p className="detalhe-partes">
          {p.autor} <em>contra</em> {p.reu}
        </p>
        <p className="nota">
          {p.assunto} · {p.vara} · {p.sistema}
        </p>
        <div className="detalhe-carimbos">
          {p.segredo && <Carimbo tom="neutro">Segredo de justiça</Carimbo>}
          {p.captura.status === "pendente" && <Carimbo>Captura pendente</Carimbo>}
          {p.faseManual && <Carimbo tom="alerta">Coluna ajustada à mão</Carimbo>}
        </div>
      </header>

      {intimacaoSemPrazo && (
        <div className="faixa">
          <span>Intimação nova hoje, sem prazo registrado.</span>
          <button type="button" className="botao botao-pequeno" onClick={() => setNovoPrazo(true)}>Registrar prazo</button>
        </div>
      )}

      <div className="detalhe-grade">
        <div className="detalhe-principal">
          <Secao titulo="Resumo" nota={p.resumoEm ? `gerado por IA · ${dataHora(p.resumoEm)}` : "gerado por IA"}>
            <p className="resumo">{p.resumo}</p>
            {integra && integra.tamanhoMb > 20 && (
              <p className="nota">
                Íntegra de {formatarMb(integra.tamanhoMb)} guardada completa; só o texto relevante foi enviado à IA (RN24).
              </p>
            )}
          </Secao>

          <Secao titulo="Andamentos" nota={`${p.andamentos.length} capturados`}>
            {p.andamentos.length === 0 ? (
              <Vazio>Aguardando a primeira consulta, na próxima madrugada.</Vazio>
            ) : (
              <ol className="linha-tempo">
                {p.andamentos.map((a) => {
                  const d = p.documentos.find((x) => x.id === a.documentoId);
                  return (
                    <li key={a.id} className={ehHoje(a.data) ? "hoje" : undefined}>
                      <time>{dataCurta(a.data)}</time>
                      <div>
                        <p>{a.texto}</p>
                        {d ? (
                          <button type="button" className="link" onClick={() => setDoc(d)}>
                            {d.nome} ({formatarMb(d.tamanhoMb)})
                          </button>
                        ) : (
                          <span className="fraco">sem documento</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Secao>

          {ehAdmin(usuario) && (
            <Secao titulo="Histórico de alterações" nota="não pode ser editado nem apagado (RN10)">
              {historico.length === 0 ? (
                <Vazio>Nenhuma alteração registrada neste processo.</Vazio>
              ) : (
                <ul className="historico-curto">
                  {historico.map((h) => (
                    <li key={h.id}>
                      <time>{dataHora(h.em)}</time>
                      <span>
                        <strong>{nomeUsuario(estado, h.usuarioId)}</strong> · {h.campo}: {h.anterior && <s>{h.anterior}</s>} {h.novo}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Secao>
          )}
        </div>

        <aside className="detalhe-lateral">
          <Secao
            titulo="Prazos"
            acao={
              <button type="button" className="link" onClick={() => setNovoPrazo(true)}>
                Registrar
              </button>
            }
          >
            {abertos.length === 0 ? (
              <Vazio>Nenhum prazo em aberto.</Vazio>
            ) : (
              <ul className="prazos-lista">
                {abertos.map((z) => (
                  <li key={z.id}>
                    <DiasUteis vencimento={z.vencimento} />
                    <div>
                      <strong>{z.descricao}</strong>
                      <span className="nota">
                        {diaDaSemana(z.vencimento)}, {dataCurta(z.vencimento)}
                      </span>
                      <span className="nota">
                        Avisos: {datasDeAviso(z.vencimento).map((a) => `${a.dias} d.u. em ${dataCurta(a.data).slice(0, 5)}`).join(" · ")}
                      </span>
                      <button type="button" className="link" onClick={() => concluirPrazo(p.id, z.id)}>
                        Marcar como cumprido
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Responsável">
            <select
              aria-label="Responsável pelo processo"
              value={p.responsavelId ?? ""}
              onChange={(e) => {
                if (!e.target.value) return;
                reatribuir([p.id], e.target.value);
                avisar(`Processo atribuído a ${nomeUsuario(estado, e.target.value)}. A troca ficou no histórico.`);
              }}
            >
              {!p.responsavelId && <option value="">Sem responsável</option>}
              {estado.usuarios.filter((u) => u.ativo).map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
            <p className="nota">
              {usaReferencia
                ? `Consulta com o acesso de referência: ${nomeUsuario(estado, estado.acessoReferenciaId)} (RN11).`
                : `Consulta com o acesso de ${responsavel.nome.split(" ")[0]} ao ${p.sistema} (RN11).`}
            </p>
          </Secao>

          <Secao titulo="Fase no quadro">
            <select
              aria-label="Fase do processo"
              value={p.fase}
              onChange={(e) => moverFase(p.id, e.target.value as Fase)}
            >
              {FASES.map((f) => <option key={f}>{f}</option>)}
            </select>
            <p className="nota">Ajuste manual vale até o próximo andamento capturado (RN09).</p>
          </Secao>

          <Secao titulo="Documentos" nota={`${p.documentos.length} baixados`}>
            {p.documentos.length === 0 ? (
              <Vazio>Nenhum documento ainda.</Vazio>
            ) : (
              <ul className="documentos">
                {p.documentos.map((d) => (
                  <li key={d.id}>
                    <button type="button" className="link" onClick={() => setDoc(d)}>{d.nome}</button>
                    <span className="fraco">{formatarMb(d.tamanhoMb)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Consulta ao tribunal">
            {p.captura.status === "pendente" && p.captura.motivo && (
              <Dado rotulo="Motivo" valor={MOTIVO_LABEL[p.captura.motivo]} forte />
            )}
            <Dado
              rotulo="Última com sucesso"
              valor={p.captura.ultimaConsulta ? dataHora(p.captura.ultimaConsulta) : "Ainda não consultado"}
            />
            {p.captura.status === "pendente" && p.captura.motivo !== "acesso_invalido" && (
              <button type="button" className="link" onClick={() => consultarAgora(p.id)}>
                Consultar agora
              </button>
            )}
          </Secao>
        </aside>
      </div>

      {novoPrazo && <RegistrarPrazo p={p} onFechar={() => setNovoPrazo(false)} />}
      {doc && <VerDocumento p={p} d={doc} onFechar={() => setDoc(null)} />}
    </article>
  );
}

function formatarMb(mb: number): string {
  return `${mb.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
}

function RegistrarPrazo({ p, onFechar }: { p: Processo; onFechar: () => void }) {
  const { registrarPrazo, avisar } = useStore();
  const [descricao, setDescricao] = useState("");
  const [modo, setModo] = useState<"data" | "dias">("dias");
  const [data, setData] = useState(somarDiasUteis(HOJE, 5));
  const [dias, setDias] = useState(15);

  const vencimento = modo === "data" ? data : somarDiasUteis(HOJE, Math.max(1, dias || 1));
  const dataInvalida = modo === "data" && (!data || !ehDiaUtil(data));

  function salvar(e: FormEvent) {
    e.preventDefault();
    if (dataInvalida) return;
    registrarPrazo(p.id, descricao, vencimento);
    avisar("Prazo registrado. Os avisos de 5, 3 e 1 dia útil foram programados.");
    onFechar();
  }

  return (
    <Modal titulo="Registrar prazo" onFechar={onFechar}>
      <form onSubmit={salvar} className="form-coluna">
        <Campo rotulo="O que precisa ser feito">
          <input required value={descricao} placeholder="Ex.: Manifestação sobre documentos" onChange={(e) => setDescricao(e.target.value)} />
        </Campo>
        <div className="alternador" role="group" aria-label="Forma de informar o prazo">
          <button type="button" className={modo === "dias" ? "on" : ""} onClick={() => setModo("dias")}>Quantidade de dias úteis</button>
          <button type="button" className={modo === "data" ? "on" : ""} onClick={() => setModo("data")}>Data final</button>
        </div>
        {modo === "dias" ? (
          <Campo rotulo="Dias úteis a partir de hoje">
            <input type="number" min={1} max={120} value={dias} onChange={(e) => setDias(Number(e.target.value))} />
          </Campo>
        ) : (
          <Campo rotulo="Data de vencimento" erro={dataInvalida ? "Escolha um dia útil: fins de semana e feriados não contam (RN04)." : null}>
            <input type="date" min={HOJE} value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
        )}
        {!dataInvalida && (
          <div className="previa-prazo">
            <p>
              Vence em <strong>{diaDaSemana(vencimento)}, {dataCurta(vencimento)}</strong> <DiasUteis vencimento={vencimento} />
            </p>
            <ul>
              {datasDeAviso(vencimento).map((a) => (
                <li key={a.dias}>
                  Aviso de {a.dias} {a.dias === 1 ? "dia útil" : "dias úteis"}: {diaDaSemana(a.data)}, {dataCurta(a.data).slice(0, 5)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="form-acoes">
          <button className="botao" type="submit" disabled={dataInvalida}>Registrar prazo</button>
          <span className="nota">Contagem sem fins de semana nem feriados forenses.</span>
        </div>
      </form>
    </Modal>
  );
}

function VerDocumento({ p, d, onFechar }: { p: Processo; d: Documento; onFechar: () => void }) {
  return (
    <Modal titulo={d.nome} onFechar={onFechar} largo>
      <p className="nota">Link temporário, expira em 15 minutos · {formatarMb(d.tamanhoMb)} · capturado em {dataCurta(d.data)}</p>
      <div className="folha">
        <p className="folha-orgao">Poder Judiciário · {p.tribunal}</p>
        <p className="folha-orgao">{p.vara}</p>
        <h3>{d.nome}</h3>
        <p className="mono">Processo nº {p.cnj}</p>
        <p>
          <strong>Autor:</strong> {p.autor}
          <br />
          <strong>Réu:</strong> {p.reu}
        </p>
        <p>
          Documento fictício, exibido apenas para demonstrar a abertura de arquivos no sistema. No produto, aqui aparece o
          PDF baixado do {p.sistema} durante a consulta da madrugada.
        </p>
      </div>
    </Modal>
  );
}
