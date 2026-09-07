# angular-start-project-brandpage

A brand page starter: plain old-school HTML, CSS and JavaScript. No bundler, no preprocessor, no
build output. `src/` **is** the served folder and everything in it is committed, so pointing any
static server at it serves the finished site.

    npm start --workspace=angular-start-project-brandpage      # http://127.0.0.1:8110

It is deliberately NOT the webapp. Brand pages are public-facing, fancy, campaign-driven, and
exist largely to promote an application; `packages/angular-start-project` is enterprise UI. They
share no shell, no router and no component model.

## Two examples in one package

The package ships two independent brand pages, so the same starter shows two different looks:

|            | pages                                                | stylesheets                                   | script             |
| ---------- | ---------------------------------------------------- | --------------------------------------------- | ------------------ |
| **First**  | `index` `about` `contact`                            | all four SMI stylesheets + `brand.css`        | `main.js`          |
| **Second** | `previous-index` `previous-about` `previous-contact` | `setmy-info-less` base + `previous-brand.css` | `previous-main.js` |

The first is the SMI brand page design system: panel stack, dot rail, slogan rows, promotion band,
privacy overlay, consent bar. The second is a plainer take — masthead with tab navigation, banner,
inline-block cards, a two-column row and a footer — and uses none of the design system, only the
base stylesheet. They share nothing but that base, their images and Vue. A real deployment keeps
one set and deletes the other, including from `sitemap.xml`.

## Layout

    src/                      the served folder — all of it committed
      index.html about.html contact.html                      first example
      previous-index.html previous-about.html previous-contact.html   second example
      robots.txt sitemap.xml      ordinary files, nothing generates them
      css/
        brand.css  brand.min.css                 first example, hand-written + minified twin
        previous-brand.css  previous-brand.min.css    second example
        setmy-info-less*.min.css                 copied out of node_modules
      js/
        main.js  main.min.js                     first example
        previous-main.js  previous-main.min.js   second example
        vue.global.prod.js                       copied out of node_modules
      images/  favicon.ico

## What the build does

`npm run build` fills in only the files nobody hand-writes, and writes them back into `src/` to be
committed:

    npm run copy-dependencies    node_modules -> src/css, src/js
    npm run minify               brand.css -> brand.min.css, main.js -> main.min.js

Both read the list in this package's own `dependencies.js`, so a brand page copied to a new
directory brings its list with it. The SMI modules publish an already-minified
`dist/main.min.css`, so nothing needs minifying on the way in; the order in that list is the
order the stylesheets must be linked in the HTML:

    setmy-info-less -> setmy-info-less-extended -> setmy-info-less-fancy -> setmy-info-less-brandpage

The markup uses the design system's own contract — `#hdr`, `#dots`, `#stage`, `.panel`/`.pb`/`.pc`,
`.btop`, `.srow`, `.ph`, `.cw`, `.so`, `#prv`, `#gb` — and `<body>` carries the page class it
expects (`brandIndexPage`, `brandAboutPage`). Vue drives exactly the five interactions the module
documents: privacy overlay open/close, consent accept, language select, panel select.

## SEO

Written out in full in each file, because nothing generates them: per-page `<title>`,
description, canonical, Open Graph, Twitter card and JSON-LD in the HTML; `robots.txt` and
`sitemap.xml` as ordinary committed files. What you read locally is byte-for-byte what gets
served.

`robots.txt` is open by default — a brand page wants search engines, AI answer engines and social
preview fetchers — and closed to model-training crawlers. That is the opposite default to the
application's own `robots.txt`, which carries the full reasoning for the split.

## Packaging

`npm run package` archives `src/` as `dist/angular-start-project-brandpage-<version>.tar.gz`, with
a single top-level directory named after the package. Any number of brand pages and applications
can therefore be unpacked side by side on a target host without colliding. The same directory also
goes into the combined `build/angular-start-project.tar.gz` under `brands/<package name>/`.

## Adding another brand page

1. Copy this directory to `packages/angular-start-project-<name>-brandpage`.
2. Change `name` in its `package.json` and give it its own `config.server.port`.
3. Rewrite the SEO in its HTML, `robots.txt` and `sitemap.xml` — its own host and social card.
4. Add the directory to `workspaces` in the root `package.json`.
5. Add the package name to `config.bundle.brands` in the root `package.json`.
6. `npm install && npm run build --workspace=angular-start-project-<name>-brandpage`.
