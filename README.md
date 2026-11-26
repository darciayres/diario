# Diário

> Nome provisório.

Um aplicativo de **diário pessoal**, open source, que funciona no celular e no computador (PWA). Cada dia é um documento de texto, e o humor, a hora e os lembretes são escritos no próprio texto com comandos simples (`humor/4`, `hora/`, `lembrete/`).

Projeto da segunda unidade da disciplina, feito em grupo a partir do design system criado no Figma na primeira unidade.

**Acesse:** <https://diario-opal-delta.vercel.app>. O site é atualizado sozinho a cada envio para a branch `main`.

## Privacidade

Tudo o que você escreve fica **somente no seu aparelho**. Não há servidor, conta nem login. Por enquanto os dados **não são criptografados**: quem tiver acesso ao aparelho desbloqueado pode ler o diário.

## Estado do projeto

Em desenvolvimento. O que o app é e as regras dos comandos estão em [`docs/PRODUTO.md`](docs/PRODUTO.md). O objetivo atual (a primeira versão publicada) e a lista de tarefas, em ordem, estão em [`docs/MVP.md`](docs/MVP.md).

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
