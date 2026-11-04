import { useState, type FormEvent } from "react";
import { Campo, Carimbo, Modal, Secao, Titulo } from "../../components/ui";
import { PAPEL_LABEL, type Papel, type Usuario } from "../../domain/types";
import { useStore, useUsuario } from "../../store/store";

export function Usuarios() {
  const { estado, alternarAtivo, definirAcessoReferencia, avisar } = useStore();
  const eu = useUsuario();
  const [edicao, setEdicao] = useState<Usuario | "novo" | null>(null);

  const advogados = estado.usuarios.filter((u) => u.ativo && u.papel !== "estagiario");

  function alternar(u: Usuario) {
    const n = estado.processos.filter((p) => p.responsavelId === u.id).length;
    alternarAtivo(u.id);
    avisar(
      u.ativo
        ? `${u.nome} foi desativado. ${n} processos foram para a fila de sem responsável.`
        : `${u.nome} foi reativado.`,
    );
  }

  return (
    <div>
      <Titulo
        nota="Só o administrador cadastra e desativa usuários. Ninguém cria a própria conta (RN16)."
        acao={<button type="button" className="botao" onClick={() => setEdicao("novo")}>Cadastrar usuário</button>}
      >
        Usuários
      </Titulo>
      <table className="tabela">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Perfil</th>
            <th scope="col" className="num">Processos</th>
            <th scope="col">Situação</th>
            <th scope="col"><span className="sr">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {estado.usuarios.map((u) => (
            <tr key={u.id} className={u.ativo ? undefined : "inativo"}>
              <td data-rotulo="Nome">{u.nome}<small>{u.email}</small></td>
              <td data-rotulo="Perfil">{PAPEL_LABEL[u.papel]}</td>
              <td data-rotulo="Processos" className="num">{estado.processos.filter((p) => p.responsavelId === u.id).length}</td>
              <td data-rotulo="Situação">{u.ativo ? <Carimbo tom="sucesso">Ativo</Carimbo> : <Carimbo tom="neutro">Desativado</Carimbo>}</td>
              <td className="acoes">
                <button type="button" className="link" onClick={() => setEdicao(u)}>Editar</button>
                {u.id !== eu.id && (
                  <button type="button" className="link" onClick={() => alternar(u)}>
                    {u.ativo ? "Desativar" : "Reativar"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagina-estreita secao-referencia">
        <Secao titulo="Acesso de referência" nota="proposta da equipe, a confirmar (RN11)">
          <p className="corpo">
            Estagiários não têm acesso próprio aos tribunais. Os processos deles, e os que estão sem responsável, são
            consultados com o acesso deste advogado:
          </p>
          <select
            aria-label="Advogado de referência"
            value={estado.acessoReferenciaId}
            onChange={(e) => definirAcessoReferencia(e.target.value)}
          >
            {advogados.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </Secao>
      </div>

      {edicao && <FormUsuario usuario={edicao === "novo" ? null : edicao} onFechar={() => setEdicao(null)} />}
    </div>
  );
}

function FormUsuario({ usuario, onFechar }: { usuario: Usuario | null; onFechar: () => void }) {
  const { salvarUsuario, avisar } = useStore();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [papel, setPapel] = useState<Papel>(usuario?.papel ?? "advogado");

  function salvar(e: FormEvent) {
    e.preventDefault();
    salvarUsuario({ id: usuario?.id, nome, email: email.toLowerCase(), papel });
    if (!usuario) avisar(`Convite enviado para ${email}.`);
    onFechar();
  }

  return (
    <Modal titulo={usuario ? `Editar ${usuario.nome}` : "Cadastrar usuário"} onFechar={onFechar}>
      <form onSubmit={salvar} className="form-coluna">
        <Campo rotulo="Nome"><input required value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
        <Campo rotulo="E-mail"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Campo>
        <Campo rotulo="Perfil">
          <select value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            {(Object.keys(PAPEL_LABEL) as Papel[]).map((p) => <option key={p} value={p}>{PAPEL_LABEL[p]}</option>)}
          </select>
        </Campo>
        <div className="form-acoes"><button className="botao" type="submit">Salvar</button></div>
      </form>
    </Modal>
  );
}
