# angular-start-project

An Angular 21 **template monorepo**: a starting point future setmy.info applications and websites
are cloned/scaffolded from. It is written for both human developers and AI agents that need to
build, test, and upgrade this project day to day, and to understand how it consumes the shared
[`setmy-info-less`](https://github.com/setmy-info/setmy-info-less) design system. See
[review.md](review.md) for the current plan, findings, and open work; see [AGENTS.md](AGENTS.md)
for hard constraints (Angular 21 style, no `node_modules` exploration, no destructive git
commands); see [unused.md](unused.md) for the LESS/CSS dead-code and cleanup plan.

This is an npm workspace monorepo. It does **not** mirror `setmy-info-less`'s internal package
layering (`base`/`extended`/`fancy`/`enterprise`/...) as a folder structure — that project's own
layering is *its* concern. This repo is one *consumer* of those packages, structured as its own
three npm workspaces.

## Workspace modules

- **[`angular-start-project`](packages/angular-start-project)** — the Angular application.
  Routing, components, services, build config. Depends on the other two.
- **[`angular-start-project-library`](packages/angular-start-project-library)** — pure JavaScript,
  framework-agnostic. Signals-friendly singleton services (`localStorageService`,
  `sessionStorageService`, `tenantService`, `translationService`, `consentService`) and shared
  models (`menuModel`). Must **not** import Angular — see `AGENTS.md`.
- **[`angular-start-project-style`](packages/angular-start-project-style)** — LESS. Composes
  `setmy-info-less` (base) and `setmy-info-less-extended` into this project's global stylesheet
  (`src/less/index.less`), plus anything genuinely new that doesn't belong upstream yet.

Two non-workspace directories also live under `packages/`, kept for reference/history, not part of
the npm workspace and not depended on by anything above:

- `packages/application.old` — a superseded Angular 13 scaffold (the project's pre-migration
  starting point, commit `c00c3ff` "Old components copied to new"). Historical reference only — do
  not build on it (see `review.md` section 6).
- `packages/application` — a bare, non-git-tracked build-artifact directory (`.angular/`, `dist/`
  cache only, no source). Safe to ignore or clean; not a real package.

### Dependency graph

```
angular-start-project-library   (pure JS, no dependencies of its own)
angular-start-project-style     (LESS; depends on setmy-info-less + setmy-info-less-extended,
                                  from the sibling setmy-info-less submodule)
        │
        └── angular-start-project   (the Angular app; depends on both packages above)
```

Every package's `package.json` declares its dependency, but there is no cumulative bundling model
here the way `setmy-info-less` has one for its own tree — `angular-start-project` simply imports
both sibling workspace packages directly (`angularStartProjectLibrary` for JS, the LESS source
tree for styles).

## Application architecture

### Services (`src/app/services`, all signals-based, `providedIn: 'root'`)

| Service           | State                                         | Purpose                                                                                             |
|-------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------|
| `ModalService`    | `isOpen` signal                               | Open/close/toggle for the side-nav off-canvas panel and its backdrop                                |
| `LanguageService` | `currentLanguageCode`, `translations` signals | Current language + translation lookup; loads translations asynchronously (see "Translations" below) |
| `MenuService`     | `rawMenuItems` signal from `menuModel.js`     | Menu item list shared by the header nav and the side navigation panel                               |
| `ConsentService`  | `hasConsented` signal                         | Cookie-consent state, backed by `angularStartProjectLibrary.consentService` (localStorage)          |

### Layout components (`src/app/components/layout`)

```
app (app.html)
├── header-panel                (nav + language buttons + mobile menu toggle)
│   └── consent-panel           (cookie-consent banner, last child of #headerPanel)
├── main-panel                  (<main><router-outlet/></main> + footer-panel)
│   └── footer-panel            (copyright line → routerLink="/terms", env badge)
├── side-navigation-panel       (off-canvas, driven by ModalService.isOpen; menu items +
│                                 language <select> below a horizontal rule)
├── modal-body-panel            (#modalBody backdrop; click closes the modal)
└── background                  (tsParticles canvas, afterNextRender + dynamic import)
```

### Views / routes (`src/app/components/views`, `app.routes.ts`)

| Path        | Component               | In main menu? | Notes                                                                                              |
|-------------|-------------------------|---------------|----------------------------------------------------------------------------------------------------|
| `/`         | `HomeComponent`         | yes           | Lorem Ipsum home page                                                                              |
| `/about`    | `AboutComponent`        | yes           | Lorem Ipsum about page                                                                             |
| `/contact`  | `ContactComponent`      | yes           | contact details as a definition list                                                               |
| `/settings` | `SettingsComponent`     | no            | diagnostic info (language, environment, service worker, referrer) — URL-only, matching the old app |
| `/terms`    | `TermsComponent`        | no            | legal text (et/en) — linked only from the footer copyright and the consent banner                  |
| `**`        | `ViewNotFoundComponent` | —             | 404 fallback                                                                                       |

## Consuming `setmy-info-less`

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

### Load order

The actual import tree of `angular-start-project-style/src/less/index.less`:

    index.less
      setmy-info-less/src/main/less/main.less        (base resets, tokens, utilities, devices, flex, components)
      setmy-info-less-extended/src/main/less/main.less (extended's own delta rules: section/modal/card/article)
      @font-face (Material Symbols Outlined, self-hosted)
      .material-symbols-outlined                       (FILL 1 — see "Design principles" below)
      .articleBody img, .applicationContentMain, .articleSectionPanel, .sectionHeaderPicture

Every component's own `*.component.less` is compiled separately by Angular and is **not** part of
this tree — see point 2 above.

## Translations

Translation strings live in static JSON, not in TypeScript/JS: `public/json/et.json`,
`public/json/en.json`, plus a small `public/json/translations-version.json` version manifest
(`{"et": 1, "en": 1}`, bumped by hand when a language file's content changes).

`angular-start-project-library/src/services/translationService.js` is the loader — framework
agnostic, so it stays in the library rather than the Angular layer:

1. Fetch `translations-version.json` (small, cheap, always fetched).
2. Compare the remote version for the requested language against the version cached in
   `localStorage` (`translations.version`) alongside the last-loaded translations
   (`translations.<lang>`).
3. If unchanged, resolve with the cached translations — **no second network request**.
4. If changed (or nothing is cached yet), fetch the full `json/<lang>.json`, cache both the content
   and the new version number, and resolve with the fresh translations.

`LanguageService` (`src/app/services/language.service.ts`) wraps this: `translations` starts as a
signal seeded from whatever is already cached (instant, synchronous — no flash of untranslated
keys on a warm cache) and is replaced once `loadTranslations()` resolves. A guard
(`if (this.currentLanguageCode() === code)`) discards a slow, now-stale response if the user
switched languages again before it arrived.

This is a template-specific design, not a straight port of the old `has-web-app-new-ng` app: that
app's `languageService.js` unconditionally re-fetched whenever online and only fell back to a
`localStorage` cache when `navigator.onLine` was false — it had no version-gate. The two fetch
calls here (`fetch('json/translations-version.json')`, `fetch('json/<lang>.json')`) are the only
places that would need to change to swap the static JSON files for a real REST backend later
(e.g. `GET /api/translations/<lang>/version` and `GET /api/translations/<lang>`) — every caller
only ever sees `getSupportedLanguages()`, `getCachedTranslations()`, and `loadTranslations()`.

## Design principles

- **Self-hosted Material Symbols, no CDN.** The `Material Symbols Outlined` icon font is
  self-hosted from `packages/angular-start-project/public/fonts/material-symbols-outlined.woff2`,
  fetched once via `npm pack material-symbols` into a scratch directory and copied in — it is
  **not** an npm dependency of this project, so it will not appear in `package.json`/`node_modules`
  on a fresh `npm install`. If the font file is ever missing (e.g. a clean checkout without it
  committed), re-fetch it:

  ```shell
  npm pack material-symbols --pack-destination /tmp
  tar xzf /tmp/material-symbols-*.tgz -C /tmp
  cp /tmp/package/material-symbols-outlined.woff2 packages/angular-start-project/public/fonts/
  ```

  Do not add a Google Fonts/Icons `<link>` back to `index.html` — see `review.md` section 4.

- **Icons render filled, not outlined.** `.material-symbols-outlined` sets
  `font-variation-settings: 'FILL' 1;`. No second font file is needed for this — the self-hosted
  `.woff2` is the real variable font (proven by the `@font-face` `font-weight: 100 700` range), so
  it already carries the `FILL` axis even though the class/family name only names the glyph-shape
  family (Outlined vs Rounded vs Sharp), not the fill state. This matches the old app's Material
  Icons look, which was filled-only by design.

- **Brand vs. web-page/app styling are two separate artifacts.** This project is a **webapp**, not
  a brand/marketing site — see `review.md` section 2 for why those are two separate deployable
  artifacts in the SMI/HASS ecosystem, not one themeable app. Don't add a runtime theme-switcher
  here; a brand deliverable is a separate build (see `angular-start-project-style/brand-example/`).

- **Angular 21 conventions are enforced, not optional** — see `AGENTS.md`: no `standalone: true`
  (default since v20), signals/`input()`/`output()`/`computed()`/`inject()`,
  `ChangeDetectionStrategy.OnPush`, native control flow (`@if`/`@for`/`@switch`, never
  `*ngIf`/`*ngFor`), no `ngClass`/`ngStyle` (use `[class.x]`/`[style.x]` bindings instead — this
  also sidesteps a real CSS-specificity bug: `.sideNavigationPanel { display: flex }` beats
  `.hidden { display: none }` at equal specificity, so visibility toggles use `[style.display]`).

## Environments

Per ADR-0041/ADR-0042, this project uses only the canonical setmy.info environment names as
Angular build/serve configuration names — there is no `production`/`development` configuration in
`angular.json`:

| Configuration | `envName` | `production` | `apiBaseUrl`                                       |
|---------------|-----------|--------------|----------------------------------------------------|
| `local`       | `local`   | `false`      | `http://localhost:4200`                            |
| `dev`         | `dev`     | `false`      | `https://dev.angular-start-project.setmy.info`     |
| `ci`          | `ci`      | `true`       | `https://ci.angular-start-project.setmy.info`      |
| `test`        | `test`    | `true`       | `https://test.angular-start-project.setmy.info`    |
| `prelive`     | `prelive` | `true`       | `https://prelive.angular-start-project.setmy.info` |
| `live`        | `live`    | `true`       | `https://angular-start-project.setmy.info`         |

Each configuration swaps in `src/environments/<name>.environment.ts` via `fileReplacements` (see
`src/environments/environment.model.ts` for the shape). Files are named `<name>.environment.ts`,
**not** `environment.<name>.ts` — Vitest's default test-file glob matches `*.test.ts`, which would
otherwise swallow `environment.test.ts`.

```shell
npx ng serve --configuration dev      # any configuration also works with serve
npm run build:dev -w angular-start-project   # or build:ci / build:test / build:prelive / build:live
```

## Development

### Setup

```shell
npm install     # installs all three workspaces at once (run from the repository root)
```

### Day-to-day commands (run from the repo root)

```shell
npm start -w angular-start-project             # dev server, "local" environment, http://localhost:4200/
npm test -w angular-start-project              # Vitest unit tests
npm run build -w angular-start-project         # production-shaped build, "local" environment
npm run watch -w angular-start-project         # incremental rebuild on change, "local" environment
```

### Updating/upgrading a shared package

```shell
npm update setmy-info-less setmy-info-less-extended --workspaces
```

Plain `npm install` respects the existing lockfile resolution and will **not** always pick up a
newer version that a loose range (like `"setmy-info-less": "*"` in `setmy-info-less-extended`'s own
`package.json`) would technically allow — `npm update <pkg> --workspaces` forces re-resolution
across every workspace at once and is the reliable way to bump a shared dependency. After updating,
run `npm ls setmy-info-less setmy-info-less-extended` to confirm every workspace resolved to the
same version — a stale nested copy under one workspace's own `node_modules` is the usual symptom of
a version conflict and will silently break LESS variable resolution.

### Quick full rebuild

One block to install everything, build every module that has something to build, run the unit
tests, and start the dev server. Copy-paste from a clean checkout:

```shell
# 1. Install all three workspaces (from the repository root)
rm -rf node_modules packages/*/node_modules
npm install

# 2. Build — angular-start-project-library and angular-start-project-style are pure
#    source (plain JS / LESS); Angular's own build step below compiles and bundles
#    them together, they have no separate build script of their own.
npm run build -w angular-start-project              # "local" environment
# or explicitly, per environment:
npm run build:dev -w angular-start-project
npm run build:ci -w angular-start-project
npm run build:test -w angular-start-project
npm run build:prelive -w angular-start-project
npm run build:live -w angular-start-project

# 3. Unit tests (Vitest, via the Angular builder)
npm test -w angular-start-project
#    angular-start-project-library and angular-start-project-style have no real
#    test runner wired up yet — their own "test" script is a placeholder that
#    exits 1 ("Error: no test specified"); don't run `npm test --workspaces`
#    at the root, it will fail on those two for that reason.

# 4. Start the dev server
npm start -w angular-start-project
#    → http://localhost:4200/
```

Then, in two more terminals, for E2E (see "E2E / Integration tests" below for details):

```shell
# Terminal 2
geckodriver --port 4444

# Terminal 3 (app from step 4 must still be running)
npm run e2e -w angular-start-project
```

## Testing

### Unit tests

Both the app and the library use [Vitest](https://vitest.dev/); spec/test files live next to the
source files they test.

```shell
npm test -w angular-start-project              # Angular app: @angular/build:unit-test + Vitest
```

- `angular-start-project` — `*.spec.ts` next to each component/service, e.g.
  `src/app/services/language.service.spec.ts` next to `language.service.ts`.
- `angular-start-project-library` — plain JS, framework-agnostic; no test runner is wired up yet
  (`"test": "echo \"Error: no test specified\" && exit 1"` in its `package.json`) — coverage for its
  services currently comes from the Angular-side specs that exercise them (e.g.
  `language.service.spec.ts` mocks `fetch`/`localStorage` to cover `translationService.js`'s
  version-check/cache logic end-to-end).

### E2E / Integration tests

E2E tests use [WebdriverIO](https://webdriver.io/) with the Jasmine framework and Firefox. Spec
files live in `packages/angular-start-project/test/specs/` and follow the `*.e2e.ts` naming
convention (see `test/specs/components.e2e.ts`).

**Prerequisites:** a running Selenium/GeckoDriver server on `localhost:4444` and the app running on
`localhost:4200` (see `wdio.conf.ts` for the full capabilities/timeout configuration).

```shell
# Terminal 1 – start the app
npm start -w angular-start-project

# Terminal 2 – start GeckoDriver (or Selenium Grid)
geckodriver --port 4444

# Terminal 3 – run E2E tests
npm run e2e -w angular-start-project
```

## Project history

This project's Angular app was migrated from `packages/application.old`, an Angular 13 scaffold
still built on the stock "Tour of Heroes" tutorial structure (`app.module.ts`, `NgModule`-based
routing, `karma.conf.js`). The migration replaced it with Angular 21 standalone/signals components,
native control flow, and this monorepo's three-workspace split. `packages/application.old` is kept
only as historical reference (see "Workspace modules" above) — do not build on it.

## TypeScript config note

`packages/angular-start-project/tsconfig.json` deliberately runs with relaxed strictness:

```jsonc
"strict": false,
"noImplicitAny": false,
"strictNullChecks": false
```

## Notes for AI agents

- Read `review.md` first; it tracks what is already decided vs. still open, though it is a
  point-in-time planning/execution log — verify any claim about current file layout or bug status
  against the actual code before acting on it, since later passes (including this document) may
  have already resolved items it lists as open.
- Read `unused.md` for the LESS/CSS dead-code inventory and the ordered cleanup plan — it is kept
  in sync with the current codebase (updated 2026-07-05).
- Before assuming a `setmy-info-less`/`setmy-info-less-extended` class or variable exists, check the
  actual package source (`packages/setmy-info-less*/src/main/less` in the `setmy-info-less`
  submodule) rather than guessing — `fancy`/`enterprise` are still empty skeletons, and much of the
  polished site chrome (header/footer/hero/tile blocks) only exists in the unstable
  `setmy-info-less-experimental` package, which this project does not currently depend on.
- Component-scoped LESS files need their own values import (see "Consuming `setmy-info-less`"
  above) — a bare `variable @xyz is undefined` build error almost always means that's missing, not
  that the variable doesn't exist.
- `npm ls setmy-info-less setmy-info-less-extended` is the fast way to check for a version-skew bug
  after editing any `package.json` in this workspace.
