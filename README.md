# Sparkfilmes - Site institucional + portfolio + area de clientes

Estrutura estatica em HTML, CSS e JS com foco em:

- Landing page de venda (Home)
- Portfolio com reels e cursos online
- Area "Seu material" com busca de cliente
- Template dinamico de entrega com dados em JSON

## Estrutura

```text
.
|-- index.html
|-- portfolio/index.html
|-- clientes/index.html
|-- clientes/material.html
|-- data/portfolio.json
|-- data/clientes/index.json
|-- data/clientes/cliente-modelo.json
`-- assets
    |-- css/style.css
    `-- js
        |-- main.js
        `-- cliente.js
```

## Rodar local

```powershell
python -m http.server 8080
```

Acesse: `http://localhost:8080`

## Ferramenta interna de orçamentos

Com o servidor local ativo, acesse:

```text
http://localhost:8080/area-interna/
```

A ferramenta usa `data/servicos.json` como base de profissionais, valores-hora,
tipos de produção e etapas. Toda duração é preenchida internamente em minutos; a
carga é convertida para horas apenas na prévia e nos documentos apresentados ao
cliente. O valor final pode ser ajustado antes de copiar ou abrir a mensagem no
WhatsApp oficial da SparkFilmes.

Ao selecionar `Cobertura de evento`, são carregados os pacotes oficiais Essencial,
Spark e Flame. Cada pacote possui equipe, entregas, preço comercial e campos de
minutos por etapa para acompanhar separadamente o custo técnico interno. O envio
pode apresentar o pacote previamente escolhido ou as três opções para o cliente
comparar antes de decidir.

Esta primeira versão é estática: a senha e os preços ficam acessíveis no código
publicado, e os orçamentos não são armazenados. Para validar os cálculos com Deno:

```bash
deno run --allow-read tests/orcamentos-core.test.js
```

## Agenda da equipe

Acesse `http://localhost:8080/agenda/` pela área interna. O calendário permite
selecionar datas, cadastrar e editar eventos e copiar uma página para a equipe.
O evento inicial está em `data/agenda.json`: Formatura IEMAB, em 22/11/2026,
às 19h, com chegada às 18h30. A colação tem duração estimada de 40 minutos,
com previsão de terminar até as 20h, seguida de um breve registro das crianças
brincando. A página compartilhável é
`/agenda/evento.html?id=formatura-iemab-22-novembro`.

As orientações aparecem em cards com ícones. No campo de edição, escreva um título
em MAIÚSCULAS para iniciar cada card e uma orientação por linha. `Exemplo:` destaca
uma fala de atendimento; `Contexto:` cria uma explicação que pode ser expandida.

O catálogo publicado é compartilhado por todos. Novos eventos e alterações são
salvos no `localStorage` do navegador. Para esses registros, o botão Copiar link
inclui uma cópia dos dados no fragmento da URL, que funciona em outro dispositivo
sem depender do armazenamento de quem criou. Alterações posteriores exigem enviar
um novo link; não existe sincronização entre navegadores. Para atualizar o catálogo
comum e manter links curtos, edite `data/agenda.json` e publique o site normalmente.

A agenda usa o acesso existente da área interna. As páginas de evento abrem sem
senha para a equipe com o link, e têm `noindex, nofollow`; isso não é controle de
acesso. Não cadastre dados sigilosos. O formulário não envia dados a serviços externos.

Localização conforme o convite, preservando o número 346. A produção confirmou
o [link da Unidade 2](https://share.google/IQVIEFLTdwTL0nHnp) e o
[Instagram @bretaskids2](https://www.instagram.com/bretaskids2/).
Três fotos de referência da [Insette Fotografia](https://www.insettefotografia.com.br/portfolio/festas-infantis/1404666-aniversario-de-3-anos-do-francisco-espaco-bretas-2)
aparecem na página, com crédito e indicação de que mostram outro evento.
As imagens estão em `assets/img/agenda/`, com suas fontes no README da pasta.

Validação: `deno run --allow-read tests/agenda.test.js`.

## Editor de vídeo local

Depois de entrar na área interna, acesse:

```text
http://localhost:8080/editor/
```

O Spark Cut importa e processa os takes no próprio navegador. A primeira versão
inclui montagem com vários clipes, receitas para aftermovie, conteúdo e criativo
de vendas, timeline não destrutiva, cortes manuais, detecção de pausas, ajustes
de cor e voz, zoom, speed ramp, legendas manuais/SRT, transcrição local com
Whisper, análise visual e masterização de áudio em WebAssembly, trilha
generativa, narração em português com IA e exportação em MP4 ou WebM, conforme
o suporte do navegador. Os modelos são baixados na primeira utilização, mas os
arquivos e o áudio dos takes não são enviados para processamento.

O editor também aceita um gerador de música externo sem transformar o site em
uma aplicação dinâmica. Configure a URL do adaptador no `editor/index.html`:

```html
<meta name="spark-music-api" content="https://api.seudominio.com/music" />
```

O endpoint recebe `POST` JSON com `prompt`, `duration`, `preset` e
`projectType`. Ele pode responder com o arquivo de áudio diretamente, com
`{ "audioUrl": "..." }` ou com `{ "audioBase64": "...", "mimeType":
"audio/mpeg" }`. O recomendado é um endpoint serverless no mesmo domínio:
a chave do provedor fica em variável de ambiente no servidor e nunca aparece
no HTML ou JavaScript público. Sem endpoint configurado, a trilha local é usada
automaticamente como fallback.

Para validar o núcleo da timeline:

```bash
deno run tests/editor-core.test.js
```

## Personalizacao rapida

1. WhatsApp oficial
- Em cada pagina, ajustar `data-whatsapp-number` no `<body>`.

2. Videos do portfolio
- Editar `data/portfolio.json`.
- Preencher os IDs reais do YouTube em `id`.

3. Clientes e busca
- Editar `data/clientes/index.json` para listar clientes na busca.
- Cada cliente deve ter `slug` e `url` para `material.html?cliente=slug`.

4. Entregas por cliente
- Criar arquivos como `data/clientes/<slug>.json`.
- Seguir o formato de `cliente-modelo.json`.

5. Entregas de formatura
- Para trabalhos anuais de formatura, usar `data/clientes/formatura-modelo.json` como base.
- O redirect correspondente fica em `clientes/formatura-modelo.html`.
- Esse modelo ja inclui: foto da turma em destaque, botoes por aluno (fotos, videos, foto da turma, festa), senha, prazo geral e estrutura de alunos.

## Observacao sobre o player do YouTube

O site usa iframe com controles nativos ocultos e botoes proprios (`Play`, `Pause`, `Stop`).
Isso reduz distracoes, mas a marca/infra do YouTube ainda depende das regras da plataforma.
