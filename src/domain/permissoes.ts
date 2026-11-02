import type { Processo, Usuario } from "./types";

/** RN03: segredo de justiça só para o responsável e o administrador. */
export function podeVer(u: Usuario, p: Processo): boolean {
  if (!p.segredo) return true;
  return u.papel === "admin" || p.responsavelId === u.id;
}

/** RN17: estagiário não cadastra acesso aos tribunais. */
export const podeTerAcessos = (u: Usuario) => u.papel !== "estagiario";

/** RN18: histórico, falhas e redistribuição são do administrador. */
export const ehAdmin = (u: Usuario) => u.papel === "admin";
