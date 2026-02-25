# SparkFilmes - Landing Page

Landing page estatica para captacao de clientes da SparkFilmes, pronta para deploy no GitHub Pages.

## Estrutura

```text
.
|-- 404.html
|-- index.html
|-- robots.txt
|-- sitemap.xml
|-- .nojekyll
`-- assets
    |-- img
    |   `-- og-image.svg
    |-- css
    |   `-- styles.css
    `-- js
        `-- main.js
```

## Como rodar localmente

Como a pagina e estatica, basta abrir o `index.html` no navegador.  
Se preferir servidor local:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Personalizacao obrigatoria

Antes de publicar, ajuste:

1. Numero de WhatsApp em `assets/js/main.js` (`whatsappNumber`).
2. Links e dados da empresa em `index.html` (Instagram, email, endereco, nome legal).
3. URL oficial da pagina em:
   - tag `canonical` no `index.html`
   - metatags Open Graph no `index.html`
   - `sitemap.xml`
4. Conteudo do portfolio, depoimentos e metricas com dados reais.

## Deploy no GitHub Pages

1. Commit e push para o repositorio.
2. No GitHub: `Settings` -> `Pages`.
3. Em `Build and deployment`, selecione:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` (ou a branch desejada) / `/ (root)`
4. Salve e aguarde a publicacao.
5. A URL final aparece na mesma tela do GitHub Pages.
