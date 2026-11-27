# Diário — MVP

> O objetivo atual. O Claude Code trabalha **uma tarefa por vez**, na ordem abaixo, e marca `[x]` quando termina.
> As regras do app estão em [`PRODUTO.md`](PRODUTO.md). Nada fora desta lista entra no código sem o grupo decidir.

## Objetivo

Uma primeira versão do Diário **publicada num endereço da internet**, em que dá para:

- escrever o dia de hoje, dividido em momentos com **hora** e **humor**;
- anotar **assuntos para a terapia**, digitando ou pelo pop-up, e vê-los no card da Centralizadora;
- deixar **lembretes** em dias futuros, digitando ou pelo pop-up, e vê-los em destaque quando o dia chega;
- ler e editar outros dias pela **barra lateral**;
- fechar o app, abrir de novo e o texto continuar lá.

Sem prazo definido: o grupo avança no ritmo possível, fase por fase.

## Pronto quando

- [ ] Dá para escrever no celular, fechar o app, abrir depois e o texto continua lá.
- [ ] Hora, humor, terapia e lembrete funcionam como está no `PRODUTO.md`.
- [ ] Os testes do parser passam (`npm test`).
- [ ] O app está publicado, pode ser instalado na tela inicial e abre sem internet.

## Telas do Figma

Página **Mobile Prototype** do arquivo [DINT2-AV02](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=1-3). Ao implementar, leia o quadro pelo link.

| Tela | Estado | Quadro |
|---|---|---|
| Hoje | Escrevendo | [V2 TELA \| Diário Escritor](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-10939) |
| Hoje | Lendo | [V2 TELA \| Diário Leitor](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-11229) |
| Outro dia (passado) | Escrevendo | [V2 TELA \| Diário Escritor passado](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-16791) |
| Outro dia (passado) | Lendo | [V2 TELA \| Diário Leitor passado](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-16817) |
| Outro dia (futuro) | Escrevendo | [V2 TELA \| Diário Escritor Futuro](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-16509) |
| Outro dia (futuro) | Lendo | [V2 TELA \| Diário Leitor futuro](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-15901) |
| Barra lateral | Aberta | [Componente Sidebar](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=961-17734) |
| Centralizadora | Card Tópicos de terapia | [V2 TELA \| Centralizadora](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=988-11390) |
| Pop-up | Tópico de terapia | [Pop-up Terapia](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=893-10793) |
| Pop-up | Novo lembrete | [Pop-up lembrete](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=893-10796) |
| Boas-vindas | Primeira abertura | [Entrada 1 (PG ROBERTO)](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=352-1882) |

**Componentes:** ficam na seção [Componentes em uso](https://www.figma.com/design/rXmMMfGfCaPHqB6IY958T3/DINT2-AV02?node-id=976-6160) da mesma página. Os principais: Título Dia, Bloco, Hora, Humor, Tag - Tópico de Terapia, command bar, humor_pop-up, toggle ler,escrever V3, Sidebar, Lista de dias (Sidebar), carrosel calendário, Terapia, Pop-up - New (Terapia/Evento), Time Set e Tábua de Humor - Popup Terapia.

## Tarefas

### Fase 0 — Base
- [x] 0.1 Trocar a tela de exemplo por uma página "Diário" simples.
- [x] 0.2 Trazer do Figma as cores (Roles, modo Claro, e `humor/1` a `humor/5`), as fontes e as sombras para variáveis CSS.
- [x] 0.3 Publicar na Vercel ou na Netlify e anotar o endereço no README.

### Fase 1 — Texto e parser
> A branch `prova-de-conceito` já tem um parser, os comandos do editor e o armazenamento, com testes. Reaproveitar o que estiver de acordo com o `PRODUTO.md` (lá os dados ficam no localStorage; aqui, no IndexedDB).
- [x] 1.1 Parser de `hora/` e `humor/`, com um teste para cada regra de blocos e humor do `PRODUTO.md`.
- [x] 1.2 Guardar e ler o texto de cada dia no aparelho.

### Fase 2 — Hoje (escrevendo)
- [x] 2.1 Tela Hoje com o título do dia e o editor de texto.
- [x] 2.2 Blocos com as etiquetas de hora e humor.
- [x] 2.3 Barra de comandos fixa acima do teclado, com os botões de hora e humor (sentimento e apelido ficam escondidos).
- [x] 2.4 Pop-up de humor de 1 a 5; o botão escreve o humor como manda o `PRODUTO.md` (na linha do `hora/` ou num bloco novo com a hora atual).
- [x] 2.5 Regras do editor para o humor digitado: vai para a linha do `hora/` do bloco; no bloco sem hora, ou num bloco que já tem humor, ganha um `hora/` com a hora atual; aviso de comando inválido.
- [x] 2.6 Texto de exemplo no dia vazio.

### Fase 3 — Hoje (lendo)
- [x] 3.1 Botão de ler/escrever e modo leitura, com os comandos "polidos". No celular, fechar o teclado leva à leitura e tocar no texto volta à escrita.

### Fase 4 — Barra lateral e outros dias
- [x] 4.1 Barra lateral abre e fecha pelo botão, com tudo o que está no Figma. O que o MVP ainda não prevê (Central até a 5.4, novo lembrete até a 6.5, busca, Ver calendário e Configurações) aparece, mas não faz nada: o MVP mostra o design o máximo possível.
- [x] 4.2 Lista dos últimos 30 dias, do mais novo para o mais antigo (a regra geral, até o primeiro dia escrito, fica para depois do MVP); tocar no nome de um dia abre esse dia, a setinha mostra os horários dele e tocar num horário abre o dia nesse momento.
- [x] 4.3 Faixa da semana em carrossel (arrastando, vai para outras semanas), com os pontinhos de humor; abrir dias passados e futuros por ela.
- [x] 4.4 Título do dia com "Ontem", "Daqui a 3 dias" e assim por diante.
- [x] 4.5 Humor sem hora fora do dia de hoje: em dias passados, a barra de comandos aparece com o botão de humor, que escreve só `humor/N`; o app não mexe no humor digitado; um segundo humor no mesmo bloco abre um momento novo, sem aviso (regra nova do `PRODUTO.md`).

### Fase 5 — Terapia
- [ ] 5.1 Parser de `terapia/`, com testes.
- [ ] 5.2 No editor: texto em outra cor, fechamento com dois Enters e botão de terapia na barra, que só escreve `terapia/` onde está o cursor.
- [ ] 5.3 Etiqueta "Tópico de terapia" no modo leitura.
- [ ] 5.4 Centralizadora com o card Tópicos de terapia: lista dos abertos e marcar como concluído (vira `terapia(F)/`). Abre pelo botão Central da barra lateral.
- [ ] 5.5 Pop-up "Tópico de terapia", aberto pelo card da Centralizadora: ao salvar, escreve o momento no texto de hoje, no formato do `PRODUTO.md`.

### Fase 6 — Lembrete
- [ ] 6.1 Parser de `lembrete/`, com testes, e botão de lembrete na barra, que só escreve `lembrete/` onde está o cursor.
- [ ] 6.2 Dia futuro vazio com a dica do `lembrete/`.
- [ ] 6.3 Quando o dia chega, o lembrete aparece em destaque no topo de Hoje.
- [ ] 6.4 Marca de lembrete na faixa da semana.
- [ ] 6.5 Pop-up "Novo lembrete", aberto pela Centralizadora e pelo botão de lembrete da barra lateral: ao salvar, escreve o lembrete no dia escolhido, no formato do `PRODUTO.md`.

### Fase 7 — Fechamento
- [ ] 7.1 Boas-vindas na primeira abertura.
- [ ] 7.2 Tela Sobre e privacidade (repositório, licença, sem criptografia, dados só no aparelho).
- [ ] 7.3 App instalável e funcionando sem internet.
- [ ] 7.4 README atualizado e versão final publicada.

## Falta desenhar no Figma

Cada item precisa estar no Figma antes da tarefa que depende dele.

- [x] Aviso de comando inválido (tarefa 2.5): sugestão provisória na página claude (CL) do Figma
- [x] Dia vazio com texto de exemplo (2.6)
- [ ] Tópico de terapia sendo escrito e já fechado, no Escritor (5.2)
- [ ] Centralizadora do MVP, só com o card Tópicos de terapia e o botão de novo lembrete (5.4)
- [ ] Ajustes dos pop-ups de terapia e de lembrete, como pede a nota "ajustar pop-ups" no Figma (5.5 e 6.5)
- [ ] Dia futuro vazio com a dica do `lembrete/` (6.2)
- [ ] Lembrete em destaque no topo de Hoje e lembrete na leitura sem o comando (6.3)
- [ ] Boas-vindas trazida para a Mobile Prototype e tela Sobre (7.1 e 7.2)

## Em aberto

- **Formato do texto escrito pelos pop-ups:** há uma proposta no `PRODUTO.md`, a confirmar com o grupo antes das tarefas 5.5 e 6.5.
- **Paleta dos humores:** a atual vale para o MVP, mas pode mudar.
- **Visual do aviso de comando inválido (a rever):** sugestão provisória na página claude (CL) do Figma: o comando continua como texto, com fundo `aviso/fundo` e ícone de alerta, e um balão com o motivo e como corrigir aparece quando o cursor está no comando. O mesmo visual vale para o humor em dias futuros. O balão aparece acima do comando e cobre a linha de cima enquanto o cursor está nele; ver no celular se incomoda.
- **Indicador de dia escrito na lista de dias:** a lista mostra todos os dias. Dá para colocar um indicador sutil de quais dias têm algo escrito e quais não têm (ainda não desenhado).

## Fora do MVP

Sentimentos, apelido do dia, calendário mensal, estatísticas e Marcos, busca, configurações (exportar e importar, tema escuro, bloqueio por PIN, lembrete para escrever), notificações e versão desktop.

**Observação sobre exportar e importar:** não é foco agora, mas sem isso, limpar os dados do navegador apaga o diário. A tela Sobre deve avisar isso, e o assunto volta depois do MVP.
