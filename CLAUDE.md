# CLAUDE.md — Diário

Leia `ESCOPO.md` antes de qualquer tarefa. Ele é a fonte de verdade sobre o que construir.

## Sobre quem usa este projeto

A pessoa que programa é **designer e tem quase nenhuma experiência com programação**. Por isso:
- Explique em linguagem simples o que está fazendo e por quê, sem jargão não explicado.
- Faça mudanças pequenas e teste cada uma antes de seguir.
- Nunca rode comandos destrutivos (apagar pastas, `git reset --hard`, `git push --force`) sem explicar e pedir confirmação.
- Depois de cada etapa, diga como ver o resultado (por exemplo, "abra http://localhost:5173").

## Projeto

App de diário open source (PWA), mobile e desktop, dados 100% locais. Cada dia é um texto; humor, hora e lembretes são comandos escritos no texto.

## Stack

- React + Vite + TypeScript
- Armazenamento: IndexedDB (via biblioteca `idb`) ou `localStorage` no nível 1
- Testes: Vitest (obrigatório para o parser)
- Deploy: Vercel ou Netlify
- Sem backend, sem login, sem bibliotecas de UI prontas: os componentes seguem o design system do Figma

## Trabalho por níveis

Trabalhe **um nível por vez**, em uma branch própria (`nivel-1`, `nivel-2`, `nivel-3`, `nivel-4`), e marque uma tag ao final (`v1`, `v2`, `v3`, `v4`). Cada nível precisa estar publicado e funcionando antes de começar o próximo. **Não implemente nada de um nível futuro** enquanto o atual não estiver entregue.

## Regras do parser (`src/parser`)

Uma função pura: recebe o texto do dia e devolve blocos. Sem acesso a tela nem a armazenamento. Toda regra abaixo precisa ter teste.

- `humor/N`, com N de 1 a 5. `humor/1` e `humor/ 1` valem ambos.
- `hora/HH:MM` abre um bloco com horário.
- O dia sempre começa com um bloco sem horário.
- Só `hora/` abre um bloco com horário. Cada bloco tem no máximo um `humor/`.
- `hora/14:32` seguido de `humor/4` é um bloco só.
- Quando o usuário digita um `humor/` e o bloco atual já tem humor, o **editor** (não o parser) insere `hora/` com a hora atual antes do novo humor, abrindo um bloco novo. O parser continua puro: só lê o texto.
- O **botão** de humor age no bloco do cursor: se o bloco não tem humor, insere `humor/N`; se já tem, **troca** o valor. O botão nunca abre bloco novo.
- Caso limite (decidido): dois `humor/` no mesmo bloco sem `hora/` entre eles (texto colado ou editado de fora). O segundo abre um bloco novo sem horário, com aviso discreto.
- Comando inválido (`humor/7`, `humor/abc`) vira texto comum e é sinalizado com aviso discreto.
- `lembrete/` só entra no nível 3.

## Dados

- Um registro por dia: `{ data: "AAAA-MM-DD", texto: string }`.
- O texto é a única fonte de verdade. Os botões (humor, hora) apenas inserem ou substituem linhas no texto.
- Guarde o humor como número de 1 a 5, nunca como emoji.
- Os dados não podem ser perdidos: nunca sobrescreva um dia sem ter certeza.

## Design

- O design vem do Figma (ainda será feito). Quando existir, leia os componentes, cores e espaçamentos pelo conector do Figma e não invente estilos.
- Cores e espaçamentos ficam em variáveis CSS (`--mood-1` a `--mood-5` etc.), nunca fixos no meio do código.
- Mobile primeiro. Alvos de toque de pelo menos 44px.
- Não dependa só de cor: mantenha texto ou emoji junto do humor. Verifique contraste (WCAG AA).
- Degradê do calendário: use `linear-gradient(in oklch, ...)`. Direção e emojis serão decididos durante o desenvolvimento.

## Privacidade

Diário é conteúdo sensível. Não envie dados a nenhum servidor, não use analytics nem serviços de terceiros. Deixe claro no app e no README que os dados ficam só no aparelho e que não há criptografia (até haver).

## Open source

- Licença MIT (`LICENSE`).
- `README.md` em português: o que é, como rodar, como contribuir.
- Commits pequenos e com mensagens claras, em português.

## Mudanças no escopo

Quando uma regra ou decisão do escopo mudar, atualize `ESCOPO.md` e `CLAUDE.md` **juntos, na mesma alteração**, para os dois nunca ficarem contradizendo um ao outro.

**Peça confirmação antes de alterar.** Antes de editar qualquer um dos dois arquivos, mostre exatamente o que vai mudar (o trecho antigo e o novo, nos dois arquivos) e espere a aprovação explícita. Só depois edite, faça o commit (mensagem começando com `Escopo:`) e envie ao GitHub. Nunca altere o escopo por conta própria, nem como consequência de outra tarefa; se uma tarefa exigir mudar o escopo, pare e pergunte primeiro.

Depois de enviar, lembre a pessoa de reenviar o `ESCOPO.md` novo ao projeto no claude.ai, para as duas cópias ficarem iguais.

## Fora do escopo

Login, contas, sincronização, backend, notificações push, criptografia, compartilhamento.
