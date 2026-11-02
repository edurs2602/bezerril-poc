import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { diasUteisAte, rotuloDiasUteis } from "../domain/dates";
import type { Processo } from "../domain/types";

export function Titulo({ children, nota, acao }: { children: ReactNode; nota?: ReactNode; acao?: ReactNode }) {
  return (
    <header className="titulo-pagina">
      <div>
        <h1>{children}</h1>
        {nota && <p className="nota">{nota}</p>}
      </div>
      {acao && <div className="titulo-acao">{acao}</div>}
    </header>
  );
}

export function Secao({ titulo, nota, children, acao }: { titulo: string; nota?: ReactNode; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="secao">
      <header className="secao-cab">
        <div>
          <h2>{titulo}</h2>
          {nota && <p className="nota">{nota}</p>}
        </div>
        {acao && <span className="secao-acao">{acao}</span>}
      </header>
      <div className="secao-corpo">{children}</div>
    </section>
  );
}

/** Card de indicador do painel. */
export function Indicador({ rotulo, valor, detalhe, para, perigo }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; para?: string; perigo?: boolean }) {
  const conteudo = (
    <>
      <span className="indicador-rotulo">{rotulo}</span>
      <strong className={perigo ? "indicador-valor perigo" : "indicador-valor"}>{valor}</strong>
      {detalhe && <span className="indicador-detalhe">{detalhe}</span>}
    </>
  );
  return para ? (
    <Link className="indicador com-link" to={para}>
      {conteudo}
    </Link>
  ) : (
    <div className="indicador">{conteudo}</div>
  );
}

/** Linha de rótulo e valor. */
export function Dado({ rotulo, valor, forte }: { rotulo: ReactNode; valor: ReactNode; forte?: boolean }) {
  return (
    <div className="dado">
      <span className="dado-rotulo">{rotulo}</span>
      <span className={forte ? "dado-valor forte" : "dado-valor"}>{valor}</span>
    </div>
  );
}

export function Cnj({ p, curto }: { p: Pick<Processo, "cnj">; curto?: boolean }) {
  return <span className="cnj">{curto ? p.cnj.slice(0, 15) : p.cnj}</span>;
}

export function Carimbo({ children, tom = "perigo" }: { children: ReactNode; tom?: "perigo" | "alerta" | "neutro" | "sucesso" | "info" }) {
  return <span className={`carimbo carimbo-${tom}`}>{children}</span>;
}

export function DiasUteis({ vencimento }: { vencimento: string }) {
  const d = diasUteisAte(vencimento);
  const classe = d <= 1 ? "du du-1" : d <= 3 ? "du du-3" : d <= 5 ? "du du-5" : "du";
  return <span className={classe}>{rotuloDiasUteis(d)}</span>;
}

export function Modal({ titulo, onFechar, children, largo }: { titulo: string; onFechar: () => void; children: ReactNode; largo?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={largo ? "modal modal-largo" : "modal"}
      onClose={onFechar}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="modal-corpo">
        <header className="modal-cab">
          <h2>{titulo}</h2>
          <button type="button" className="topo-icone" aria-label="Fechar" onClick={() => ref.current?.close()}>
            <X size={18} aria-hidden />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function Campo({ rotulo, erro, ajuda, children }: { rotulo: string; erro?: string | null; ajuda?: string; children: ReactNode }) {
  return (
    <label className={erro ? "campo com-erro" : "campo"}>
      <span className="campo-rotulo">{rotulo}</span>
      {children}
      {ajuda && !erro && <span className="campo-ajuda">{ajuda}</span>}
      {erro && <span className="campo-erro">{erro}</span>}
    </label>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="vazio">{children}</p>;
}
