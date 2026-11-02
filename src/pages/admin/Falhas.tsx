import { useState } from "react";
import { Link } from "react-router-dom";
import { Carimbo, Cnj, Indicador, Secao, Titulo, Vazio } from "../../components/ui";
import { MOTIVO_LABEL } from "../../domain/alertas";
import { dataHora } from "../../domain/dates";
import type { MotivoFalha, Processo } from "../../domain/types";
import { nomeUsuario, useStore } from "../../store/store";

const RECOLHIDO = 5;
const ORDEM: MotivoFalha[] = ["acesso_invalido", "fora_do_ar", "captcha", "erro_site"];

const EXPLICACAO: Record<MotivoFalha, string> = {
  acesso_invalido: "Sem novas tentativas: a consulta fica parada até o advogado atualizar a senha (RN19).",
  fora_do_ar: "Esgotou as 10 novas tentativas. Os demais tribunais seguiram normalmente (RN08).",
  captcha: "O captcha falhou em todas as 10 novas tentativas (RN08).",
  erro_site: "O site respondeu com erro em todas as 10 novas tentativas (RN08).",
};

export function Falhas() {
  const { estado, consultarAgora, avisar } = useStore();
  const pendentes = estado.processos.filter((p) => p.captura.status === "pendente");

  const expirados = estado.acessos.filter((a) => a.status === "expirado");

  return (
    <div>
      <Titulo nota="Processos que a consulta não alcançou. Um processo sem consulta pode esconder um prazo correndo.">
        Falhas de captura
      </Titulo>
      <div className="indicadores">
        <Indicador rotulo="Processos consultados" valor={estado.processos.length - pendentes.length} detalhe={`de ${estado.processos.length} acompanhados`} />
        <Indicador rotulo="Captura pendente" valor={pendentes.length} perigo={pendentes.length > 0} />
        <Indicador rotulo="Acessos expirados" valor={expirados.length} perigo={expirados.length > 0} />
      </div>

      {pendentes.length === 0 ? (
        <Vazio>Nada a tratar por aqui.</Vazio>
      ) : (
        ORDEM.map((m) => {
          const grupo = pendentes.filter((p) => p.captura.motivo === m);
          if (!grupo.length) return null;
          return (
            <Secao
              key={m}
              titulo={`${MOTIVO_LABEL[m]} (${grupo.length})`}
              nota={EXPLICACAO[m]}
              acao={
                m !== "acesso_invalido" && (
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      grupo.forEach((p) => consultarAgora(p.id));
                      avisar(`${grupo.length} processos consultados de novo com sucesso.`);
                    }}
                  >
                    Consultar todos agora
                  </button>
                )
              }
            >
              {m === "acesso_invalido" && expirados.length > 0 && (
                <p className="faixa faixa-simples">
                  {expirados.map((a) => `${nomeUsuario(estado, a.usuarioId)}, acesso ao ${a.sistema}`).join("; ")}.
                  O advogado já foi avisado por e-mail. Para ver a atualização, entre como {nomeUsuario(estado, expirados[0].usuarioId)} em Acessos aos tribunais.
                </p>
              )}
              <TabelaFalhas processos={grupo} onConsultar={m === "acesso_invalido" ? undefined : consultarAgora} />
            </Secao>
          );
        })
      )}
    </div>
  );
}

function TabelaFalhas({ processos, onConsultar }: { processos: Processo[]; onConsultar?: (id: string) => void }) {
  const { estado } = useStore();
  const [tudo, setTudo] = useState(false);
  const visiveis = tudo ? processos : processos.slice(0, RECOLHIDO);
  return (
    <>
    <table className="tabela tabela-falhas">
      <thead>
        <tr>
          <th scope="col">Processo</th>
          <th scope="col">Tribunal</th>
          <th scope="col">Responsável</th>
          <th scope="col" className="num">Tentativas</th>
          <th scope="col">Última com sucesso</th>
          <th scope="col"><span className="sr">Ação</span></th>
        </tr>
      </thead>
      <tbody>
        {visiveis.map((p) => (
          <tr key={p.id}>
            <td data-rotulo="Processo">
              <Link to={`/processos/${p.id}`}><Cnj p={p} /></Link>
              {p.segredo && <small><Carimbo tom="neutro">Segredo</Carimbo></small>}
            </td>
            <td data-rotulo="Tribunal">{p.tribunal} · {p.sistema}</td>
            <td data-rotulo="Responsável">{nomeUsuario(estado, p.responsavelId)}</td>
            <td data-rotulo="Tentativas" className="num">{p.captura.tentativas ?? 0}</td>
            <td data-rotulo="Última com sucesso">{dataHora(p.captura.ultimaConsulta)}</td>
            <td>
              {onConsultar && (
                <button type="button" className="link" onClick={() => onConsultar(p.id)}>Consultar agora</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {processos.length > RECOLHIDO && !tudo && (
      <p className="mais">
        <button type="button" className="link" onClick={() => setTudo(true)}>
          Ver os outros {processos.length - RECOLHIDO}
        </button>
      </p>
    )}
    </>
  );
}
