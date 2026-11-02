// A demo roda num relógio fixo para que os cenários (CN02, exemplo da RN04) fiquem
// sempre coerentes, em qualquer dia em que for apresentada.
export const HOJE = "2026-11-17";
export const AGORA = "2026-11-17T08:12:00";

// Feriados forenses ilustrativos; o calendário por tribunal está a confirmar (RN04).
const FERIADOS = new Set([
  "2026-11-02",
  "2026-11-15",
  "2026-11-20",
  "2026-12-08",
  "2026-12-25",
  "2027-01-01",
]);

function parse(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ehDiaUtil(iso: string): boolean {
  const d = parse(iso);
  const dow = d.getDay();
  return dow !== 0 && dow !== 6 && !FERIADOS.has(toIso(d));
}

/** Soma (ou subtrai) dias úteis a partir de uma data. */
export function somarDiasUteis(iso: string, dias: number): string {
  const d = parse(iso);
  const passo = dias < 0 ? -1 : 1;
  let restantes = Math.abs(dias);
  while (restantes > 0) {
    d.setDate(d.getDate() + passo);
    if (ehDiaUtil(toIso(d))) restantes--;
  }
  return toIso(d);
}

/** Dias úteis de hoje até a data; negativo quando já venceu. */
export function diasUteisAte(iso: string, de: string = HOJE): number {
  if (iso.slice(0, 10) === de) return 0;
  const inicio = parse(de);
  const fim = parse(iso);
  const passo = fim > inicio ? 1 : -1;
  let n = 0;
  const d = new Date(inicio);
  while (toIso(d) !== toIso(fim)) {
    d.setDate(d.getDate() + passo);
    if (ehDiaUtil(toIso(d))) n += passo;
  }
  return n;
}

/** Datas de aviso da RN12: 5, 3 e 1 dia útil antes do vencimento (RN04). */
export function datasDeAviso(vencimento: string): { dias: number; data: string }[] {
  return [5, 3, 1].map((dias) => ({ dias, data: somarDiasUteis(vencimento, -dias) }));
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function dataCurta(iso: string): string {
  const d = parse(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function dataSemAno(iso: string): string {
  const d = parse(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`;
}

export function diaDaSemana(iso: string): string {
  return DIAS[parse(iso).getDay()];
}

export function dataPorExtenso(iso: string): string {
  const d = parse(iso);
  const dia = DIAS[d.getDay()];
  const mes = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ][d.getMonth()];
  const sufixo = d.getDay() >= 1 && d.getDay() <= 5 ? "-feira" : "";
  return `${dia[0].toUpperCase()}${dia.slice(1)}${sufixo}, ${d.getDate()} de ${mes} de ${d.getFullYear()}`;
}

export function hora(iso: string): string {
  return iso.length > 10 ? iso.slice(11, 16) : "";
}

export function dataHora(iso: string): string {
  return `${dataCurta(iso)} ${hora(iso)}`.trim();
}

export function ehHoje(iso: string): boolean {
  return iso.slice(0, 10) === HOJE;
}

export function rotuloDiasUteis(n: number): string {
  if (n < 0) return `venceu há ${-n} d.u.`;
  if (n === 0) return "hoje";
  return `${n} d.u.`;
}
