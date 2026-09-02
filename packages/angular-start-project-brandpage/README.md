# angular-start-project-brandpage

A brand page starter: static HTML, one stylesheet, and Vue loaded the old-school way — a global
build in a `<script>` tag, no bundler, no build step for the JavaScript. Everything here is
Lorem Ipsum placeholder content meant to be replaced.

It is deliberately NOT the webapp. It shares no shell, no router and no component model with
`packages/angular-start-project`; the only thing it borrows is the brand design system in
`angular-start-project-brand-style` (which is itself separate from the webapp styles).

## Layout

    src/
      index.html      about.html      contact.html
      less/index.less   page styles, compiled to dist/css/
      js/main.js        the Vue app, copied verbatim to dist/js/
      images/           placeholder imagery

`npm run build` compiles the LESS, copies the static files, and drops Vue's `vue.global.prod.js`
in next to `main.js`. The result in `dist/` is a complete, self-contained site directory that can
be served by any web server with no runtime dependencies.

## Adding another brand page

Brand pages are meant to multiply. To add one:

1. Copy this directory to `packages/angular-start-project-<name>-brandpage`.
2. Change `name` in its `package.json` and give it its own `config.server.port`.
3. Add the directory to `workspaces` in the root `package.json`.
4. Add the package name to `config.bundle.brands` in the root `package.json`.

Step 4 is what puts it in the deployment bundle, under `brands/<package name>/`. See
`scripts/bundle.js`.
