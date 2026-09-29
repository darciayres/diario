# Diário — Documento de Escopo

> Nome provisório.

## Introdução

### O que é o projeto

Um aplicativo de **diário pessoal**, open source, que funciona no celular e no computador. Ele é um PWA: um site responsivo que pode ser instalado como app e roda no navegador de qualquer aparelho, com o mesmo código. Não há servidor, conta ou login: tudo o que a pessoa escreve fica guardado **no próprio aparelho**, e o código é aberto para qualquer um ler, usar e melhorar.

O projeto é o trabalho da segunda unidade da disciplina. O design system criado no Figma pelo grupo na primeira unidade é a base visual das interfaces, e o código é feito com o Claude Code e publicado online.

### Como o app funciona

Cada dia é **um documento de texto**. Em vez de formulários separados para humor, horário e lembretes, tudo é escrito no próprio texto, por meio de comandos simples (`humor/4`, `hora/`, `lembrete/`). Botões existem para reduzir o atrito, mas só inserem ou editam essas linhas, então o texto é a única fonte de verdade.

### Funções

- **Escrever o dia**: abrir o app e escrever no dia de hoje, várias vezes se quiser, e reler os dias anteriores.
- **Registrar o humor**: uma escala de 1 a 5, com botões ou digitando `humor/N`.
- **Dividir o dia em momentos**: `hora/` cria um bloco com a hora atual.
- **Calendário**: navegar pelos dias e ver, em cores, como a pessoa se sentiu; dias com mais de um humor mostram um degradê.
- **Lembretes para o futuro**: escrever `lembrete/` em um dia futuro e vê-lo no calendário e no texto quando o dia chegar.

### Metodologia: níveis de complexidade

O trabalho é dividido em **4 níveis**, do mais simples ao mais ambicioso. A regra principal é que **cada nível seja entregável sozinho**: ao terminar um, o app funciona por inteiro, está publicado e pode ser apresentado. Cada nível acrescenta funções completas, em vez de camadas soltas como "primeiro todo o visual, depois toda a lógica".

Assim o grupo bate o nível 1; se houver tempo, vai para o 2, depois para o 3, e assim por diante. Se o tempo acabar no meio de um nível, o anterior continua intacto e entregável, sem sobrar um app pela metade. Na prática, cada nível é feito em uma branch própria e marcado com uma tag de versão (`v1`, `v2`...) ao ser concluído.

| Nível | Foco | Resultado |
|---|---|---|
| 1 | Escrever e reler dias, humor e hora | App básico e usável, publicado |
| 2 | Calendário com humores em cores | App visual e navegável, instalável |
| 3 | Lembretes em dias futuros | App que também fala com o "eu do futuro" |
| 4 | Extras | Refinamentos, só se sobrar tempo |

## Ideia central

Cada dia é **um documento de texto**. Humor, hora e lembretes são **comandos escritos no texto** (`humor/4`, `hora/`, `lembrete/`). Botões existem para reduzir o atrito, mas só inserem ou editam essas linhas. O texto é a única fonte de verdade.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Plataforma | PWA (site responsivo instalável), um código para mobile e desktop |
| Dados | Locais no aparelho, sem servidor e sem login |
| Modelo de dados | Um registro por dia: `data` + `texto` |
| Humor | Escala de 1 a 5, guardada como número; 5 cores em espectro (emojis definidos no Figma) |
| Várias entradas por dia | Sim, divididas em **blocos** dentro do texto |
| Lembretes | Só dentro do app (sem notificação no celular) |
| Idioma dos comandos | Português |
| Licença | MIT |
| Hospedagem | Vercel ou Netlify |

## Comandos do texto

| Comando | Exemplo | Efeito |
|---|---|---|
| `humor/N` | `humor/4` | Registra o humor (N de 1 a 5) do bloco atual |
| `hora/` | `hora/14:32 fui almoçar` | Abre um bloco com horário (o app insere a hora atual) |
| `lembrete/` | `lembrete/ ligar pro dentista` | Lembrete que aparece no dia escrito (só nível 3) |

Regras:
- `humor/1` e `humor/ 1` valem ambos.
- Comando inválido (`humor/7`, `humor/abc`) vira texto comum, com aviso discreto ao lado da linha.

### Blocos

- **O dia já começa com um bloco sem hora.** Tudo que é escrito vai para ele até aparecer um `hora/`.
- Só o `hora/` abre um bloco com horário.
- Cada bloco tem **no máximo um humor**.
- `humor/` só cria um novo bloco quando o bloco atual **já tem** um humor. Nesse caso o app insere sozinho `hora/` com a hora atual e o humor novo vai para o bloco novo.

### Botão de humor

O botão age sobre o bloco onde está o cursor:
- Bloco **sem humor**: insere `humor/N`.
- Bloco **com humor**: **troca** o `humor/N` existente. O botão nunca abre bloco novo; para registrar outro humor no dia, a pessoa escreve `humor/` de novo no texto.

Exemplos:

```
hora/14:32
humor/4
```
→ um bloco só (14:32, humor 4).

```
hora/14:32
humor/4

humor/3
```
→ ao digitar o segundo humor, o app transforma o texto em:

```
hora/14:32
humor/4

hora/16:05      ← inserido pelo app, com a hora atual
humor/3
```
→ dois blocos (14:32 com humor 4, 16:05 com humor 3).

### Caso limite (decidido)
Se o texto for colado ou editado de fora e tiver dois `humor/` no mesmo bloco sem `hora/` entre eles, o app não insere hora (ela seria falsa). O segundo `humor/` abre um **bloco novo sem horário**, com aviso discreto.

## Níveis

### Nível 1 — Entregável
Escrever e reler dias.
- Tela **Hoje**: editor de texto do dia, barra de botões (humor, hora)
- Tela **Lista de dias**: dias anteriores em ordem
- Tela **Leitura/edição** de um dia passado
- Na leitura: `humor/N` aparece como emoji e `hora/` como cabeçalho do bloco
- Dica curta na primeira abertura e texto de exemplo no dia vazio
- Repositório público, licença MIT, README, deploy em URL pública

**Concluído quando:** dá para escrever no celular, fechar o app, abrir depois e o texto continuar lá, tudo no ar.

### Nível 2 — Calendário
- Calendário mensal; toque em um dia abre o texto dele
- Cada dia mostra cor sólida (um humor) ou **degradê** (vários humores, na ordem dos blocos)
- Dia sem humor: célula neutra
- App instalável e funcionando offline
- Exportar e importar JSON (se der, antecipar)

### Nível 3 — Lembretes
- `lembrete/` em dias futuros
- Indicador no calendário
- Destaque no topo do dia quando ele chega

### Nível 4 — Extras (só se sobrar tempo)
Tema escuro, bloqueio por PIN, estatísticas, notificações reais, app nativo (Tauri/Capacitor), transformar comandos em chips visuais no editor.

## Decisões adiadas (definir durante o desenvolvimento)
- Degradê: três ou mais humores, direção (horizontal ou diagonal), emojis junto das cores
- Paleta dos 5 humores (acessível a daltonismo, com contraste para o número do dia)

## Design (Figma)

O design será feito **mobile primeiro**: primeiro todas as telas mobile e, ao final, as versões desktop. Ainda não foi feito. O design system da primeira unidade é a base.

### Componentes necessários
- Seletor de humor (5 níveis, com estado selecionado)
- Editor de texto do dia
- Barra de comandos (humor, hora, lembrete)
- Card de dia para a lista
- Aviso inline (comando inválido)
- Célula de calendário (vazia, sólida, degradê, com lembrete)
- Elemento de navegação entre as telas (a definir)

Variables: `mood/1` a `mood/5`, além das cores e espaçamentos do design system.

### Navegação (a definir)

O app precisa de uma **navegação entre as telas principais** (Hoje, Dias e, a partir do nível 2, Calendário), no mobile e no desktop. O formato dela ainda não foi decidido e será definido no Figma. As telas abaixo só assumem que ela existe.

### Telas mobile

**Nível 1** (desenhar primeiro)

| # | Tela | Estados a desenhar |
|---|---|---|
| 1 | Boas-vindas (1 ou 2 telas) | Explica que os dados ficam no aparelho e mostra os comandos `humor/` e `hora/` |
| 2 | Hoje (editor) | Dia vazio com texto de exemplo, teclado aberto com a barra de comandos, dia com conteúdo, aviso inline de comando inválido |
| 3 | Seletor de humor | Os 5 níveis; estado selecionado |
| 4 | Lista de dias | Com dias e vazia |
| 5 | Leitura de um dia passado | Texto renderizado (`humor/4` vira emoji, `hora/` vira cabeçalho do bloco) |
| 6 | Edição de um dia passado | Mesmo editor da tela Hoje, com outra data no topo |
| 7 | Sobre e privacidade | Repositório, licença e aviso de que não há criptografia |

**Nível 2**

| # | Tela | Estados a desenhar |
|---|---|---|
| 8 | Calendário mensal | Célula vazia, com humor sólido, com degradê, hoje, selecionada |
| 9 | Resumo do dia (ao tocar num dia) | Humores do dia e início do texto, com acesso ao dia completo |
| 10 | Configurações | Exportar e importar dados |
| 11 | Instalar o app | Convite discreto para instalar na tela inicial |

**Nível 3** (sem telas novas, só estados das existentes)
- Calendário com indicador de lembrete na célula
- Dia com lembrete destacado no topo, quando o dia chega
- Editor de um dia futuro, com a dica do `lembrete/`

**Nível 4** (só se sobrar tempo; não desenhar agora)
- Tema escuro (as mesmas telas em outro modo de variáveis), bloqueio por PIN, criação do PIN e estatísticas

### Telas desktop (depois do mobile)

Em vez de refazer tudo, adaptar as telas que ganham com a tela larga:

| Tela desktop | Diferença em relação ao mobile |
|---|---|
| Hoje | Coluna de escrita mais estreita e centralizada, com a navegação adaptada à tela larga |
| Dias + leitura | Duas colunas: lista de um lado e texto do dia do outro |
| Calendário + dia | Calendário de um lado e o dia selecionado do outro |
| Configurações | Uma coluna centralizada |

### Dicas de organização no Figma
- **Tela e estado são coisas diferentes.** "Hoje com teclado aberto" e "Hoje vazio" são estados da mesma tela: desenhar lado a lado, na mesma linha do arquivo.
- Um tamanho de quadro para o mobile (por exemplo 390 × 844) e outro para o desktop (por exemplo 1440 × 900).
- Nomear os quadros com nível e nome (`N1 / Hoje / vazio`), para pedir ao Claude Code "implemente o quadro N1 / Hoje".
- Começar pelos **componentes** que se repetem em várias telas e só depois montar as telas.

## Cronograma sugerido (8 semanas)

| Semanas | Foco |
|---|---|
| 1 | Projeto base, repositório, deploy "olá mundo", Figma das telas do nível 1 |
| 2–3 | Nível 1 (editor, salvar, lista, humor e hora com botões) |
| 4 | Testes com o grupo, ajustes, tag `v1` |
| 5–6 | Nível 2 (calendário e degradê), tag `v2` |
| 7 | Nível 3 (lembretes), tag `v3`, ou polimento se estiver apertado |
| 8 | Reserva, README, apresentação; nível 4 só se sobrar tempo |

Se algum nível atrasar, o anterior continua entregável.

## Fora do escopo
Login, contas, sincronização, backend, notificações push, criptografia, compartilhamento.
