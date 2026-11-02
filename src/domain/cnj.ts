const PADRAO = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;

export function digitosCnj(seq: string, ano: string, j: string, tr: string, orgao: string): string {
  const base = BigInt(`${seq}${ano}${j}${tr}${orgao}00`);
  return String(98n - (base % 97n)).padStart(2, "0");
}

export function montarCnj(seq: number, ano: number, tr: string, orgao: string): string {
  const s = String(seq).padStart(7, "0");
  const dd = digitosCnj(s, String(ano), "8", tr, orgao);
  return `${s}-${dd}.${ano}.8.${tr}.${orgao}`;
}

/** RN14: valida formato e dígitos verificadores do número CNJ. */
export function validarCnj(numero: string): string | null {
  const m = numero.trim().match(PADRAO);
  if (!m) return "Use o padrão CNJ: 0000000-00.0000.0.00.0000.";
  const [, seq, dd, ano, j, tr, orgao] = m;
  if (digitosCnj(seq, ano, j, tr, orgao) !== dd) {
    return "Os dígitos verificadores não conferem. Confira o número no tribunal.";
  }
  return null;
}
