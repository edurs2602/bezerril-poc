import { montarCnj } from "../domain/cnj";
import { HOJE, somarDiasUteis } from "../domain/dates";
import type {
  Acesso,
  Andamento,
  Captura,
  Documento,
  Fase,
  MotivoFalha,
  Prazo,
  Processo,
  RegistroHistorico,
  Sistema,
  Usuario,
} from "../domain/types";
import { FASES, SISTEMAS } from "../domain/types";

// Todos os dados abaixo são fictícios. Pessoas, companhias aéreas e números de processo
// foram inventados; os números CNJ só têm dígitos verificadores válidos para a demo (RN14).

export const USUARIOS: Usuario[] = [
  { id: "carla", nome: "Carla Mendes", email: "carla.mendes@bezerril.adv.br", papel: "advogado", ativo: true },
  { id: "julia", nome: "Júlia Rocha", email: "julia.rocha@bezerril.adv.br", papel: "estagiario", ativo: true },
  { id: "ricardo", nome: "Ricardo Lima", email: "ricardo.lima@bezerril.adv.br", papel: "admin", ativo: true },
  { id: "ana", nome: "Ana Beatriz Souza", email: "ana.souza@bezerril.adv.br", papel: "advogado", ativo: true },
  { id: "marcos", nome: "Marcos Vieira", email: "marcos.vieira@bezerril.adv.br", papel: "advogado", ativo: true },
  { id: "bruno", nome: "Bruno Teles", email: "bruno.teles@bezerril.adv.br", papel: "estagiario", ativo: true },
  { id: "pedro", nome: "Pedro Nunes", email: "pedro.nunes@bezerril.adv.br", papel: "estagiario", ativo: false },
];

export const TRIBUNAIS: { sigla: string; sistema: Sistema; tr: string; orgao: string; cidade: string }[] = [
  { sigla: "TJRN", sistema: "PJe", tr: "20", orgao: "5001", cidade: "Natal" },
  { sigla: "TJBA", sistema: "PJe", tr: "05", orgao: "0001", cidade: "Salvador" },
  { sigla: "TJMG", sistema: "PJe", tr: "13", orgao: "0024", cidade: "Belo Horizonte" },
  { sigla: "TJPR", sistema: "Projudi", tr: "16", orgao: "0014", cidade: "Londrina" },
  { sigla: "TJGO", sistema: "Projudi", tr: "09", orgao: "0051", cidade: "Goiânia" },
  { sigla: "TJSC", sistema: "eProc", tr: "24", orgao: "0023", cidade: "Florianópolis" },
  { sigla: "TJRS", sistema: "eProc", tr: "21", orgao: "0001", cidade: "Porto Alegre" },
  { sigla: "TJSP", sistema: "e-SAJ", tr: "26", orgao: "0100", cidade: "São Paulo" },
  { sigla: "TJAL", sistema: "e-SAJ", tr: "02", orgao: "0001", cidade: "Maceió" },
];

const AEREAS = [
  "Nortejet Linhas Aéreas S.A.",
  "Aerovia Transportes Aéreos Ltda.",
  "Altiva Airlines do Brasil S.A.",
  "Rotas do Sul Aviação S.A.",
];

const NOMES = [
  "Helena", "Rafael", "Marina", "Tiago", "Beatriz", "Lucas", "Fernanda", "André", "Camila", "Diego",
  "Patrícia", "Gustavo", "Larissa", "Felipe", "Renata", "Vinícius", "Aline", "Rodrigo", "Sofia", "Otávio",
  "Isabela", "Murilo", "Daniela", "Caio", "Letícia", "Henrique", "Vanessa", "Mateus", "Priscila", "Sérgio",
];
const SOBRENOMES = [
  "Prado", "Cavalcante", "Nogueira", "Barros", "Fontes", "Medeiros", "Queiroz", "Tavares", "Sampaio", "Dantas",
  "Moraes", "Pacheco", "Guedes", "Teixeira", "Freitas", "Maia", "Bastos", "Coutinho", "Leal", "Aragão",
];

const ASSUNTOS: [string, number][] = [
  ["Atraso de voo", 46],
  ["Cancelamento de voo", 34],
  ["Preterição de embarque", 8],
  ["Extravio de bagagem", 8],
  ["Perda de conexão", 4],
];

const PESO_FASES: [Fase, number][] = [
  ["Distribuído", 16],
  ["Contestação", 22],
  ["Réplica", 14],
  ["Audiência", 20],
  ["Sentença", 12],
  ["Recurso", 8],
  ["Arquivado", 8],
];

// Andamentos típicos de cada fase, em ordem. O segundo item, quando existe, é o documento baixado (RN21).
export const TEMPLATES: Record<Fase, [string, string?][]> = {
  Distribuído: [
    ["Processo distribuído por sorteio", "Petição inicial"],
    ["Conclusos para despacho"],
    ["Citação da ré expedida", "Mandado de citação"],
  ],
  Contestação: [
    ["Aviso de recebimento da citação juntado", "AR da citação"],
    ["Contestação juntada pela ré", "Contestação"],
  ],
  Réplica: [
    ["Intimação para manifestação sobre a contestação", "Intimação"],
    ["Réplica protocolada", "Réplica"],
  ],
  Audiência: [
    ["Audiência de conciliação designada", "Despacho de designação"],
    ["Certidão de intimação das partes para a audiência"],
  ],
  Sentença: [
    ["Audiência realizada, sem acordo", "Ata de audiência"],
    ["Conclusos para sentença"],
    ["Sentença de procedência publicada", "Sentença"],
  ],
  Recurso: [
    ["Recurso inominado interposto pela ré", "Recurso inominado"],
    ["Autos remetidos à Turma Recursal"],
  ],
  Arquivado: [
    ["Certificado o trânsito em julgado", "Certidão de trânsito"],
    ["Autos arquivados definitivamente"],
  ],
};

const PROVIDENCIA: Partial<Record<Fase, string>> = {
  Distribuído: "Emenda à inicial",
  Contestação: "Juntar documentos do voo",
  Réplica: "Réplica à contestação",
  Audiência: "Rol de testemunhas",
  Sentença: "Embargos de declaração",
  Recurso: "Contrarrazões ao recurso",
};

const FRASE_FASE: Record<Fase, string> = {
  Distribuído: "O processo acabou de entrar e a ré ainda não foi citada.",
  Contestação: "A ré já foi citada e o processo aguarda ou acaba de receber a contestação.",
  Réplica: "A ré contestou; o próximo passo é a manifestação do autor.",
  Audiência: "A audiência de conciliação está no horizonte; ainda não houve acordo.",
  Sentença: "A instrução terminou e o processo está na etapa de sentença.",
  Recurso: "Houve recurso contra a sentença, em trâmite na Turma Recursal.",
  Arquivado: "O processo terminou e os autos foram arquivados; a consulta segue ativa (RN20).",
};

export function resumoPadrao(p: Pick<Processo, "autor" | "reu" | "assunto" | "fase" | "andamentos">): string {
  const ultimo = p.andamentos[0];
  const base = `${p.autor} pede indenização contra ${p.reu} por ${p.assunto.toLowerCase()}. ${FRASE_FASE[p.fase]}`;
  return ultimo ? `${base} Último andamento: ${ultimo.texto.toLowerCase()}.` : base;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ponderado<T>(r: () => number, itens: [T, number][]): T {
  const total = itens.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of itens) {
    x -= w;
    if (x <= 0) return v;
  }
  return itens[itens.length - 1][0];
}

function construirLinhaDoTempo(
  id: string,
  fase: Fase,
  ultimoEm: string,
  r: () => number,
): { andamentos: Andamento[]; documentos: Documento[] } {
  const itens = FASES.slice(0, FASES.indexOf(fase) + 1).flatMap((f) => TEMPLATES[f]);
  // Do mais recente para o mais antigo, recuando alguns dias úteis a cada passo.
  const andamentos: Andamento[] = [];
  const documentos: Documento[] = [];
  let data = ultimoEm;
  for (let i = itens.length - 1; i >= 0; i--) {
    const [texto, doc] = itens[i];
    const aid = `${id}-a${i}`;
    let documentoId: string | undefined;
    if (doc) {
      documentoId = `${id}-d${i}`;
      documentos.push({
        id: documentoId,
        nome: doc,
        data,
        tamanhoMb: Math.round((0.2 + r() * 3.2) * 10) / 10,
      });
    }
    const h = String(2 + Math.floor(r() * 3)).padStart(2, "0");
    const m = String(Math.floor(r() * 60)).padStart(2, "0");
    andamentos.push({ id: aid, data: `${data}T${h}:${m}:00`, texto, documentoId });
    data = somarDiasUteis(data, -(4 + Math.floor(r() * 14)));
  }
  documentos.unshift({
    id: `${id}-integra`,
    nome: "Íntegra do processo",
    data: ultimoEm,
    tamanhoMb: Math.round((2 + r() * 37) * 10) / 10,
  });
  return { andamentos, documentos };
}

function capturaOk(): Captura {
  return { status: "ok", ultimaConsulta: `${HOJE}T03:12:00` };
}

interface Heroi {
  id: string;
  seq: number;
  tribunal: string;
  vara: string;
  autor: string;
  reu: string;
  assunto: string;
  fase: Fase;
  responsavelId: string;
  segredo?: boolean;
  faseManual?: boolean;
  andamentos: [string, string, string?][]; // data, texto, documento (mais recente primeiro)
  prazos?: [string, string][];
  resumo: string;
  resumoEm?: string;
  integraMb: number;
}

// Processos escritos à mão: são os que contam a história de cada cenário na apresentação.
const HEROIS: Heroi[] = [
  {
    id: "contrarrazoes",
    seq: 801234,
    tribunal: "TJRN",
    vara: "2º Juizado Especial Cível de Natal",
    autor: "Helena Prado Marinho",
    reu: AEREAS[0],
    assunto: "Atraso de voo",
    fase: "Recurso",
    responsavelId: "carla",
    andamentos: [
      ["2026-11-11T03:22:00", "Intimação para contrarrazões ao recurso inominado", "Intimação"],
      ["2026-11-04T03:18:00", "Recurso inominado interposto pela ré", "Recurso inominado"],
      ["2026-10-14T03:30:00", "Sentença de procedência publicada", "Sentença"],
      ["2026-09-22T03:11:00", "Audiência realizada, sem acordo", "Ata de audiência"],
      ["2026-08-05T03:40:00", "Contestação juntada pela ré", "Contestação"],
      ["2026-06-30T03:05:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    prazos: [["2026-11-18", "Contrarrazões ao recurso inominado"]],
    resumo:
      "Voo NTJ-4417, Natal–Guarulhos, chegou 9h20 depois do previsto, e a autora perdeu um compromisso de trabalho. A sentença condenou a ré a pagar R$ 6.000,00 por danos morais. A ré recorreu alegando manutenção não programada, sem juntar laudo técnico. As contrarrazões vencem amanhã; o ponto central é a falta de prova da excludente.",
    integraMb: 38.4,
  },
  {
    id: "replica-3du",
    seq: 4512,
    tribunal: "TJSC",
    vara: "1º Juizado Especial Cível de Florianópolis",
    autor: "Rafael Nogueira Dantas",
    reu: AEREAS[1],
    assunto: "Cancelamento de voo",
    fase: "Réplica",
    responsavelId: "carla",
    andamentos: [
      ["2026-11-13T03:09:00", "Intimação para manifestação sobre a contestação", "Intimação"],
      ["2026-11-06T03:41:00", "Contestação juntada pela ré", "Contestação"],
      ["2026-10-08T03:15:00", "Audiência de conciliação realizada, sem acordo", "Ata de audiência"],
      ["2026-08-19T03:27:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    prazos: [["2026-11-23", "Réplica à contestação"]],
    resumo:
      "Voo cancelado na véspera da viagem, sem reacomodação em tempo razoável; o autor comprou outra passagem por R$ 1.840,00. A ré contesta alegando condições climáticas, mas o boletim juntado se refere ao dia seguinte ao voo. A réplica vence em 23/11; a sexta, 20/11, é feriado e não conta.",
    integraMb: 12.6,
  },
  {
    id: "audiencia-hoje",
    seq: 1129087,
    tribunal: "TJSP",
    vara: "3ª Vara do Juizado Especial Cível de São Paulo",
    autor: "Marina Tavares Leal",
    reu: AEREAS[2],
    assunto: "Atraso de voo",
    fase: "Audiência",
    responsavelId: "carla",
    andamentos: [
      ["2026-11-17T03:14:00", "Designada audiência de conciliação para 10/12/2026, às 14h30", "Despacho de designação"],
      ["2026-10-28T03:50:00", "Contestação juntada pela ré", "Contestação"],
      ["2026-09-16T03:36:00", "Aviso de recebimento da citação juntado", "AR da citação"],
      ["2026-09-01T03:08:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    resumo:
      "Voo com atraso de 11 horas em conexão internacional, com pernoite no aeroporto sem assistência material. A ré contestou alegando tráfego aéreo. Hoje foi capturada a designação da audiência de conciliação para 10/12/2026, às 14h30; por isso o processo passou para a coluna Audiência.",
    resumoEm: "2026-11-17T03:16:00",
    integraMb: 7.9,
  },
  {
    id: "intimacao-hoje",
    seq: 23781,
    tribunal: "TJPR",
    vara: "Juizado Especial Cível de Londrina",
    autor: "Tiago Fontes Barros",
    reu: AEREAS[3],
    assunto: "Cancelamento de voo",
    fase: "Contestação",
    responsavelId: "carla",
    andamentos: [
      ["2026-11-17T03:31:00", "Intimação para manifestação sobre documentos juntados pela ré", "Intimação"],
      ["2026-11-09T03:12:00", "Contestação juntada pela ré", "Contestação"],
      ["2026-09-29T03:20:00", "Citação da ré expedida", "Mandado de citação"],
      ["2026-09-10T03:44:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    resumo:
      "Voo Londrina–Recife cancelado duas horas antes do embarque; o autor chegou um dia depois e perdeu a primeira diária do hotel. Hoje saiu intimação para manifestação sobre os documentos juntados pela ré. Ainda não há prazo registrado para essa intimação.",
    resumoEm: "2026-11-17T03:33:00",
    integraMb: 4.3,
  },
  {
    id: "manual-replica",
    seq: 77310,
    tribunal: "TJBA",
    vara: "5º Juizado Especial Cível de Salvador",
    autor: "Beatriz Moraes Coutinho",
    reu: AEREAS[0],
    assunto: "Preterição de embarque",
    fase: "Réplica",
    faseManual: true,
    responsavelId: "carla",
    andamentos: [
      ["2026-11-03T03:29:00", "Contestação juntada pela ré", "Contestação"],
      ["2026-09-24T03:17:00", "Aviso de recebimento da citação juntado", "AR da citação"],
      ["2026-09-03T03:02:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    prazos: [["2026-11-25", "Réplica à contestação"]],
    resumo:
      "Passageira impedida de embarcar por excesso de reservas, reacomodada só no dia seguinte. A ré admite a preterição e discute apenas o valor. Carla moveu o processo à mão para Réplica; ele fica ali até o próximo andamento capturado (RN09).",
    integraMb: 3.1,
  },
  {
    id: "segredo-carla",
    seq: 66204,
    tribunal: "TJMG",
    vara: "Juizado Especial Cível de Belo Horizonte",
    autor: "M. S. C. (menor, representada)",
    reu: AEREAS[1],
    assunto: "Atraso de voo",
    fase: "Audiência",
    segredo: true,
    responsavelId: "carla",
    andamentos: [
      ["2026-11-05T03:33:00", "Audiência de conciliação designada", "Despacho de designação"],
      ["2026-10-02T03:10:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    resumo:
      "Menor desacompanhada que ficou 7 horas no aeroporto de conexão sem o serviço de assistência contratado. O processo tramita em segredo de justiça: fica visível só para a responsável e o administrador (RN03).",
    integraMb: 2.2,
  },
  {
    id: "julia-prazo",
    seq: 918,
    tribunal: "TJRS",
    vara: "2º Juizado Especial Cível de Porto Alegre",
    autor: "Larissa Pacheco Maia",
    reu: AEREAS[2],
    assunto: "Extravio de bagagem",
    fase: "Distribuído",
    responsavelId: "julia",
    andamentos: [
      ["2026-11-17T02:58:00", "Despacho: emendar a inicial com a declaração de bagagem", "Despacho"],
      ["2026-11-10T03:24:00", "Processo distribuído por sorteio", "Petição inicial"],
    ],
    prazos: [["2026-11-19", "Emenda à inicial"]],
    resumo:
      "Bagagem extraviada por 6 dias em viagem de férias. O juízo mandou emendar a inicial com a declaração de bagagem. A emenda vence em 2 dias úteis.",
    resumoEm: "2026-11-17T03:01:00",
    integraMb: 1.4,
  },
];

function construirHeroi(h: Heroi): Processo {
  const t = TRIBUNAIS.find((x) => x.sigla === h.tribunal)!;
  const documentos: Documento[] = [
    { id: `${h.id}-integra`, nome: "Íntegra do processo", data: h.andamentos[0][0].slice(0, 10), tamanhoMb: h.integraMb },
  ];
  const andamentos: Andamento[] = h.andamentos.map(([data, texto, doc], i) => {
    let documentoId: string | undefined;
    if (doc) {
      documentoId = `${h.id}-d${i}`;
      documentos.push({ id: documentoId, nome: doc, data: data.slice(0, 10), tamanhoMb: Math.round((0.4 + i * 0.7) * 10) / 10 });
    }
    return { id: `${h.id}-a${i}`, data, texto, documentoId };
  });
  return {
    id: h.id,
    cnj: montarCnj(h.seq, 2026, t.tr, t.orgao),
    tribunal: h.tribunal,
    sistema: t.sistema,
    vara: h.vara,
    autor: h.autor,
    reu: h.reu,
    assunto: h.assunto,
    responsavelId: h.responsavelId,
    fase: h.fase,
    faseManual: h.faseManual ?? false,
    segredo: h.segredo ?? false,
    captura: capturaOk(),
    andamentos,
    documentos,
    prazos: (h.prazos ?? []).map(([vencimento, descricao], i) => ({
      id: `${h.id}-p${i}`,
      descricao,
      vencimento,
      concluido: false,
      registradoPor: h.responsavelId,
    })),
    resumo: h.resumo,
    resumoEm: h.resumoEm ?? h.andamentos[0][0],
  };
}

function gerarProcessos(): Processo[] {
  const r = mulberry32(20261117);
  const lista: Processo[] = HEROIS.map(construirHeroi);
  const distribuicao: [string | null, number][] = [
    ["carla", 62],
    ["ana", 52],
    ["marcos", 46],
    ["ricardo", 20],
    ["julia", 17],
    ["bruno", 18],
  ];
  const donos: (string | null)[] = distribuicao.flatMap(([id, n]) => Array<string | null>(n).fill(id));
  donos.push(...Array<null>(12).fill(null)); // órfãos de Pedro Nunes, desativado em 10/11 (RN07)

  donos.forEach((dono, i) => {
    const id = `p${String(i + 1).padStart(3, "0")}`;
    const t = TRIBUNAIS[Math.floor(r() * TRIBUNAIS.length)];
    const fase = ponderado(r, PESO_FASES);
    const autor = `${NOMES[Math.floor(r() * NOMES.length)]} ${SOBRENOMES[Math.floor(r() * SOBRENOMES.length)]} ${SOBRENOMES[Math.floor(r() * SOBRENOMES.length)]}`;
    const reu = AEREAS[Math.floor(r() * AEREAS.length)];
    const assunto = ponderado(r, ASSUNTOS);
    const ano = r() < 0.7 ? 2026 : 2025;
    const ultimoEm = somarDiasUteis(HOJE, -(1 + Math.floor(r() * 45)));
    const { andamentos, documentos } = construirLinhaDoTempo(id, fase, ultimoEm, r);
    const prazos: Prazo[] = [];
    const providencia = PROVIDENCIA[fase];
    if (providencia && r() < 0.32) {
      // Prazos da Carla ficam mais adiante: os próximos dela são os dos processos escritos à mão.
      const min = dono === "carla" ? 8 : 1;
      prazos.push({
        id: `${id}-p0`,
        descricao: providencia,
        vencimento: somarDiasUteis(HOJE, min + Math.floor(r() * 18)),
        concluido: false,
        registradoPor: dono ?? "pedro",
      });
    }
    const p: Processo = {
      id,
      cnj: montarCnj(100000 + Math.floor(r() * 8900000), ano, t.tr, t.orgao),
      tribunal: t.sigla,
      sistema: t.sistema,
      vara: `${1 + Math.floor(r() * 6)}º Juizado Especial Cível de ${t.cidade}`,
      autor,
      reu,
      assunto,
      responsavelId: dono,
      fase,
      faseManual: false,
      segredo: i % 41 === 40,
      captura: capturaOk(),
      andamentos,
      documentos,
      prazos,
      resumo: "",
      resumoEm: andamentos[0].data,
    };
    p.resumo = resumoPadrao(p);
    lista.push(p);
  });

  // Mais quatro movimentações da madrugada, com os outros responsáveis (sete no total).
  [
    ["ana", "Sentença de procedência publicada", "Sentença"],
    ["ana", "Certidão de intimação das partes para a audiência"],
    ["marcos", "Contestação juntada pela ré", "Contestação"],
    ["ricardo", "Conclusos para sentença"],
  ].forEach(([dono, texto, doc], i) => {
    const p = lista.find(
      (x) =>
        x.responsavelId === dono &&
        x.fase !== "Arquivado" &&
        !x.segredo &&
        x.sistema !== "e-SAJ" &&
        x.sistema !== "Projudi" &&
        !x.andamentos.some((a) => a.data.startsWith(HOJE)),
    )!;
    const documentoId = doc ? `${p.id}-hoje${i}` : undefined;
    const data = `${HOJE}T03:${String(5 + i * 9).padStart(2, "0")}:00`;
    if (doc) p.documentos.unshift({ id: documentoId!, nome: doc, data: HOJE, tamanhoMb: 0.9 });
    p.andamentos.unshift({ id: `${p.id}-hoje-a${i}`, data, texto, documentoId });
    p.resumo = resumoPadrao(p);
    p.resumoEm = data;
  });

  // Falhas de captura da madrugada (F13, RN08, RN19).
  const pendente = (p: Processo, motivo: MotivoFalha, tentativas: number) => {
    p.captura = { status: "pendente", ultimaConsulta: "2026-11-16T03:12:00", motivo, tentativas };
  };
  const semMovimentoHoje = (p: Processo) => !p.andamentos.some((a) => a.data.startsWith(HOJE));
  lista
    .filter((p) => p.tribunal === "TJAL" && semMovimentoHoje(p))
    .forEach((p) => pendente(p, "fora_do_ar", 10));
  lista
    .filter((p) => p.sistema === "Projudi" && p.responsavelId === "marcos" && semMovimentoHoje(p))
    .forEach((p) => pendente(p, "acesso_invalido", 1));
  lista
    .filter((p) => p.tribunal === "TJBA" && p.responsavelId === "ana" && semMovimentoHoje(p))
    .slice(0, 3)
    .forEach((p) => pendente(p, "captcha", 10));
  lista
    .filter((p) => p.tribunal === "TJRS" && p.responsavelId === "ricardo" && semMovimentoHoje(p))
    .slice(0, 1)
    .forEach((p) => pendente(p, "erro_site", 10));

  return lista;
}

function gerarAcessos(): Acesso[] {
  const acessos: Acesso[] = [];
  for (const u of USUARIOS.filter((x) => x.papel !== "estagiario")) {
    for (const sistema of SISTEMAS) {
      let status: Acesso["status"] = "valido";
      if (u.id === "marcos" && sistema === "Projudi") status = "expirado";
      if (u.id === "ana" && sistema === "e-SAJ") status = "nao_cadastrado";
      acessos.push({
        usuarioId: u.id,
        sistema,
        login: status === "nao_cadastrado" ? "" : u.email.split("@")[0],
        status,
        atualizadoEm: status === "expirado" ? "2026-05-12" : "2026-10-26",
      });
    }
  }
  return acessos;
}

function gerarHistorico(processos: Processo[]): RegistroHistorico[] {
  const orfaos = processos.filter((p) => p.responsavelId === null);
  const proc = (id: string) => processos.find((p) => p.id === id)!;
  const reg = (
    em: string,
    usuarioId: string,
    p: Processo | null,
    campo: string,
    anterior: string,
    novo: string,
  ): RegistroHistorico => ({
    id: `h-${em}-${campo}-${p?.id ?? usuarioId}`,
    em,
    usuarioId,
    processoId: p?.id,
    processoCnj: p?.cnj,
    campo,
    anterior,
    novo,
  });
  return [
    reg("2026-11-17T03:31:00", "sistema", proc("intimacao-hoje"), "Resumo por IA", "Versão de 09/11", "Refeito após nova movimentação"),
    reg("2026-11-17T03:14:00", "sistema", proc("audiencia-hoje"), "Coluna do quadro", "Contestação", "Audiência"),
    reg("2026-11-16T17:42:00", "carla", proc("manual-replica"), "Coluna do quadro", "Contestação", "Réplica (manual)"),
    reg("2026-11-16T11:05:00", "ricardo", null, "Acesso de referência", "Não definido", "Carla Mendes"),
    reg("2026-11-13T09:47:00", "carla", proc("replica-3du"), "Prazo", "Sem prazo", "Réplica à contestação, 23/11/2026"),
    reg("2026-11-11T10:20:00", "carla", proc("contrarrazoes"), "Prazo", "Sem prazo", "Contrarrazões, 18/11/2026"),
    ...orfaos.map((p) => reg("2026-11-10T18:02:00", "ricardo", p, "Responsável", "Pedro Nunes", "Sem responsável")),
    reg("2026-11-10T18:02:00", "ricardo", null, "Usuário Pedro Nunes", "Ativo", "Desativado"),
    reg("2026-11-06T15:33:00", "julia", proc("julia-prazo"), "Responsável", "Carla Mendes", "Júlia Rocha"),
    reg("2026-10-30T09:12:00", "ricardo", null, "Usuário Bruno Teles", "", "Cadastrado"),
  ];
}

export interface DadosIniciais {
  usuarios: Usuario[];
  acessos: Acesso[];
  processos: Processo[];
  historico: RegistroHistorico[];
}

export function dadosIniciais(): DadosIniciais {
  const processos = gerarProcessos();
  return {
    usuarios: USUARIOS.map((u) => ({ ...u })),
    acessos: gerarAcessos(),
    processos,
    historico: gerarHistorico(processos),
  };
}

/** Planilha de exemplo da importação (F15). Colunas ilustrativas, a confirmar com o escritório. */
export function planilhaExemplo(cnjExistente: string) {
  const sc = TRIBUNAIS.find((t) => t.sigla === "TJSC")!;
  const sp = TRIBUNAIS.find((t) => t.sigla === "TJSP")!;
  const rn = TRIBUNAIS.find((t) => t.sigla === "TJRN")!;
  return [
    { cnj: montarCnj(9100211, 2026, sc.tr, sc.orgao), tribunal: "TJSC", autor: "Vanessa Guedes Freitas", reu: AEREAS[0], assunto: "Atraso de voo" },
    { cnj: montarCnj(9100298, 2026, sp.tr, sp.orgao), tribunal: "TJSP", autor: "Caio Bastos Aragão", reu: AEREAS[2], assunto: "Cancelamento de voo" },
    { cnj: "0812-33.2026.8.20.5001", tribunal: "TJRN", autor: "Sérgio Queiroz Maia", reu: AEREAS[1], assunto: "Atraso de voo" },
    { cnj: montarCnj(9100345, 2026, rn.tr, rn.orgao), tribunal: "TJRN", autor: "Daniela Sampaio Leal", reu: AEREAS[3], assunto: "Perda de conexão" },
    { cnj: cnjExistente, tribunal: "TJRN", autor: "Helena Prado Marinho", reu: AEREAS[0], assunto: "Atraso de voo" },
    { cnj: montarCnj(9100402, 2026, sc.tr, sc.orgao), tribunal: "TJSC", autor: "Murilo Teixeira Dantas", reu: AEREAS[1], assunto: "Extravio de bagagem" },
  ];
}
