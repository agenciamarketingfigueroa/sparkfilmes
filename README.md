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

Senha da versão de teste: `spark2026`

A ferramenta usa `data/servicos.json` como base de profissionais, valores-hora,
tipos de produção e etapas. Ela calcula pacotes, diárias/horas técnicas e projetos
sob medida, permitindo ajustar o valor final antes de copiar ou abrir a mensagem
no WhatsApp oficial da SparkFilmes.

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
