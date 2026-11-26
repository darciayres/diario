# CLAUDE.md — Diário

Antes de qualquer tarefa, leia:

1. [`docs/PRODUTO.md`](docs/PRODUTO.md): o que o app é e as regras dos comandos.
2. [`docs/MVP.md`](docs/MVP.md): o objetivo atual e a lista de tarefas, em ordem.

## Sobre quem usa este projeto

Quem pede as tarefas é **designer e tem pouca experiência com programação**. Por isso:
- Explique em linguagem simples o que está fazendo e por quê, sem jargão não explicado.
- Faça mudanças pequenas e teste cada uma antes de seguir.
- Depois de cada etapa, diga como ver o resultado (por exemplo, "abra http://localhost:5173").
- Nunca rode comandos destrutivos (apagar pastas, `git reset --hard`, `git push --force`) sem explicar e pedir confirmação.

## Como trabalhar

- Faça **uma tarefa do `MVP.md` por vez**, na ordem. Não implemente nada que não esteja na lista.
- Ao terminar uma tarefa, marque `[x]` nela no `MVP.md`, no mesmo commit.
- Antes de começar uma tarefa que depende de algo da seção "Falta desenhar no Figma", confira se já foi desenhado. Se não foi, avise e pare.

## Stack

- React + Vite + TypeScript
- Armazenamento: IndexedDB, pela biblioteca `idb`
- Testes: Vitest (obrigatório para o parser)
- Deploy: Vercel ou Netlify
- Sem backend, sem login, sem bibliotecas de componentes prontas: os componentes seguem o design system do Figma

## Parser (`src/parser`)

- Uma função pura: recebe o texto do dia e devolve os blocos, os tópicos de terapia, os lembretes e os avisos. Não acessa tela nem armazenamento.
- Toda regra de comando do `PRODUTO.md` precisa de um teste.
- O que muda o texto enquanto a pessoa digita (inserir `hora/` antes de um segundo humor, fechar um tópico de terapia) é papel do **editor**, não do parser.

## Design

- Leia cada tela e componente pelo **conector do Figma**, usando os links do `MVP.md`. Não invente estilos.
- Cores, fontes e espaçamentos ficam em variáveis CSS (`--humor-1` a `--humor-5` etc.), nunca soltos no código.
- Mobile primeiro, quadro de 393 × 852. Alvos de toque de pelo menos 44 px.
- Humor nunca só por cor: sempre com número e nome. Contraste nível AA da WCAG.

## Privacidade

Diário é conteúdo sensível. Não envie dados a nenhum servidor e não use analytics nem serviços de terceiros. Deixe claro no app e no README que os dados ficam só no aparelho e que não há criptografia.

## Open source

- Licença MIT (`LICENSE`).
- `README.md` em português: o que é, como rodar, como contribuir.
- Commits pequenos, com mensagens claras em português.

## Mudanças no produto ou no MVP

- Mudança de regra ou de decisão vai no `docs/PRODUTO.md`. Mudança do que entra ou sai do MVP vai no `docs/MVP.md`.
- **Peça confirmação antes de alterar** qualquer um dos dois (marcar `[x]` numa tarefa terminada não precisa). Mostre o trecho antigo e o novo e espere a aprovação. Só depois edite e faça o commit, com a mensagem começando por `Produto:` ou `MVP:`.
- Nunca altere esses arquivos por conta própria ou como efeito de outra tarefa. Se uma tarefa exigir mudança, pare e pergunte.
- Depois de enviar ao GitHub, lembre a pessoa de clicar em **Sync now** no projeto Diário do claude.ai.
