import { Link } from "react-router-dom";
import { useAlertas } from "../components/Shell";
import { Carimbo, Cnj, Secao, Titulo, Vazio } from "../components/ui";
import type { Alerta, TipoAlerta } from "../domain/alertas";
import { dataPorExtenso, ehHoje, HOJE, hora } from "../domain/dates";
import { useStore, useUsuario } from "../store/store";

const ROTULO: Record<TipoAlerta, string> = {
  prazo: "Prazo",
  andamento: "Andamento",
  falha: "Falha",
  acesso: "Acesso",
  orfao: "Fila",
};

export function Alertas() {
  const { estado, marcarLido } = useStore();
  const alertas = useAlertas();
  const naoLidos = alertas.filter((a) => !estado.alertasLidos.includes(a.id));

  return (
    <div>
      <Titulo
        nota="Cada pessoa recebe só os avisos dos processos sob sua responsabilidade (RN06)."
        acao={
          naoLidos.length > 0 && (
            <button type="button" className="botao botao-secundario" onClick={() => marcarLido(alertas.map((a) => a.id))}>
              Marcar todos como lidos
            </button>
          )
        }
      >
        Avisos
      </Titulo>
      <div className="avisos-grade">
        <div>
          {alertas.length === 0 ? (
            <Vazio>Nenhum aviso para você hoje.</Vazio>
          ) : (
            <ul className="avisos">
              {alertas.map((a) => (
                <LinhaAviso key={a.id} a={a} lido={estado.alertasLidos.includes(a.id)} onAbrir={() => marcarLido([a.id])} />
              ))}
            </ul>
          )}
        </div>
        <EmailDoDia />
      </div>
    </div>
  );
}

function LinhaAviso({ a, lido, onAbrir }: { a: Alerta; lido: boolean; onAbrir: () => void }) {
  return (
    <li className={lido ? "aviso-linha lido" : "aviso-linha"}>
      <span className="aviso-tipo">
        <Carimbo tom={a.tipo === "prazo" ? "perigo" : a.tipo === "andamento" ? "info" : "alerta"}>{ROTULO[a.tipo]}</Carimbo>
      </span>
      <Link to={a.link} onClick={onAbrir}>
        <strong>{a.titulo}</strong>
        <span className="nota">{a.detalhe}</span>
      </Link>
      <time>{hora(a.data)}</time>
    </li>
  );
}

// Formato do e-mail ainda em aberto com o cliente (CN02): aqui, um resumo do dia.
function EmailDoDia() {
  const { processosVisiveis } = useStore();
  const usuario = useUsuario();
  const meus = processosVisiveis.filter((p) => p.responsavelId === usuario.id);
  const mudancas = meus.flatMap((p) => p.andamentos.filter((a) => ehHoje(a.data)).map((a) => ({ p, a })));
  const primeiroNome = usuario.nome.split(" ")[0];

  return (
    <div className="email-area">
      <Secao titulo="E-mail das 07h00" nota="Prévia">
        <div className="email">
          <dl>
            <dt>De</dt><dd>Acompanhamento Bezerril</dd>
            <dt>Para</dt><dd>{usuario.email}</dd>
            <dt>Assunto</dt>
            <dd><strong>{mudancas.length} {mudancas.length === 1 ? "andamento novo" : "andamentos novos"} nos seus processos</strong></dd>
          </dl>
          <div className="email-corpo">
            <p>Bom dia, {primeiroNome}. Resultado da consulta de {dataPorExtenso(HOJE).toLowerCase()}:</p>
            {mudancas.length === 0 ? (
              <p>Nenhum dos seus processos teve movimentação nesta madrugada.</p>
            ) : (
              <ul>
                {mudancas.map(({ p, a }) => (
                  <li key={a.id}>
                    <Cnj p={p} />
                    <br />
                    {a.texto}
                  </li>
                ))}
              </ul>
            )}
            <p><Link to="/">Abrir o painel</Link></p>
          </div>
        </div>
      </Secao>
    </div>
  );
}
