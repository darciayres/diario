# Diário — Produto

> O que o app é e como ele funciona. Vale para o código e para o design.
> Quando o grupo decide algo, este arquivo muda (com aprovação, veja `CLAUDE.md`).
> O que estamos construindo agora fica em [`MVP.md`](MVP.md).

## O que é

Um aplicativo de **diário pessoal**, open source, para celular e computador. É um **app web instalável** (PWA): um site que pode ser colocado na tela inicial e funciona sem internet, com o mesmo código no celular e no computador.

- **Sem servidor, sem conta, sem login.** Tudo fica guardado **só no aparelho**.
- **Sem inteligência artificial.** O que o app monta (lista de tópicos, destaques) vem de regras simples.
- **Sem criptografia, por enquanto.** O app e o README dizem isso claramente.
- Licença MIT. Hospedagem: Vercel ou Netlify.

## A ideia central: tudo é texto

Cada dia é **um documento de texto livre**. Humor, hora, lembrete e assuntos para a terapia não são campos de formulário: são **comandos escritos no próprio texto**, terminados por uma barra (`humor/4`, `hora/14:32`).

- O texto é a **única fonte de verdade**. A interface nunca mostra um dado que não esteja no texto.
- Os botões da barra de comandos são **atalhos**: só escrevem ou trocam comandos no texto. A pessoa sempre pode digitá-los à mão.
- Quem quiser pode nunca usar comando nenhum e só escrever.
- Na leitura, os comandos aparecem "polidos" (chips, cores, etiquetas). Ao editar, o comando volta a aparecer como texto.
- **Pop-ups também são atalhos.** Quem não quer digitar comandos preenche só o conteúdo (título, nota, humor) num pop-up, e o app escreve o texto com os comandos no dia certo. Exemplo: a pessoa escreve "me senti mal na reunião" e toca no humor 1; o app escreve `humor/1` e `terapia(T)/ me senti mal na reunião /terapia` no texto de hoje.

## Dados

- Um registro por dia: `{ data: "AAAA-MM-DD", texto: string }`.
- Nada além disso é guardado: humor, blocos, tópicos e lembretes são **lidos do texto** toda vez.
- O humor é um número de 1 a 5, nunca um emoji ou uma cor.
- Os dados não podem ser perdidos: nunca sobrescrever um dia sem ter certeza.
- Armazenamento no navegador (IndexedDB, pela biblioteca `idb`).

## Comandos

| Comando | Exemplo | O que faz | No MVP? |
|---|---|---|---|
| `hora/` | `hora/14:32` | Abre um novo momento do dia (bloco) com horário. O botão insere a hora atual | Sim |
| `humor/N` | `humor/4` | Registra como a pessoa se sente no momento, de 1 a 5 | Sim |
| `terapia/` | `terapia(T)/ falar sobre prazos /terapia` | Registra um assunto para levar à terapia | Sim |
| `lembrete/` | `lembrete/ ligar pro dentista` | Escrito num dia futuro, aparece em destaque quando o dia chega | Sim |
| `sentimento/` | `sentimento/an1` | Sentimento por sigla e intensidade de 1 a 3 | Não (lista de siglas em aberto) |
| `apelido/` | `apelido/ o dia do campeonato` | Dá um nome ao dia inteiro | Não |

Regras gerais:
- `humor/1` e `humor/ 1` valem os dois.
- Um comando escrito errado (`humor/7`, `humor/abc`) continua no texto como texto comum e ganha um **aviso discreto** ao lado da linha.

### Hora e blocos

- O dia sempre começa com **um bloco sem hora**. Tudo vai para ele até aparecer um `hora/`.
- Só `hora/` abre um bloco com horário. `hora/14:32` seguido de `humor/4` é um bloco só.
- Cada bloco tem **no máximo um humor**.

### Humor

| Número | Nome |
|---|---|
| 1 | Muito mal |
| 2 | Mal |
| 3 | Médio |
| 4 | Bem |
| 5 | Muito bem |

- Na tela, o humor sempre aparece como **ponto colorido + número + nome** (ex.: "4 · Bem"). Nunca só a cor.
- Se a pessoa **digita** um segundo `humor/` num bloco que já tem humor, o **editor** insere sozinho `hora/` com a hora atual antes dele, abrindo um bloco novo.
- O **botão** de humor age no bloco do cursor: sem humor, insere `humor/N`; com humor, **troca** o número. O botão nunca abre bloco novo.
- Caso limite: texto colado com dois `humor/` no mesmo bloco, sem `hora/` entre eles. O app não inventa hora: o segundo abre um **bloco novo sem horário**, com aviso discreto.

### Terapia

- Ao digitar `terapia/`, o app escreve `terapia(T)/` (T = tópico aberto) e o texto que vem depois aparece **em outra cor**, para a pessoa ver que está dentro do tópico.
- Um Enter começa um parágrafo novo dentro do tópico. **Dois Enters seguidos** (uma linha em branco) fazem o app fechar o tópico com `/terapia`, e o trecho ganha um destaque.
- O destaque nunca depende só de cor: na leitura aparece a etiqueta "Tópico de terapia".
- Os tópicos abertos de todos os dias aparecem no **card Tópicos de terapia, dentro da Centralizadora** (não há uma página só para eles). Ao marcar um como concluído, o comando no texto vira `terapia(F)/` e ele sai da lista. A pessoa também pode trocar a letra à mão.
- **Pelo pop-up "Tópico de terapia"** (título, nota e humor opcional), aberto pelo card Tópicos de terapia da Centralizadora, ao salvar, o app acrescenta ao fim do texto de hoje um momento novo *(formato proposto, a confirmar com o grupo)*:

  ```
  hora/14:32
  humor/1
  terapia(T)/ Título
  Nota /terapia
  ```

  Sem humor escolhido, a linha `humor/` não entra.

### Lembrete

- Escrito num dia futuro, com `lembrete/ texto`.
- Quando o dia chega, o lembrete aparece **em destaque no topo de Hoje**.
- Na leitura, aparece sem o comando à mostra.
- **Pelo pop-up "Novo lembrete"** (título, data, hora opcional e nota), aberto pela Centralizadora ou pelo botão de lembrete da barra lateral, ao salvar, o app acrescenta ao fim do texto do dia escolhido *(formato proposto, a confirmar com o grupo)*:

  ```
  lembrete/ 12:00 Título — Nota
  ```

  Sem hora, ela não entra. A opção "Período" (lembrete em vários dias) fica para depois do MVP.

## Telas e navegação

- **Mobile primeiro.** Quadro base: iPhone 16, **393 × 852**. O desktop é adaptação no fim.
- **Navegação: barra lateral** (decidido em 26/11/2026). Abre por cima da tela, pelo botão no canto superior esquerdo. Nela ficam a faixa da semana, a lista de dias e o botão **Central**.
- **Centralizadora:** uma tela de cards, aberta pelo botão Central. Os cards são Tópicos de terapia, Calendário e Estatísticas. No MVP entra só o card de Tópicos de terapia, com o botão de novo lembrete.
- Ao abrir o app, o cursor já está no dia de hoje, sem telas no meio.
- Cada dia tem dois modos, que se alternam por um botão: **escrever** (Escritor) e **ler** (Leitor).
- A barra de comandos do Escritor fica **fixa**, logo acima do teclado. Os botões dela **só escrevem o comando onde está o cursor** (decidido em 26/11/2026). A exceção é o de humor, que abre a escolha de 1 a 5. Os pop-ups de terapia e de lembrete não abrem pela barra: abrem pela Centralizadora e pela barra lateral.
- O destaque de um comando (cor `comando/fundo-ativo`) aparece quando a pessoa toca, apaga ou escreve nele.

## Visual

O Figma é a referência visual: [arquivo DINT2-AV02](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=1-3), página **Mobile Prototype**. Os links de cada tela e componente estão no `MVP.md`.

- **Cores:** vêm das variáveis do Figma (coleção Roles, modo Claro; humores em `humor/1` a `humor/5`). No código viram variáveis CSS (`--humor-1`… ), nunca cores soltas. O modo escuro existe no Figma, mas está oculto por enquanto. A paleta dos humores ainda pode mudar.
- **Fontes:** Lato (títulos), Cabin (interface) e Habibi (texto do diário, 16 px).
- **Medidas:** espaço entre blocos de 12 px; alvos de toque de pelo menos 44 px.
- **Acessibilidade:** contraste nível AA da WCAG; cor sempre acompanhada de número, texto ou ícone.

## Princípios

1. **O texto é a verdade.** Botões são atalhos; ao exportar, tudo sai como texto puro.
2. **Privacidade em primeiro lugar.** O app diz que os dados ficam no aparelho, sem criptografia, e nada vai para a internet.
3. **Comandos descobríveis, não obrigatórios.** Quem nunca leu as instruções consegue marcar o humor pelo botão.
4. **Escrever vem primeiro.** Abrir o app é abrir o dia de hoje.
5. **Calma, não gamificação.** Sem sequências nem metas que cobrem a pessoa. Tom acolhedor e discreto.

## Fora do escopo

Login, contas, sincronização, backend, criptografia, compartilhamento e qualquer recurso de modelo de negócio.
