# Acompanhamento processual: protótipo navegável

Protótipo de um sistema de acompanhamento processual para escritórios de advocacia.
Só tem frontend: não há backend, e-mail, IA nem consulta real aos tribunais. Todos os dados são fictícios.

## Rodar

Requer Node 22 ou mais novo.

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # checa os tipos e gera dist/
npm run preview  # serve dist/ localmente
```

## Publicar

O site é publicado como Cloudflare Worker de arquivos estáticos, conectado a este repositório: cada push na `main`
gera uma nova versão.

| Configuração | Valor |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

O `wrangler.toml` aponta para `dist/` e faz as rotas da aplicação funcionarem ao recarregar a página.

O login da demonstração não é uma autenticação real. Para restringir o acesso, configure a proteção na hospedagem.
Não use dados reais neste protótipo.

## Como a demo funciona

- **Relógio fixo:** "hoje" é sempre terça, 17/11/2026 (`src/domain/dates.ts`), para os prazos e os cenários
  ficarem coerentes em qualquer dia.
- **Barra inferior:** troca de perfil, simulação de uma nova consulta aos tribunais e restauração dos dados.
- **Persistência:** as ações ficam no `localStorage` do navegador e não são compartilhadas entre pessoas.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `src/domain` | Regras de negócio: dias úteis, número CNJ, permissões e avisos |
| `src/data/seed.ts` | Dados fictícios: processos escritos à mão para os cenários, mais os gerados |
| `src/store` | Estado da demo |
| `src/pages`, `src/components` | Telas e componentes |
