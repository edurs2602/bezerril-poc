import { useState, type FormEvent } from "react";
import { Campo, Carimbo, Modal, Titulo, Vazio } from "../components/ui";
import { dataCurta } from "../domain/dates";
import { podeTerAcessos } from "../domain/permissoes";
import type { Acesso, Sistema } from "../domain/types";
import { useStore, useUsuario } from "../store/store";

export function Acessos() {
  const { estado } = useStore();
  const usuario = useUsuario();
  const [editando, setEditando] = useState<Acesso | null>(null);

  if (!podeTerAcessos(usuario)) {
    return (
      <div>
        <Titulo>Acessos aos tribunais</Titulo>
        <Vazio>
          Estagiários não cadastram acesso aos sistemas dos tribunais (RN17). Seus processos são consultados com o acesso
          de referência definido pelo administrador.
        </Vazio>
      </div>
    );
  }

  const meus = estado.acessos.filter((a) => a.usuarioId === usuario.id);
  const parados = (s: Sistema) =>
    estado.processos.filter((p) => p.responsavelId === usuario.id && p.sistema === s).length;

  return (
    <div className="pagina-estreita">
      <Titulo nota="O acompanhamento consulta cada tribunal com o seu login, nunca com um acesso único do escritório (RN11). Só você altera estes dados.">
        Meus acessos aos tribunais
      </Titulo>
      <table className="tabela">
        <thead>
          <tr>
            <th scope="col">Sistema</th>
            <th scope="col">Login</th>
            <th scope="col">Situação</th>
            <th scope="col" className="num">Seus processos</th>
            <th scope="col">Atualizado</th>
            <th scope="col"><span className="sr">Ação</span></th>
          </tr>
        </thead>
        <tbody>
          {meus.map((a) => (
            <tr key={a.sistema}>
              <th scope="row" data-rotulo="Sistema">{a.sistema}</th>
              <td data-rotulo="Login" className="mono">{a.login || "—"}</td>
              <td data-rotulo="Situação">
                {a.status === "valido" && <Carimbo tom="sucesso">Válido</Carimbo>}
                {a.status === "expirado" && <Carimbo>Expirado</Carimbo>}
                {a.status === "nao_cadastrado" && <Carimbo tom="alerta">Não cadastrado</Carimbo>}
              </td>
              <td data-rotulo="Seus processos" className="num">{parados(a.sistema)}</td>
              <td data-rotulo="Atualizado">{a.status === "nao_cadastrado" ? "—" : dataCurta(a.atualizadoEm)}</td>
              <td>
                <button type="button" className="link" onClick={() => setEditando(a)}>
                  {a.status === "nao_cadastrado" ? "Cadastrar" : "Atualizar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="nota nota-bloco">
        As senhas ficam guardadas cifradas e são usadas apenas pela consulta automática. Nem o administrador as vê.
      </p>
      {editando && <EditarAcesso a={editando} onFechar={() => setEditando(null)} />}
    </div>
  );
}

function EditarAcesso({ a, onFechar }: { a: Acesso; onFechar: () => void }) {
  const { salvarAcesso, avisar } = useStore();
  const [login, setLogin] = useState(a.login);
  const [senha, setSenha] = useState("");

  function salvar(e: FormEvent) {
    e.preventDefault();
    salvarAcesso(a.sistema, login);
    avisar(`Acesso ao ${a.sistema} atualizado. A próxima consulta já usa a nova credencial.`);
    onFechar();
  }

  return (
    <Modal titulo={`Acesso ao ${a.sistema}`} onFechar={onFechar}>
      <form onSubmit={salvar} className="form-coluna">
        <Campo rotulo="Login">
          <input required value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="off" />
        </Campo>
        <Campo rotulo="Senha" ajuda="Na demonstração, nada do que você digitar é guardado.">
          <input required type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </Campo>
        <div className="form-acoes">
          <button className="botao" type="submit">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
