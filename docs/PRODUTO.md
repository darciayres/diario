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
- Um comando precisa **começar a linha** ou vir **logo depois de outro comando** (espaços não atrapalham). Assim, `hora/14:30 humor/5` vale como os dois comandos, e `hora/14:30 humor/5 almocei fora` também, com o texto depois. No meio de uma frase, como em "meu humor/4 hoje", é texto comum.
- Os comandos de uma mesma linha valem juntos: se um deles é `hora/`, todos entram no bloco que ele abre, em qualquer ordem. `humor/5 hora/14:30` é o mesmo que `hora/14:30 humor/5`.
- O editor só mexe no que a pessoa **digita**. Texto colado fica exatamente como veio.
- Maiúsculas e minúsculas valem igual: `Humor/4` é o mesmo que `humor/4`, porque o teclado do celular costuma começar a linha com maiúscula.
- `humor/1` e `humor/ 1` valem os dois.
- Um comando escrito errado continua no texto como texto comum, com **fundo de aviso e ícone de alerta**. O aviso só aparece quando o cursor sai da linha (enquanto a pessoa escreve, nada pisca). Com o cursor no comando, um **balão** mostra o motivo e como corrigir:

  | Caso | Exemplo | Texto do balão |
  |---|---|---|
  | Humor fora de 1 a 5, ou sem número | `humor/7`, `humor/abc`, `humor/` | O humor vai de 1 a 5. Ex.: humor/4 |
  | Hora inválida, ou sem hora | `hora/25:00`, `hora/abc`, `hora/` | Use a hora assim: hora/14:30 |
  | Dois `hora/` na mesma linha (no segundo) | `hora/14:30 hora/15:00` | Só vale um hora/ por linha |
  | Humor num dia futuro | `humor/4` num dia futuro | Não dá para registrar humor num dia que ainda não chegou |

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
- O humor vale **onde for escrito**, com ou sem hora. Cada bloco tem no máximo um humor: um segundo `humor/` no mesmo bloco abre um momento novo, sem hora. Não é erro e não ganha aviso.
- **No dia de hoje**, o app junta a hora atual ao humor, porque a hora é conhecida e guarda o dado para as estatísticas no futuro. Quando a pessoa **digita** um `humor/` e o cursor sai da linha (com Enter, tocando em outro lugar ou saindo do app), o **editor** arruma o texto:
  - **Bloco com hora e sem humor:** o comando vai para a linha do `hora/` do bloco. Se a linha de onde ele saiu fica vazia, ela some.
  - **Bloco sem hora** (o começo do dia), ou **bloco que já tem humor:** o editor escreve `hora/` com a hora atual antes do humor, na mesma linha, abrindo um bloco novo: `hora/15:10 humor/3`.
- O **botão** de humor, no dia de hoje, segue a mesma regra:
  - **Bloco com hora e sem humor:** escreve `humor/N` na linha do `hora/`.
  - **Bloco sem hora**, ou **bloco que já tem humor:** abre um bloco novo, numa linha logo abaixo da linha do cursor, com a hora atual e o humor: `hora/15:10 humor/3`. Se a linha do cursor estiver vazia, usa ela mesma.
- **Em dias passados**, o app nunca mexe no humor digitado nem acrescenta hora. O botão de humor escreve só `humor/N` onde está o cursor. Se ali o comando não valeria (no meio de uma frase), ele começa uma linha nova.
- O botão nunca troca um humor que já existe. Para corrigir, a pessoa toca na etiqueta e muda o número no texto.

### Dias que não são hoje

- **Hora:** o botão de hora escreve a hora de agora, o que só faz sentido no dia de hoje. Por isso, em dias passados e futuros, o botão de hora não aparece na barra de comandos, e o app nunca completa um `hora/` vazio com a hora atual. O comando `hora/` digitado vale em qualquer dia: a pessoa pode escrever `hora/09:15` para contar algo que aconteceu, ou vai acontecer, nessa hora.
- **Humor em dias futuros:** `humor/` é sempre um erro, porque ninguém registra como se sente num dia que ainda não chegou. O comando ganha o mesmo aviso dos comandos escritos errado e não conta como humor. O botão de humor não aparece na barra de comandos.
- **Humor em dias passados:** vale com ou sem hora (veja "Humor"). O botão de humor aparece na barra de comandos e escreve só `humor/N`, sem hora.
- **Barra de comandos:** em dias passados, ela aparece com o botão de humor. Em dias futuros, enquanto não houver nenhum botão para mostrar (no MVP, até chegarem os de terapia e de lembrete), ela não aparece.

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
  - **Faixa da semana:** um carrossel com os 7 dias, de segunda a domingo; arrastando, vai para outras semanas. Embaixo de cada dia, um pontinho para cada humor do dia, na cor do humor e na ordem do texto: até 3 pontinhos e, se houver mais, um **+** depois deles. A marca no canto mostra que o dia tem lembrete.
  - **Lista de dias:** todos os dias, de hoje até o primeiro dia escrito, do mais novo para o mais antigo, com Hoje no topo (no MVP, só os últimos 30 dias). Tocar no nome de um dia abre esse dia; a setinha ao lado mostra embaixo os horários dos momentos do dia, e tocar num horário abre o dia já nesse momento. Dia sem horário marcado não tem setinha.
  - Cada dia tem o próprio endereço: o gesto de voltar do navegador volta ao dia aberto antes.
- **Título do dia:** o dia da semana, junto de quão perto ele está de hoje:
  - hoje: só o dia da semana ("Quarta-feira");
  - ontem e amanhã: "Ontem, terça-feira", "Amanhã, quinta-feira";
  - até 6 dias: "Segunda-feira, há 4 dias", "Sábado, daqui a 3 dias";
  - de 7 dias até um mês, em semanas e dias: "Quarta-feira, daqui a uma semana", "Sábado, daqui a uma semana e 3 dias", "Terça-feira, há 2 semanas e um dia";
  - a partir de um mês, só em meses: "Segunda-feira, há um mês", "Sexta-feira, daqui a 3 meses";
  - a partir de um ano, só em anos: "Domingo, há um ano", "Quinta-feira, há 2 anos".
- **Centralizadora:** uma tela de cards, aberta pelo botão Central. Os cards são Tópicos de terapia, Calendário e Estatísticas. No MVP entra só o card de Tópicos de terapia, com o botão de novo lembrete.
- Ao abrir o app, o dia de hoje aparece direto, no modo ler, sem telas no meio.
- Cada dia tem dois modos: **escrever** (Escritor) e **ler** (Leitor). Eles se alternam pelo botão no topo e também:
  - **tocar no texto** passa para o modo escrever, com o cursor onde a pessoa tocou (no celular, o teclado sobe);
  - no celular, **fechar o teclado** passa para o modo ler.
- Ao passar para o modo escrever **pelo botão do topo**, a tela não rola: o cursor vai para o fim da última coisa escrita, se ela estiver à vista acima de onde o teclado abre; se não estiver, vai para o fim da última linha à vista acima do teclado.
- A barra de comandos só aparece no modo escrever.
- A barra de comandos do Escritor fica **fixa**, logo acima do teclado. Os botões dela **só escrevem o comando onde está o cursor** (decidido em 26/11/2026). A exceção é o de humor, que abre a escolha de 1 a 5. Os pop-ups de terapia e de lembrete não abrem pela barra: abrem pela Centralizadora e pela barra lateral. Em dias passados e futuros, alguns botões somem (veja "Dias que não são hoje").
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
