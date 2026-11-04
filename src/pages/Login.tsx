import { useState, type FormEvent } from "react";
import { Campo } from "../components/ui";
import { PAPEL_LABEL } from "../domain/types";
import { useStore } from "../store/store";

const CONTAS = [
  { id: "carla", nota: "Andamentos novos e prazos do dia." },
  { id: "julia", nota: "Sem segredo de justiça de terceiros e sem acessos aos tribunais." },
  { id: "ricardo", nota: "Falhas de captura, processos sem responsável, usuários e histórico." },
];

export function Login() {
  const { estado, entrar } = useStore();
  const [email, setEmail] = useState("carla.mendes@bezerril.adv.br");
  const [senha, setSenha] = useState("demonstracao");
  const [erro, setErro] = useState<string | null>(null);
  const [recuperar, setRecuperar] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (recuperar) {
      setEnviado(true);
      return;
    }
    const u = estado.usuarios.find((x) => x.email === email.trim().toLowerCase());
    if (!u) return setErro("E-mail não encontrado. Peça ao administrador para cadastrar sua conta.");
    if (!u.ativo) return setErro("Este usuário foi desativado.");
    entrar(u.id);
  }

  return (
    <div className="login">
      <header className="login-marca">
        <p className="login-nome">Bezerril</p>
        <p className="login-sub">
          <span>Advocacia</span>
          <span>Acompanhamento processual</span>
        </p>
      </header>
      <main className="login-main">
        <div className="login-miolo">
          <form onSubmit={enviar}>
            <h1>{recuperar ? "Recuperar senha" : "Entrar"}</h1>
            <Campo rotulo="E-mail">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            </Campo>
            {!recuperar && (
              <Campo rotulo="Senha">
                <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" />
              </Campo>
            )}
            {erro && <p className="erro-form">{erro}</p>}
            {enviado && <p className="ok-form">Se o e-mail estiver cadastrado, enviamos um link para criar outra senha.</p>}
            <div className="form-acoes">
              <button className="botao" type="submit">{recuperar ? "Enviar link" : "Entrar"}</button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setRecuperar((v) => !v);
                  setEnviado(false);
                  setErro(null);
                }}
              >
                {recuperar ? "Voltar" : "Esqueci a senha"}
              </button>
            </div>
          </form>
          <section className="login-contas" aria-labelledby="contas-titulo">
            <h2 id="contas-titulo">Entrar na demonstração como</h2>
            {CONTAS.map(({ id, nota }) => {
              const u = estado.usuarios.find((x) => x.id === id);
              if (!u || !u.ativo) return null;
              return (
                <button key={id} type="button" className="conta" onClick={() => entrar(id)}>
                  <strong>{u.nome}</strong>
                  <em>{PAPEL_LABEL[u.papel]}</em>
                  <span>{nota}</span>
                </button>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
