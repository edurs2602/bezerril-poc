export type Papel = "admin" | "advogado" | "estagiario";
export type Sistema = "PJe" | "Projudi" | "eProc" | "e-SAJ";

export const SISTEMAS: Sistema[] = ["PJe", "Projudi", "eProc", "e-SAJ"];

export const FASES = [
  "Distribuído",
  "Contestação",
  "Réplica",
  "Audiência",
  "Sentença",
  "Recurso",
  "Arquivado",
] as const;
export type Fase = (typeof FASES)[number];

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Administrador",
  advogado: "Advogado",
  estagiario: "Estagiário",
};

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
}

export interface Acesso {
  usuarioId: string;
  sistema: Sistema;
  login: string;
  status: "valido" | "expirado" | "nao_cadastrado";
  atualizadoEm: string; // ISO date
}

export interface Andamento {
  id: string;
  data: string; // ISO datetime
  texto: string;
  documentoId?: string; // RN21: pode não ter documento
}

export interface Documento {
  id: string;
  nome: string;
  data: string;
  tamanhoMb: number;
}

export interface Prazo {
  id: string;
  descricao: string;
  vencimento: string; // ISO date
  concluido: boolean;
  registradoPor: string;
}

export type MotivoFalha = "fora_do_ar" | "captcha" | "erro_site" | "acesso_invalido";

export interface Captura {
  status: "ok" | "pendente";
  ultimaConsulta: string; // última consulta bem-sucedida
  motivo?: MotivoFalha;
  tentativas?: number;
}

export interface Processo {
  id: string;
  cnj: string;
  tribunal: string;
  sistema: Sistema;
  vara: string;
  autor: string;
  reu: string;
  assunto: string;
  responsavelId: string | null;
  fase: Fase;
  faseManual: boolean;
  segredo: boolean;
  captura: Captura;
  andamentos: Andamento[]; // mais recente primeiro
  documentos: Documento[];
  prazos: Prazo[];
  resumo: string;
  resumoEm: string;
}

export interface RegistroHistorico {
  id: string;
  em: string;
  usuarioId: string | "sistema";
  processoId?: string;
  processoCnj?: string;
  campo: string;
  anterior: string;
  novo: string;
}
