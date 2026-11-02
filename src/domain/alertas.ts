import type { Acesso, MotivoFalha, Processo, Usuario } from "./types";
import { dataCurta, diasUteisAte, ehHoje } from "./dates";

export type TipoAlerta = "prazo" | "andamento" | "falha" | "acesso" | "orfao";

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  detalhe: string;
  data: string;
  link: string;
  urgencia: number; // menor aparece primeiro
}

export const MOTIVO_LABEL: Record<MotivoFalha, string> = {
  fora_do_ar: "Tribunal fora do ar",
  captcha: "Captcha não resolvido",
  erro_site: "Erro no site do tribunal",
  acesso_invalido: "Acesso expirado ou inválido",
};

const AVISOS = new Set([5, 3, 1]);

/** RN06 e RN12: cada um recebe só o que é seu; sem responsável, os avisos vão ao administrador. */
export function alertasDe(usuario: Usuario, processos: Processo[], acessos: Acesso[], nomes: Record<string, string>): Alerta[] {
  const lista: Alerta[] = [];
  const ehAdmin = usuario.papel === "admin";
  const meus = processos.filter(
    (p) => p.responsavelId === usuario.id || (ehAdmin && p.responsavelId === null),
  );

  for (const p of meus) {
    for (const z of p.prazos) {
      if (z.concluido) continue;
      const d = diasUteisAte(z.vencimento);
      if (d <= 0 || AVISOS.has(d)) {
        lista.push({
          id: `prazo:${z.id}:${d}`,
          tipo: "prazo",
          titulo: d <= 0 ? `${z.descricao}: prazo vencido` : `${z.descricao}: vence em ${d} ${d === 1 ? "dia útil" : "dias úteis"}`,
          detalhe: `${p.cnj} · vencimento ${dataCurta(z.vencimento)}`,
          data: "2026-11-17T07:00:00",
          link: `/processos/${p.id}`,
          urgencia: d,
        });
      }
    }
    for (const a of p.andamentos) {
      if (!ehHoje(a.data)) continue;
      lista.push({
        id: `andamento:${a.id}`,
        tipo: "andamento",
        titulo: a.texto,
        detalhe: `${p.cnj} · ${p.autor}`,
        data: a.data,
        link: `/processos/${p.id}`,
        urgencia: 10,
      });
    }
  }

  for (const a of acessos) {
    if (a.status !== "expirado") continue;
    if (a.usuarioId !== usuario.id && !ehAdmin) continue;
    const dono = a.usuarioId === usuario.id ? "Seu acesso" : `Acesso de ${nomes[a.usuarioId]}`;
    lista.push({
      id: `acesso:${a.usuarioId}:${a.sistema}:${a.atualizadoEm}`,
      tipo: "acesso",
      titulo: `${dono} ao ${a.sistema} expirou`,
      detalhe: "A consulta dos processos que dependem dele está parada até a atualização (RN19).",
      data: "2026-11-17T03:40:00",
      link: a.usuarioId === usuario.id ? "/acessos" : "/admin/falhas",
      urgencia: 2,
    });
  }

  if (ehAdmin) {
    const pendentes = processos.filter((p) => p.captura.status === "pendente" && p.captura.motivo !== "acesso_invalido");
    if (pendentes.length) {
      lista.push({
        id: `falha:${pendentes.length}`,
        tipo: "falha",
        titulo: `${pendentes.length} processos em captura pendente`,
        detalhe: "Esgotaram as 10 novas tentativas na madrugada (RN08).",
        data: "2026-11-17T03:40:00",
        link: "/admin/falhas",
        urgencia: 2,
      });
    }
    const orfaos = processos.filter((p) => p.responsavelId === null).length;
    if (orfaos) {
      lista.push({
        id: `orfao:${orfaos}`,
        tipo: "orfao",
        titulo: `${orfaos} processos sem responsável`,
        detalhe: "Aguardando redistribuição (RN07).",
        data: "2026-11-17T03:40:00",
        link: "/admin/sem-responsavel",
        urgencia: 4,
      });
    }
  }

  return lista.sort((a, b) => a.urgencia - b.urgencia || b.data.localeCompare(a.data));
}
