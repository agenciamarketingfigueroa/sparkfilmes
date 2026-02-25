# Sparkfilmes - Site Institucional + Portal de Clientes

Estrutura estatica em HTML, CSS e JS para:

- Home institucional com foco em conversao e autoridade
- Portfolio visual
- Paginas de servicos e contato
- Portal de clientes com entregas organizadas por diaria/projeto
- Dados carregados por JSON e arquivos hospedados no Google Drive

## Estrutura do projeto

```text
.
|-- 404.html
|-- index.html
|-- robots.txt
|-- sitemap.xml
|-- .nojekyll
|-- portfolio
|   `-- index.html
|-- servicos
|   `-- index.html
|-- contato
|   `-- index.html
|-- clientes
|   |-- index.html
|   `-- cliente-modelo.html
|-- data
|   `-- clientes
|       `-- cliente-modelo.json
`-- assets
    |-- css
    |   `-- style.css
    |-- js
    |   |-- main.js
    |   `-- cliente.js
    `-- img
        |-- og-image.svg
        `-- placeholders
            |-- portfolio-01.svg ... portfolio-06.svg
            `-- entrega-01.svg ... entrega-06.svg
```

## Como rodar localmente

Opcao simples com servidor local:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Pontos de personalizacao obrigatoria

1. WhatsApp:
   - Procurar por `https://wa.me/5500000000000` e substituir pelo numero oficial.
2. Cases/portfolio:
   - Trocar imagens em `assets/img/placeholders`.
   - Atualizar textos das paginas `index.html` e `portfolio/index.html`.
3. Portal de clientes:
   - Editar `data/clientes/cliente-modelo.json`.
   - Trocar links `linkPasta` e `linkDownload` para URLs reais do Google Drive.
4. Dados institucionais:
   - Revisar email, Instagram e descricoes em `contato/index.html`.
5. URL oficial:
   - Ajustar `canonical`, `og:url` e `sitemap.xml`.

## Como adicionar novo cliente no portal

1. Duplicar `data/clientes/cliente-modelo.json` para um novo slug (ex.: `cliente-alpha.json`).
2. Duplicar `clientes/cliente-modelo.html` para `clientes/cliente-alpha.html`.
3. No arquivo HTML novo, alterar `data-json-path` para o JSON correto.
4. Adicionar card do cliente em `clientes/index.html`.

## Observacoes de arquitetura (MVP)

- O site nao armazena arquivos de entrega.
- O Google Drive funciona como storage.
- O portal e a camada visual de organizacao.
- Estrutura preparada para evoluir com:
  - Login real (Cloudflare Access / Firebase / Supabase)
  - Filtro por mes/ano
  - Busca por entregas
  - Novos status de fluxo (Em edicao / Revisao / Entregue)

## Deploy no GitHub Pages

1. Commit e push para o repositorio.
2. No GitHub: `Settings` -> `Pages`.
3. Em `Build and deployment`, selecione:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` e pasta `/ (root)`
4. Salve e aguarde a publicacao.
