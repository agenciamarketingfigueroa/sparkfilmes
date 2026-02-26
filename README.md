# Sparkfilmes - Site institucional + portfolio + area de clientes

Estrutura estatica em HTML, CSS e JS com foco em:

- Landing page de venda (Home)
- Portfolio com reels 9:16 e cursos 16:9
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

## Observacao sobre o player do YouTube

O site usa iframe com controles nativos ocultos e botoes proprios (`Play`, `Pause`, `Stop`).
Isso reduz distracoes, mas a marca/infra do YouTube ainda depende das regras da plataforma.
