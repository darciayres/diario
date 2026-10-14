# Diário — Escopo de Design (UI/UX) (sintetizada)

Versão sintetizada do escopo de design, feito na cadeira de Design de Interfaces. Atualizado em 13/10/2026.

## Introdução

**O produto.** O Diário é um app de diário pessoal para celular e computador. Cada dia é um texto livre, e o humor e a hora são escritos no próprio texto com comandos simples: `humor/4` registra o humor (escala de 1 a 5) e `hora/` abre um momento do dia com horário. Os botões da interface só inserem ou editam esses comandos. Os dados ficam só no aparelho, sem conta nem login.

**O desafio de design.** Fazer um editor de texto parecer um diário acolhedor, tornar os comandos fáceis de descobrir sem virar formulário, e mostrar o humor em cores sem depender só de cor.

**Todo comando é texto.** Humor, hora, lembrete e apelido não são campos de formulário: são palavras escritas no próprio texto do dia, seguidas de uma barra. O texto é a única fonte de verdade. Os botões da barra de comandos só escrevem ou trocam essas palavras no texto, como um atalho; a pessoa pode sempre digitá-las à mão. Um comando escrito errado (como `humor/7`) continua no texto como texto comum e ganha um aviso discreto ao lado.

| Comando | Exemplo | O que faz |
| --- | --- | --- |
| `humor/N` | `humor/4` | Registra o humor do momento, de 1 a 5. Na leitura, vira emoji e cor |
| `hora/` | `hora/14:32` | Abre um novo momento do dia com horário. Na leitura, vira o cabeçalho do bloco |
| `lembrete/` | `lembrete/ ligar pro dentista` | Escrito num dia futuro, aparece em destaque quando esse dia chega |
| `apelido/` | `apelido/ o dia do campeonato` | Dá um nome ao dia inteiro, que aparece na lista de dias e no cabeçalho da leitura |

## Objetivos e princípios de design

O design deve deixar escrever o dia em poucos segundos e reler a semana num relance. Os princípios abaixo servem de critério para decidir entre alternativas.

1. **Escrever vem primeiro.** Ao abrir o app, o cursor já está no dia de hoje. Nada de telas intermediárias.
2. **O texto é a verdade.** Botões e seletores são atalhos que escrevem comandos no texto. A interface nunca mostra um dado que não esteja no texto.
3. **Comandos descobríveis, não obrigatórios.** Quem nunca leu as instruções deve conseguir registrar o humor pelo botão. Quem conhece pode digitar `humor/4`.
4. **Mobile primeiro.** Todas as telas nascem em 390 × 844. O desktop é adaptação no fim.
5. **Humor nunca só por cor.** Cor sempre acompanhada de emoji, número ou texto.
6. **Privacidade visível.** O app diz claramente que os dados ficam no aparelho e que não há criptografia.
7. **Calma, não gamificação.** Sem sequências, metas ou notificações que cobrem a pessoa. Tom acolhedor e discreto.
8. **Partir do design system do grupo.** Componentes novos seguem as variáveis e padrões criados na primeira unidade.

## Público e pesquisa

O público são pessoas que querem registrar o dia e o humor sem esforço, principalmente no celular. A pesquisa é leve, para caber no prazo: serve para validar decisões, não para descobrir o produto do zero.

**Cenários principais**

- **Registro rápido:** no ônibus, a pessoa abre o app, escreve duas linhas e marca o humor em menos de 30 segundos.
- **Momentos do dia:** registra a manhã e, à tarde, volta para registrar outro humor num novo bloco com horário.
- **Releitura:** no fim do mês, olha o calendário para ver como se sentiu e abre um dia específico.
- **Recado para o futuro:** escreve um lembrete num dia que ainda vai chegar.

**Perguntas que o teste precisa responder**

- A pessoa entende, sem ajuda, como marcar o humor?
- Ela percebe que `humor/4` no texto e o botão fazem a mesma coisa?
- O aviso de comando inválido é notado sem assustar?
- Ela entende que os dados ficam só no aparelho?

## Fluxos e protótipo

O app abre direto na tela Hoje, e a navegação leva às outras telas. O protótipo no Figma deve percorrer estes caminhos sem becos sem saída.

![Mapa de navegação: o editor é o centro e as outras telas levam de volta a ele](mapa-navegacao.png)

## Telas mobile

São 12 telas, que cobrem o app completo. Os quadros têm 390 × 844, e os estados de cada tela ficam lado a lado. A última coluna diz em que nível do código a tela ou o estado entra, só como referência para a programação.

| # | Tela | Estados a desenhar | Nível no código |
| --- | --- | --- | --- |
| 1 | Boas-vindas (1 ou 2 telas) | Explica que os dados ficam no aparelho; mostra `humor/` e `hora/` | 1 |
| 2 | Desbloqueio | Pelo bloqueio do celular (digital, rosto ou senha); pelo PIN do app: vazio, digitando, PIN errado | 4 |
| 3 | Hoje (editor) | Dia vazio com texto de exemplo; teclado aberto com barra de comandos; dia com vários blocos; aviso de comando inválido; lembrete em destaque no topo; comandos como chips visuais | 1, com estados dos níveis 3 e 4 |
| 4 | Seletor de humor (pop-up) | Pop-up aberto sobre o editor; 5 níveis; um selecionado; troca de humor num bloco que já tem | 1 |
| 5 | Lista de dias | Agrupada por mês, semana, dia ou hora; com dias; vazia; card com apelido do dia; tocar num card abre o dia | 1, apelido no 4 |
| 6 | Modo leitura do dia | Aberto a partir do próprio dia, alternando entre escrever e ler; `humor/4` vira emoji, `hora/` vira cabeçalho do bloco; com apelido no cabeçalho | 1, apelido no 4 |
| 7 | Edição de um dia | Mesmo editor de Hoje com outra data; dia futuro com a dica do `lembrete/` | 1, dia futuro no 3 |
| 8 | Calendário mensal | Célula vazia, com 1 ponto, com vários, acima do limite, hoje, selecionada, com lembrete; tocar num dia abre o dia direto | 2, lembrete no 3 |
| 9 | Configurações | Exportar e importar; confirmação antes de importar; tema claro ou escuro; bloqueio ligado ou desligado | 2, tema e bloqueio no 4 |
| 10 | Escolher bloqueio | Usar o bloqueio do celular ou criar um PIN próprio; criar PIN, confirmar, os dois não coincidem; trocar PIN | 4 |
| 11 | Instalar o app | Convite discreto para pôr na tela inicial | 2 |
| 12 | Sobre e privacidade | Repositório, licença, aviso de que não há criptografia | 1 |

**Tema escuro:** não são telas novas, e sim as mesmas telas num segundo modo das variáveis de cor. Vale desenhar pelo menos Hoje, Lista de dias e Calendário no escuro para validar o contraste.

**Estados que costumam ser esquecidos:** primeiro uso, erro ao salvar, texto muito longo, dia com muitos blocos, e confirmação antes de substituir dados na importação.

## Telas desktop (depois)

## Componentes (fazer tabela depois do protótipo de baixa)

| Componente | Variantes e estados | Usado em | Nível no código |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |

A navegação e a célula do calendário dependem de decisões ainda em aberto. Dá para começar pelos outros componentes enquanto o grupo decide.

## Fundamentos do design system

São 11 fundamentos que o grupo precisa definir antes de desenhar componentes e telas, porque todo o resto depende deles. O design system da primeira unidade é a base: o que já estiver nele basta confirmar e marcar como decidido. Tudo vira variável do Figma, nunca cor ou medida solta numa tela.

| Fundamento | O que definir | Ponto de partida | Situação |
| --- | --- | --- | --- |
| Cores de base | Fundo, superfícies, texto, bordas, destaque e aviso, nos temas claro e escuro | Célula do calendário com fundo neutro, sem degradê, e contraste com os pontos de humor | A definir |
| Fontes | Fonte da interface e fonte do texto do diário (a mesma ou uma serifada para leitura) | Gratuitas, com licença aberta e acentos do português (ex.: Google Fonts) | A definir |
| Tipografia | Escala de tamanhos, pesos e entrelinhas para títulos, texto do diário, rótulos e legendas | Texto do editor com pelo menos 16 px no celular e entrelinha confortável; testar a leitura no celular | A definir |
| Ícones | Biblioteca e estilo (linha ou preenchido, espessura, cantos); ícones de hora, humor, lembrete, calendário, dias, configurações e cadeado | Uma biblioteca aberta, compatível com a licença MIT e no estilo do design system existente | A definir |
| Espaçamento e grid | Unidade base, margens laterais, grid do celular e do desktop | Unidade de 4 ou 8 px; alvos de toque de no mínimo 44 px, inclusive nas células do calendário | A definir |
| Cantos, sombras e bordas | Raio padrão e elevação do pop-up e da barra lateral | Seguir o design system existente | A definir |
| Movimento | Como abrem o pop-up, a barra lateral e a troca entre escrever e ler | Curto e simples; respeitar a opção de reduzir movimento | A definir |
| Paleta dos 5 humores | As cores das variáveis `mood/1` a `mood/5` | Espectro que varia também a luminosidade; testado para daltonismo e nos dois temas | A definir |
| Emojis de humor | Um emoji ou ícone por nível de 1 a 5: emoji do sistema (muda de aparelho para aparelho) ou desenho próprio | Sempre junto da cor | A definir |
| Comandos no texto | Estilo de `humor/` e `hora/` dentro do editor | Diferente do texto comum, mas discreto | A definir |
| Cabeçalho de bloco e avisos | Estilo do horário na leitura (`hora/14:32` vira cabeçalho) e do aviso de comando inválido | Aviso discreto, com cor e ícone | A definir |

**Tema escuro:** todas as cores viram variáveis com dois modos (claro e escuro) desde o início. Assim o tema escuro sai das mesmas telas, sem redesenhar nada.

## Regras combinadas

- Tela e estado são coisas diferentes: estados da mesma tela ficam lado a lado, na mesma linha.
- Quadros nomeados com tela e estado: `Hoje / vazio`.
- Toda cor e espaçamento vem de variável; nada solto.
- Componentes antes de telas: as telas usam só instâncias da biblioteca.

## Fluxos que o protótipo precisa mostrar

1. **Primeiro uso:** boas-vindas → Hoje com texto de exemplo.
2. **Registrar o humor pelo botão:** Hoje → barra de comandos → pop-up do seletor → humor aparece no texto.
3. **Novo momento do dia:** bloco com humor → botão de hora → novo bloco com horário → outro humor.
4. **Comando inválido:** digitar `humor/7` → aviso discreto ao lado da linha.
5. **Reler um dia:** navegação → lista de dias → escolher o agrupamento → tocar num dia → alternar para o modo leitura → voltar a escrever.
6. **Calendário:** calendário → tocar num dia → o dia abre direto.
7. **Lembrete:** abrir um dia futuro no calendário → escrever `lembrete/` → quando o dia chega, o lembrete aparece em destaque no topo de Hoje.
8. **Apelido do dia:** escrever `apelido/` → o apelido aparece no card da lista de dias e no cabeçalho do modo leitura.
9. **Bloqueio:** Configurações → escolher entre o bloqueio do celular ou um PIN próprio → fechar e abrir o app → desbloquear (inclui erro).
10. **Exportar e importar:** Configurações → exportar; importar → confirmação antes de substituir os dados.
11. **Tema escuro:** alternar o tema e percorrer as telas principais.

No protótipo, use transições simples e o teclado do sistema como imagem para mostrar a barra de comandos acima dele.
