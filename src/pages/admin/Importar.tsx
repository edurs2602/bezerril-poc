import { useState } from "react";
import { Link } from "react-router-dom";
import { Indicador, Secao, Titulo } from "../../components/ui";
import { useStore, type LinhaImportacao } from "../../store/store";

export function Importar() {
  const { importarExemplo } = useStore();
  const [resultado, setResultado] = useState<{ aceitas: LinhaImportacao[]; rejeitadas: LinhaImportacao[] } | null>(null);

  return (
    <div className="pagina-estreita">
      <Titulo nota="Traz para o sistema a planilha que o escritório usa hoje. As colunas definitivas dependem do cabeçalho enviado pelo escritório.">
        Importar planilha
      </Titulo>

      {!resultado ? (
        <div className="importar">
          <p className="corpo">
            Linhas com número inválido ou já cadastrado são rejeitadas e listadas, sem impedir a importação das demais (RN27).
            Os processos importados entram sem responsável, para o administrador distribuir.
          </p>
          <button type="button" className="botao" onClick={() => setResultado(importarExemplo())}>
            Importar a planilha de exemplo (6 linhas)
          </button>
        </div>
      ) : (
        <>
          <div className="indicadores">
            <Indicador rotulo="Processos importados" valor={resultado.aceitas.length} />
            <Indicador rotulo="Linhas rejeitadas" valor={resultado.rejeitadas.length} perigo={resultado.rejeitadas.length > 0} />
          </div>
          {resultado.rejeitadas.length > 0 && (
            <Secao titulo="Rejeitadas">
              <table className="tabela">
                <thead>
                  <tr><th scope="col">Número</th><th scope="col">Autor</th><th scope="col">Motivo</th></tr>
                </thead>
                <tbody>
                  {resultado.rejeitadas.map((l) => (
                    <tr key={l.cnj}>
                      <td data-rotulo="Número" className="cnj">{l.cnj}</td>
                      <td data-rotulo="Autor">{l.autor}</td>
                      <td data-rotulo="Motivo">{l.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Secao>
          )}
          <Secao titulo="Importados" acao={<Link to="/admin/sem-responsavel">Distribuir na fila</Link>}>
            <table className="tabela">
              <thead>
                <tr><th scope="col">Número</th><th scope="col">Autor</th></tr>
              </thead>
              <tbody>
                {resultado.aceitas.map((l) => (
                  <tr key={l.cnj}>
                    <td data-rotulo="Número" className="cnj">{l.cnj}</td>
                    <td data-rotulo="Autor">{l.autor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>
        </>
      )}
    </div>
  );
}
