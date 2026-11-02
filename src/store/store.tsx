import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dadosIniciais, planilhaExemplo, resumoPadrao, TEMPLATES, TRIBUNAIS, type DadosIniciais } from "../data/seed";
import { validarCnj } from "../domain/cnj";
import { AGORA, dataCurta, HOJE } from "../domain/dates";
import { podeVer } from "../domain/permissoes";
import { FASES, PAPEL_LABEL, type Fase, type Papel, type Processo, type RegistroHistorico, type Sistema, type Usuario } from "../domain/types";

const CHAVE = "bezerril-poc-v1";

export interface Estado extends DadosIniciais {
  usuarioAtualId: string | null;
  alertasLidos: string[];
  acessoReferenciaId: string; // RN11: proposta da equipe
  consultasExtras: number;
}

export interface NovoProcesso {
  cnj: string;
  tribunal: string;
  vara: string;
  autor: string;
  reu: string;
  assunto: string;
  responsavelId: string;
  segredo: boolean;
}

export interface LinhaImportacao {
  cnj: string;
  autor: string;
  motivo?: string;
}

function estadoInicial(): Estado {
  return {
    ...dadosIniciais(),
    usuarioAtualId: null,
    alertasLidos: [],
    acessoReferenciaId: "carla",
    consultasExtras: 0,
  };
}

function carregar(): Estado {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo) as Estado;
  } catch {
    // Navegação privada ou dado corrompido: segue com o estado inicial.
  }
  return estadoInicial();
}

let contador = 0;
const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}-${++contador}`;

// O relógio da demo é fixo, mas as ações da apresentação avançam alguns minutos para ordenar o histórico.
function carimbo(): string {
  const d = new Date(`${AGORA}`);
  d.setMinutes(d.getMinutes() + contador);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${HOJE}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

export function nomeUsuario(estado: Pick<Estado, "usuarios">, id: string | null | undefined): string {
  if (id === "sistema") return "Sistema";
  if (!id) return "Sem responsável";
  return estado.usuarios.find((u) => u.id === id)?.nome ?? "Desconhecido";
}

export function validarNovoCnj(estado: Pick<Estado, "processos">, cnj: string): string | null {
  const erro = validarCnj(cnj);
  if (erro) return erro;
  if (estado.processos.some((p) => p.cnj === cnj.trim())) return "Este número já está cadastrado no escritório.";
  return null;
}

function useStoreInterno() {
  const [estado, setEstado] = useState<Estado>(carregar);
  const [aviso, setAviso] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      // Sem armazenamento: a demo continua funcionando até recarregar a página.
    }
  }, [estado]);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAviso(null), 5200);
  }, []);

  const usuario = estado.usuarios.find((u) => u.id === estado.usuarioAtualId) ?? null;
  const processosVisiveis = useMemo(
    () => (usuario ? estado.processos.filter((p) => podeVer(usuario, p)) : []),
    [estado.processos, usuario],
  );

  const acoes = useMemo(() => {
    const atualizar = (fn: (e: Estado) => Estado) => setEstado(fn);

    const registro = (
      e: Estado,
      campo: string,
      anterior: string,
      novo: string,
      p?: Processo,
      autor?: string,
    ): RegistroHistorico => ({
      id: novoId("h"),
      em: carimbo(),
      usuarioId: autor ?? e.usuarioAtualId ?? "sistema",
      processoId: p?.id,
      processoCnj: p?.cnj,
      campo,
      anterior,
      novo,
    });

    const mudarProcesso = (e: Estado, id: string, fn: (p: Processo) => Processo): Estado => ({
      ...e,
      processos: e.processos.map((p) => (p.id === id ? fn(p) : p)),
    });

    return {
      entrar(id: string) {
        atualizar((e) => ({ ...e, usuarioAtualId: id }));
      },
      sair() {
        atualizar((e) => ({ ...e, usuarioAtualId: null }));
      },
      resetar() {
        setEstado((e) => ({ ...estadoInicial(), usuarioAtualId: e.usuarioAtualId }));
        avisar("Demo restaurada ao estado inicial.");
      },

      moverFase(id: string, fase: Fase) {
        atualizar((e) => {
          const p = e.processos.find((x) => x.id === id);
          if (!p || p.fase === fase) return e;
          const h = registro(e, "Coluna do quadro", p.fase, `${fase} (manual)`, p);
          return {
            ...mudarProcesso(e, id, (x) => ({ ...x, fase, faseManual: true })),
            historico: [h, ...e.historico],
          };
        });
      },

      reatribuir(ids: string[], novoResponsavelId: string) {
        atualizar((e) => {
          let n = e;
          const novos: RegistroHistorico[] = [];
          for (const id of ids) {
            const p = n.processos.find((x) => x.id === id);
            if (!p || p.responsavelId === novoResponsavelId) continue;
            novos.push(registro(n, "Responsável", nomeUsuario(n, p.responsavelId), nomeUsuario(n, novoResponsavelId), p));
            n = mudarProcesso(n, id, (x) => ({ ...x, responsavelId: novoResponsavelId }));
          }
          return { ...n, historico: [...novos, ...n.historico] };
        });
      },

      registrarPrazo(id: string, descricao: string, vencimento: string) {
        atualizar((e) => {
          const p = e.processos.find((x) => x.id === id);
          if (!p) return e;
          const h = registro(e, "Prazo", "Sem prazo", `${descricao}, ${dataCurta(vencimento)}`, p);
          return {
            ...mudarProcesso(e, id, (x) => ({
              ...x,
              prazos: [
                ...x.prazos,
                { id: novoId("pz"), descricao, vencimento, concluido: false, registradoPor: e.usuarioAtualId ?? "" },
              ],
            })),
            historico: [h, ...e.historico],
          };
        });
      },

      concluirPrazo(id: string, prazoId: string) {
        atualizar((e) => {
          const p = e.processos.find((x) => x.id === id);
          const pz = p?.prazos.find((x) => x.id === prazoId);
          if (!p || !pz) return e;
          const h = registro(e, "Prazo", `${pz.descricao}, em aberto`, "Cumprido", p);
          return {
            ...mudarProcesso(e, id, (x) => ({
              ...x,
              prazos: x.prazos.map((z) => (z.id === prazoId ? { ...z, concluido: true } : z)),
            })),
            historico: [h, ...e.historico],
          };
        });
      },

      cadastrarProcesso(dados: NovoProcesso): string {
        const id = novoId("novo");
        atualizar((e) => {
          const t = TRIBUNAIS.find((x) => x.sigla === dados.tribunal)!;
          const p: Processo = {
            id,
            cnj: dados.cnj.trim(),
            tribunal: dados.tribunal,
            sistema: t.sistema,
            vara: dados.vara || `Juizado Especial Cível de ${t.cidade}`,
            autor: dados.autor,
            reu: dados.reu,
            assunto: dados.assunto,
            responsavelId: dados.responsavelId,
            fase: "Distribuído",
            faseManual: false,
            segredo: dados.segredo,
            captura: { status: "ok", ultimaConsulta: "" },
            andamentos: [],
            documentos: [],
            prazos: [],
            resumo: "O resumo será gerado depois da primeira consulta, que baixa o processo completo (RN13).",
            resumoEm: "",
          };
          return {
            ...e,
            processos: [p, ...e.processos],
            historico: [registro(e, "Cadastro de processo", "", dados.autor, p), ...e.historico],
          };
        });
        return id;
      },

      salvarUsuario(dados: { id?: string; nome: string; email: string; papel: Papel }) {
        atualizar((e) => {
          if (dados.id) {
            const antes = e.usuarios.find((u) => u.id === dados.id)!;
            const hist =
              antes.papel !== dados.papel
                ? [registro(e, `Perfil de ${antes.nome}`, PAPEL_LABEL[antes.papel], PAPEL_LABEL[dados.papel]), ...e.historico]
                : e.historico;
            return {
              ...e,
              usuarios: e.usuarios.map((u) => (u.id === dados.id ? { ...u, ...dados, id: u.id } : u)),
              historico: hist,
            };
          }
          const novo: Usuario = { id: novoId("u"), nome: dados.nome, email: dados.email, papel: dados.papel, ativo: true };
          return {
            ...e,
            usuarios: [...e.usuarios, novo],
            historico: [registro(e, `Usuário ${novo.nome}`, "", "Cadastrado"), ...e.historico],
          };
        });
      },

      // RN07: os processos do usuário desativado vão para a fila de redistribuição.
      alternarAtivo(id: string) {
        atualizar((e) => {
          const u = e.usuarios.find((x) => x.id === id)!;
          const ativo = !u.ativo;
          const hist: RegistroHistorico[] = [
            registro(e, `Usuário ${u.nome}`, ativo ? "Desativado" : "Ativo", ativo ? "Ativo" : "Desativado"),
          ];
          let processos = e.processos;
          if (!ativo) {
            processos = e.processos.map((p) => {
              if (p.responsavelId !== id) return p;
              hist.push(registro(e, "Responsável", u.nome, "Sem responsável", p));
              return { ...p, responsavelId: null };
            });
          }
          return {
            ...e,
            processos,
            acessoReferenciaId:
              !ativo && e.acessoReferenciaId === id
                ? (e.usuarios.find((x) => x.ativo && x.id !== id && x.papel !== "estagiario")?.id ?? e.acessoReferenciaId)
                : e.acessoReferenciaId,
            usuarios: e.usuarios.map((x) => (x.id === id ? { ...x, ativo } : x)),
            historico: [...hist, ...e.historico],
          };
        });
      },

      definirAcessoReferencia(id: string) {
        atualizar((e) => ({
          ...e,
          acessoReferenciaId: id,
          historico: [
            registro(e, "Acesso de referência", nomeUsuario(e, e.acessoReferenciaId), nomeUsuario(e, id)),
            ...e.historico,
          ],
        }));
      },

      salvarAcesso(sistema: Sistema, login: string) {
        atualizar((e) => {
          const uid = e.usuarioAtualId!;
          return {
            ...e,
            acessos: e.acessos.map((a) =>
              a.usuarioId === uid && a.sistema === sistema
                ? { ...a, login, status: "valido", atualizadoEm: HOJE }
                : a,
            ),
            // O conteúdo da senha nunca entra no histórico; só o fato de ter sido atualizada.
            historico: [registro(e, `Acesso ao ${sistema}`, "Credencial anterior", "Credencial atualizada"), ...e.historico],
          };
        });
      },

      marcarLido(ids: string[]) {
        atualizar((e) => ({ ...e, alertasLidos: Array.from(new Set([...e.alertasLidos, ...ids])) }));
      },

      // Nova consulta de um processo sob demanda (CN03, item novo a confirmar com o cliente).
      consultarAgora(id: string) {
        atualizar((e) =>
          mudarProcesso(e, id, (p) => {
            if (p.captura.motivo === "acesso_invalido") return p;
            return { ...p, captura: { status: "ok", ultimaConsulta: carimbo() } };
          }),
        );
      },

      // Roda uma consulta completa de mentira: prova RN08, RN09, RN19 e RN23 ao vivo na apresentação.
      simularConsulta() {
        const e = estadoRef.current;
        const em = carimbo();
        const papelAtual = e.usuarios.find((u) => u.id === e.usuarioAtualId)?.papel;
        const expirados = new Set(e.acessos.filter((a) => a.status !== "valido").map((a) => `${a.usuarioId}:${a.sistema}`));
        const hist: RegistroHistorico[] = [];

        // Processo movido à mão vem primeiro: é o que mostra a RN09 em ação. Os demais não podem
        // ter prazo aberto nem andamento de hoje, para não contradizer a história dos cenários.
        const candidatos = e.processos
          .filter(
            (p) =>
              p.fase !== "Arquivado" &&
              p.fase !== "Recurso" &&
              p.captura.status === "ok" &&
              (papelAtual === "admin" || p.responsavelId === e.usuarioAtualId) &&
              (p.faseManual ||
                (p.andamentos.length > 0 &&
                  p.prazos.every((z) => z.concluido) &&
                  !p.andamentos.some((a) => a.data.startsWith(HOJE)))),
          )
          .sort((a, b) => Number(b.faseManual) - Number(a.faseManual));
        const escolhidos = new Set(candidatos.slice(0, 3).map((p) => p.id));

        let liberados = 0;
        const processos = e.processos.map((p) => {
          let n = p;
          if (p.captura.status === "pendente") {
            const bloqueado = p.responsavelId && expirados.has(`${p.responsavelId}:${p.sistema}`);
            if (!bloqueado) {
              liberados++;
              n = { ...n, captura: { status: "ok", ultimaConsulta: em } };
            }
          }
          if (!escolhidos.has(p.id)) return n;
          const proxima = FASES[FASES.indexOf(p.fase) + 1] as Fase;
          const [texto, doc] = TEMPLATES[proxima][0];
          const documentoId = doc ? novoId("d") : undefined;
          const andamentos = [{ id: novoId("a"), data: em, texto, documentoId }, ...p.andamentos];
          const documentos = doc
            ? [{ id: documentoId!, nome: doc, data: HOJE, tamanhoMb: 0.8 }, ...p.documentos]
            : p.documentos;
          hist.push(registro(e, "Coluna do quadro", p.fase, proxima, p, "sistema"));
          hist.push(registro(e, "Resumo por IA", "Versão anterior", "Refeito após nova movimentação", p, "sistema"));
          const atualizado = { ...n, andamentos, documentos, fase: proxima, faseManual: false, resumoEm: em };
          return { ...atualizado, resumo: resumoPadrao(atualizado) };
        });
        setEstado({ ...e, processos, historico: [...hist, ...e.historico], consultasExtras: e.consultasExtras + 1 });
        avisar(`Consulta concluída: ${escolhidos.size} processos com andamento novo, ${liberados} saíram de captura pendente.`);
      },

      importarExemplo(): { aceitas: LinhaImportacao[]; rejeitadas: LinhaImportacao[] } {
        const existente = estado.processos[0].cnj;
        const aceitas: LinhaImportacao[] = [];
        const rejeitadas: LinhaImportacao[] = [];
        const novos: Processo[] = [];
        const cnjs = new Set(estado.processos.map((p) => p.cnj));
        for (const l of planilhaExemplo(existente)) {
          const erro = validarCnj(l.cnj) ?? (cnjs.has(l.cnj) ? "Número já cadastrado." : null);
          if (erro) {
            rejeitadas.push({ cnj: l.cnj, autor: l.autor, motivo: erro });
            continue;
          }
          cnjs.add(l.cnj);
          aceitas.push({ cnj: l.cnj, autor: l.autor });
          const t = TRIBUNAIS.find((x) => x.sigla === l.tribunal)!;
          novos.push({
            id: novoId("imp"),
            cnj: l.cnj,
            tribunal: t.sigla,
            sistema: t.sistema,
            vara: `Juizado Especial Cível de ${t.cidade}`,
            autor: l.autor,
            reu: l.reu,
            assunto: l.assunto,
            responsavelId: null,
            fase: "Distribuído",
            faseManual: false,
            segredo: false,
            captura: { status: "ok", ultimaConsulta: "" },
            andamentos: [],
            documentos: [],
            prazos: [],
            resumo: "O resumo será gerado depois da primeira consulta, que baixa o processo completo (RN13).",
            resumoEm: "",
          });
        }
        atualizar((e) => ({
          ...e,
          processos: [...novos, ...e.processos],
          historico: [
            registro(e, "Importação de planilha", "", `${aceitas.length} importados, ${rejeitadas.length} rejeitados`),
            ...e.historico,
          ],
        }));
        return { aceitas, rejeitadas };
      },
    };
  }, [avisar, estado.processos]);

  return { estado, usuario, processosVisiveis, aviso, avisar, ...acoes };
}

type Store = ReturnType<typeof useStoreInterno>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreInterno();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fora do StoreProvider");
  return s;
}

/** Usuário logado; as telas internas só renderizam com alguém autenticado. */
export function useUsuario(): Usuario {
  const { usuario } = useStore();
  if (!usuario) throw new Error("Sem usuário logado");
  return usuario;
}
