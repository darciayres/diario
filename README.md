# Diário

> Nome provisório.

Um aplicativo de **diário pessoal**, open source, que funciona no celular e no computador (PWA). Cada dia é um documento de texto, e o humor, a hora e os lembretes são escritos no próprio texto com comandos simples (`humor/4`, `hora/`, `lembrete/`).

Projeto da segunda unidade da disciplina, feito em grupo a partir do design system criado no Figma na primeira unidade.

## Privacidade

Tudo o que você escreve fica **somente no seu aparelho**. Não há servidor, conta nem login. Por enquanto os dados **não são criptografados**: quem tiver acesso ao aparelho desbloqueado pode ler o diário.

## Estado do projeto

Em planejamento. O desenvolvimento é feito em 4 níveis de complexidade, cada um entregável sozinho. Veja o plano completo em [`ESCOPO.md`](ESCOPO.md).

| Nível | Foco | Situação |
|---|---|---|
| 1 | Escrever e reler dias, humor e hora | A fazer |
| 2 | Calendário com humores em cores | A fazer |
| 3 | Lembretes em dias futuros | A fazer |
| 4 | Extras | A fazer |

## Como rodar

O projeto usa React, Vite e TypeScript. Você precisa ter o [Node.js](https://nodejs.org/) instalado (versão 20.19 ou mais nova; recomendamos a versão LTS).

1. Baixe o repositório e entre na pasta dele pelo terminal.
2. Instale as dependências (só na primeira vez ou quando o `package.json` mudar):

   ```bash
   npm install
   ```

3. Rode o app em modo de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra no navegador o endereço que aparecer no terminal, normalmente <http://localhost:5173>. A página se atualiza sozinha quando você salva um arquivo. Para parar, aperte `Ctrl + C` no terminal.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm test` | Roda os testes uma vez (Vitest) |
| `npm run test:watch` | Roda os testes e repete a cada arquivo salvo |
| `npm run build` | Verifica os tipos e gera a versão final do site na pasta `dist/` |
| `npm run preview` | Abre a versão gerada pelo `build`, para conferir antes de publicar |
| `npm run lint` | Procura problemas comuns no código |

## Como contribuir

O projeto é aberto. Para sugerir algo, abra uma *issue* explicando a ideia. O guia de contribuição virá em uma etapa posterior.

## Licença

[MIT](LICENSE)
