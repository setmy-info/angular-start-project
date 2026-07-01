## Purpose

This repository is an Angular 21 **template monorepo**: a starting point future setmy.info
applications and websites are cloned/scaffolded from. It is written for both human developers and
AI agents that need to build, test, and upgrade this project day to day, and to understand how it
consumes the shared `setmy-info-less` design system. See [review.md](review.md) for the current
plan, findings, and open work; see [AGENTS.md](AGENTS.md) for hard constraints (Angular 21 style,
no `node_modules` exploration, no destructive git commands).

This guide is about **workflow**, not architecture. It does not mirror `setmy-info-less`'s internal
package layering — that project's `base`/`extended`/`fancy`/`enterprise` split is *its* concern.
This repo is one *consumer* of those packages, structured as its own three npm workspaces.

## Workspace modules

This is an npm workspace monorepo with three packages under `packages/`:

- **`angular-start-project`** — the Angular application. Routing, components, services, build
  config. Depends on the other two.
- **`angular-start-project-library`** — pure JavaScript, framework-agnostic. Signals-friendly
  singleton services (`localStorageService`, `sessionStorageService`, `tenantService`,
  `translationService`) and shared models (`menuModel`). Must **not** import Angular — see
  AGENTS.md.
- **`angular-start-project-style`** — LESS. Composes `setmy-info-less` (base) and
  `setmy-info-less-extended` into this project's global stylesheet
  (`src/less/index.less`), plus anything genuinely new that doesn't belong upstream yet
  (see "Consuming setmy-info-less" below).

`packages/application.old` is a superseded Angular 13 scaffold kept only for historical reference —
do not build on it (see review.md section 6).

## Day-to-day commands (run from the repo root)

```shell
npm install                                    # installs all three workspaces at once
npm start -w angular-start-project             # dev server, "local" environment, http://localhost:4200/
npm test -w angular-start-project              # Vitest unit tests
npm run build -w angular-start-project         # production-shaped build, "local" environment
```

### Environments

Per ADR-0041/ADR-0042, this project uses only the canonical setmy.info environment names —
`local`, `dev`, `ci`, `test`, `prelive`, `live` — as Angular build/serve configuration names. There
is no `production`/`development` configuration in `angular.json`; use the real environment name
instead:

```shell
npm run build:dev -w angular-start-project      # or build:ci / build:test / build:prelive / build:live
npx ng serve --configuration dev                # any configuration also works with serve
```

Each configuration swaps in `src/environments/<name>.environment.ts` via `fileReplacements`
(see `src/environments/environment.model.ts` for the shape). Files are named
`<name>.environment.ts`, not `environment.<name>.ts` — Vitest's default test-file glob matches
`*.test.ts`, which would otherwise swallow `environment.test.ts`.

### Updating/upgrading a single package

```shell
npm update setmy-info-less setmy-info-less-extended --workspaces
```

Plain `npm install` respects the existing lockfile resolution and will **not** always pick up a
newer version that a loose range (like `"setmy-info-less": "*"` in `setmy-info-less-extended`'s own
`package.json`) would technically allow — `npm update <pkg> --workspaces` forces re-resolution
across every workspace at once and is the reliable way to bump a shared dependency. After updating,
run `npm ls setmy-info-less setmy-info-less-extended` to confirm every workspace resolved to the
same version — a stale nested copy under one workspace's own `node_modules` is the usual symptom of
a version conflict and will silently break LESS variable resolution (see below).

### Consuming setmy-info-less

Two non-obvious things about importing `setmy-info-less`/`setmy-info-less-extended` from LESS:

1. **The package `"main"` field points at pre-built, already-compiled `dist/main.min.css`** — a
   plain `@import 'setmy-info-less';` pulls in compiled CSS with no LESS variables in scope.
   `angular-start-project-style/src/less/index.less` instead imports the **source** entry points
   explicitly (`setmy-info-less/src/main/less/main.less`,
   `setmy-info-less-extended/src/main/less/main.less`) so tokens like `@headerHeight`,
   `@sideNavWidth`, and the color variables are actually usable.
2. **Angular compiles each component's `styleUrl` LESS file in isolation** — the global tokens
   imported once in `angular-start-project-style/index.less` are not automatically in scope inside
   `*.component.less` files. Any component style that references a `setmy-info-less` variable needs
   its own `@import url("setmy-info-less/src/main/less/values/index.less");` at the top (values-only,
   no CSS output, safe to import repeatedly). Grep the existing layout components for examples.

`setmy-info-less-extended`'s distribution model is "delta, not bundle" — loading it alone gives you
only its own rules; you must load `setmy-info-less` first for the base resets/utilities.

### Brand vs. web-page/app styling

This project is a **webapp**, not a brand/marketing site — see review.md section 2 for why those
are two separate deployable artifacts in the SMI/HASS ecosystem, not one themeable app. Don't add a
runtime theme-switcher here; a brand deliverable is a separate build.

### Material Symbols (self-hosted, no CDN)

The `Material Symbols Outlined` icon font is self-hosted from
`packages/angular-start-project/public/fonts/material-symbols-outlined.woff2`, fetched once via
`npm pack material-symbols` into a scratch directory and copied in — it is **not** an npm
dependency of this project, so it will not appear in `package.json`/`node_modules` on a fresh
`npm install`. If the font file is ever missing (e.g. a clean checkout without it committed),
re-fetch it:

```shell
npm pack material-symbols --pack-destination /tmp
tar xzf /tmp/material-symbols-*.tgz -C /tmp
cp /tmp/package/material-symbols-outlined.woff2 packages/angular-start-project/public/fonts/
```

Do not add a Google Fonts/Icons `<link>` back to `index.html` — see review.md section 4.

## Notes for AI agents

- Read `review.md` first; it tracks what is already decided vs. still open.
- Before assuming a `setmy-info-less`/`setmy-info-less-extended` class or variable exists, check the
  actual package source (`packages/setmy-info-less*/src/main/less` in the `setmy-info-less`
  submodule) rather than guessing — `fancy`/`enterprise` are still empty skeletons and much of the
  polished site chrome (header/footer/hero/tile blocks) only exists in the unstable
  `setmy-info-less-experimental` package, which this project does not currently depend on.
- Component-scoped LESS files need their own values import (see above) — a bare
  `variable @xyz is undefined` build error almost always means that's missing, not that the
  variable doesn't exist.
- `npm ls setmy-info-less setmy-info-less-extended` is the fast way to check for a version-skew bug
  after editing any `package.json` in this workspace.
