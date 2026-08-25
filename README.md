# angular-start-project

> **⚠ LICENSING — not uniformly MIT.** This repository mixes the MIT-licensed template with
> **proprietary SMI / Hear And See Systems (HASS) content** migrated from the old setmy.info
> product (branding, legal texts, and library services still awaiting a per-file decision). The
> proprietary license text is pending; external developers need separate permission for those
> parts. Read [LICENSE.md](LICENSE.md) and the "Licensing" section below before using anything
> from this repository.

An Angular 21 **template monorepo**: a starting point future setmy.info applications and websites
are cloned/scaffolded from. It is written for both human developers and AI agents that need to
build, test, and upgrade this project day to day, and to understand how it consumes the shared
[`setmy-info-less`](https://github.com/setmy-info/setmy-info-less) design system. See
[review.md](review.md) for the current plan, findings, and open work; see [AGENTS.md](AGENTS.md)
for hard constraints (Angular 21 style, no `node_modules` exploration, no destructive git
commands); see [unused.md](unused.md) for the LESS/CSS dead-code and cleanup plan.

This is an npm workspace monorepo. It does **not** mirror `setmy-info-less`'s internal package
layering (`base`/`extended`/`fancy`/`enterprise`/...) as a folder structure — that project's own
layering is _its_ concern. This repo is one _consumer_ of those packages, structured as its own
three npm workspaces.

## Workspace modules

- **[`angular-start-project`](packages/angular-start-project)** — the Angular application.
  Routing, components, services, build config. Depends on the other two.
- **[`angular-start-project-library`](packages/angular-start-project-library)** — pure JavaScript,
  framework-agnostic. Signals-friendly singleton services (`localStorageService`,
  `sessionStorageService`, `tenantService`, `translationService`, `consentService`,
  `contentService`, `sessionService`, `uuidService`, `statisticsService`, `versionService`, plus
  `dbService` and
  `loadingService` provided for later usage), the fetch-based `resourceFactory`, shared `config`
  (feature flags + resource URLs), `constants`, and shared models (`menuModel`). Must **not**
  import Angular — see `AGENTS.md`. Also pulls in the old setmy.info site's legacy `jsdi` service
  layer as real npm dependencies — see "Legacy `jsdi` service layer" below.
- **[`angular-start-project-style`](packages/angular-start-project-style)** — LESS for the
  **webapp**. Composes `setmy-info-less` (base) and `setmy-info-less-extended` into this
  project's global stylesheet (`src/less/index.less`), plus anything genuinely new that doesn't
  belong upstream yet.
- **[`angular-start-project-brand-style`](packages/angular-start-project-brand-style)** — LESS
  for **brand pages**. A brand page usually looks nothing like the webapp, so its design system
  is a separate module: composes `setmy-info-less` base only (no `extended`, no app-shell
  chrome), holds the brand classes (`.brandHero`, `.brandSection`, …), and hosts the buildable
  `brand-example/` page. Apps depend on `angular-start-project-style`; brand pages depend on
  this — neither imports the other. See "Brand example" below.

Three non-workspace directories also live under `packages/`, kept for reference/history, not part
of the npm workspace and not depended on by anything above:

- `packages/application.old` — a superseded Angular 13 scaffold (the project's pre-migration
  starting point, commit `c00c3ff` "Old components copied to new"). Historical reference only — do
  not build on it (see `review.md` section 6).
- `packages/application` — a bare, non-git-tracked build-artifact directory (`.angular/`, `dist/`
  cache only, no source). Safe to ignore or clean; not a real package.
- `packages/angular-original` — a disposable, un-customized `ng new` baseline, its own nested git
  repository (own history, not a registered git submodule of this repo yet). Regenerated from
  scratch on every Angular CLI upgrade — wipe its content and re-run
  `ng new angular-original --style=less --test-runner=vitest --defaults` with the current global
  `ng`, then commit the result as-is — so the diff between two generations shows exactly what the
  CLI's own generator changed between versions, isolated from anything this project customized.
  Never edited by hand and never depended on by anything above.

### Dependency graph

```
angular-start-project-library      (pure JS, no dependencies of its own)
angular-start-project-style        (LESS, webapp; depends on setmy-info-less + setmy-info-less-extended,
                                     from the sibling setmy-info-less submodule)
        │
        └── angular-start-project  (the Angular app; depends on both packages above)

angular-start-project-brand-style  (LESS, brand pages; depends on setmy-info-less base ONLY —
                                     a separate tree on purpose, no edge to/from the webapp packages)
        │
        └── brand-example/         (static brand page inside the same package)
```

Every package's `package.json` declares its dependency, but there is no cumulative bundling model
here the way `setmy-info-less` has one for its own tree — `angular-start-project` simply imports
both sibling workspace packages directly (`angularStartProjectLibrary` for JS, the LESS source
tree for styles).

## Legacy `jsdi` service layer

The old setmy.info site (`has-web-app-new-ng`) had its own hand-rolled dependency-injection
service layer, internally called `jsdi` — a global registry (`window.jsdi`) with
`jsdi.service(name, factory)`/`jsdi.get(name)`, plus prototype extensions on `String`/`Array`/
`Storage`. That code has since been split out of the old app into standalone, independently
published npm packages, each a sibling git submodule during development:

| Package (npm + submodule) | Depends on      | Adds to `jsdi.services`                                                                      |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `js-api-extend`           | —               | (none — `String`/`Array`/`Storage` prototype extensions only)                                |
| `servicejs`               | `js-api-extend` | the `jsdi` container itself (`service()`/`get()`/`initServices()`)                           |
| `servedjs`                | `servicejs`     | `$log`, `$browser`, `$localStorage`, `$sessionStorage`, `$placeholders`, `$timer`, `$router` |
| `servedjs-geo`            | `servedjs`      | `$geo`                                                                                       |

`angular-start-project-library` depends on all four as ordinary npm dependencies (published on
the public registry — **not** consumed as local/workspace packages, unlike this repo's own
three/four internal workspaces). `packages/angular-start-project/angular.json` lists all four in
`allowedCommonJsDependencies` (same reason as `angular-start-project-library` itself — they're
CommonJS, not ESM).

**Bootstrapping happens from `main.ts`, not from inside the library**, as plain side-effect
imports (`import 'js-api-extend'; import 'servicejs'; import 'servedjs'; import 'servedjs-geo';`),
each attaching its services to the global `jsdi` registry. This is a deliberate, non-obvious
choice: `angular-start-project-library` is excluded from the dev-server's dependency pre-bundling
(`angular.json` `serve.options.prebundle.exclude`, for hot-reload on that workspace package — see
the "Firewall"/dev-server notes above); a file _inside_ an excluded package doing
`require('servedjs-geo')` breaks esbuild's bundling of that real npm dependency and surfaces in
the browser as `Uncaught Error: Dynamic require of "servedjs-geo" is not supported`. Loading the
chain from Angular app source instead sidesteps that entirely.
`angular-start-project-library/src/legacyServiceLayer.js` is therefore only a **live accessor** —
a `get jsdi()` getter that reads `window.jsdi` at call time — never a `require()` of the vendor
chain itself, so it works regardless of when those side-effect imports actually ran.

**A small working example exists** in `src/app/app.config.ts` (`logAppOpenedTimeAndTimezone` /
`logAppOpenedLocationOnce`, wired via `provideAppInitializer`): `angularStartProjectLibrary.jsdi.get('$log')`
is the shortest way to reach any legacy service (`$log` defaults to `OFF`, so raise its level
before it prints anything), and `jsdi.get('$geo').newWatcher(success, error)` is the (only, since
this legacy API has no plain "get current position once" call) way to read a device location —
`.start()`/`.stop()` inside the success callback turns its continuous `watchPosition` into a
single one-shot read. Both are self-contained, clearly commented try-it-out examples — delete the
function and its one `provideAppInitializer(...)` line to remove either. The location example also
populates `LocationService` (`src/app/services/location.service.ts`, a normal Angular signal
service — not part of `jsdi`) so the Settings page can show Google Maps / OpenStreetMap links for
the last known position.

## Application architecture

### Services (`src/app/services`, all signals-based, `providedIn: 'root'`)

| Service             | State                                                                                             | Purpose                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ModalService`      | `isOpen` signal                                                                                   | Open/close/toggle for the side-nav off-canvas panel and its backdrop                                                                                                                                                                    |
| `LanguageService`   | `currentLanguageCode`, `translations` signals                                                     | Current language + translation lookup; loads translations asynchronously (see "Translations" below); the choice persists across reloads (localStorage `LANG`, like the old app); records a `change` statistics event on language switch |
| `MenuService`       | `rawMenuItems` signal from `menuModel.js`, plus a `headerMenuItems` computed                      | Per-tenant menu set (`menuModel.getMenuItems(tenant)`); side navigation shows every item, the top header nav only items whose `header` flag isn't `false`                                                                               |
| `ConsentService`    | `hasConsented` signal                                                                             | Cookie-consent state, backed by `angularStartProjectLibrary.consentService` (localStorage); `accept()`/`revoke()` grant or withdraw it                                                                                                  |
| `NetworkService`    | `isOnline` signal                                                                                 | window `online`/`offline` listeners; drives the header's offline (`signal_wifi_off`) indicator                                                                                                                                          |
| `LocationService`   | `lastKnownPosition`, `lastError` signals                                                          | Last device position from the `$geo` startup example + Google Maps / OpenStreetMap URL builders (Settings page)                                                                                                                         |
| `ContentService`    | `content` signal                                                                                  | Per-tenant content JSON (`json/content/<tenant>/<lang>.json`), reloaded on language change — contact data, page title, sub-system (see "Per-tenant content" below)                                                                      |
| `PageTitleService`  | `pageTitleKey` computed                                                                           | Single owner of the URL→title-key mapping (header title + translated `document.title`), and records a page-visit statistics event per navigation                                                                                        |
| `PwaUpdateService`  | `state` signal (mirrors the library), `showUpdateBanner`/`activating`/`controllerState` computeds | Thin adapter over `SwUpdate`: translates `VERSION_*` events into the library's update state machine, re-checks periodically, activates + reloads (see "Progressive Web App / offline support")                                          |
| `PwaInstallService` | `state` signal (mirrors the library), `showInstallBanner`/`canInstall`/`standalone` computeds     | Thin adapter over the `beforeinstallprompt` event captured in `main.ts`; `install()` shows the browser's install dialog, `dismiss()` suppresses the banner                                                                              |

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

| Path                                                                                              | Component                                             | Header nav | Side nav | Notes                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                                                                               | `HomeComponent`                                       | yes        | yes      | Lorem Ipsum home page                                                                                                                                        |
| `/about`                                                                                          | `AboutComponent`                                      | no         | no       | Lorem Ipsum about page — kept for reference, URL-only, not in `menuModel.js`                                                                                 |
| `/contact`                                                                                        | `ContactComponent`                                    | yes        | yes      | icon/label/text rows fed from the per-tenant content JSON; three bank rows behind the `bankAccounts` feature flag                                            |
| `/settings`                                                                                       | `SettingsComponent`                                   | no         | yes      | diagnostic info (version, language, environment, sub-system, browser, service worker, referrer, location)                                                    |
| `/terms`                                                                                          | `TermsComponent`                                      | no         | no       | legal text (et/en) — linked only from the footer copyright and the consent banner                                                                            |
| `/privacy`                                                                                        | `PrivacyComponent`                                    | no         | no       | privacy policy (et/en), ported from the old site — includes a cookie-consent withdrawal checkbox                                                             |
| `/productsServices`, `/news`, `/help`, `/tools`, `/commercials`, `/ads`, `/sponsors`, `/template` | one Lorem-Ipsum view component each (`views/<name>/`) | no         | no       | the old app's full page set, routed 1:1 with the old paths; URL-only, not in any menu (same as the old app, where these were commented out of the menu sets) |
| `**`                                                                                              | `ViewNotFoundComponent`                               | —          | —        | 404 fallback                                                                                                                                                 |

`menuModel.js` (in `angular-start-project-library`) is the single source of the menu items: an
`ALL_MENUS` catalog plus per-tenant menu sets, selected via `menuModel.getMenuItems(tenant)` with
the tenant coming from `tenantService.getTenant()` (the new-solution equivalent of the old app's
per-system `ngo*`/`llc*` menu sets). `MenuService.rawMenuItems` feeds the side navigation panel
as-is, while `MenuService.headerMenuItems` filters out any item with `header: false` (currently
just Settings) for the top header nav.

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

## Migrated functionality (old solutions → this template)

Functionality carried over from the old setmy.info solutions — the Angular 13 app
(`has-web-app-new-ng`, still live at `https://setmy.info/old/`), its shared JS `library`
package, and the even older Vue.js app. The gap analysis and per-item work orders live in
`missing-functionality.md` (tracked with IMPLEMENTED / PARTIALLY IMPLEMENTED / NOT IMPLEMENTED
tags); this section documents how the migrated pieces work **now**, in this codebase.

### Startup log: build version + session id

At bootstrap the app logs the same line both old apps did:
`App started: {version: 1.0.0-SNAPSHOT} , for: <uuid>` (`logAppStarted` in `app.config.ts`, via
the legacy `$log`). The version is **not** a git hash — it is a build stamp:
`bin/versionModule.js` writes the `package.json` version into `src/app/config/version.ts`
(npm script `ver`; also runs automatically as `prebuild`, and the generated file is committed so
plain `ng build` works too). The UUID is a per-browser-session id: `uuidService.js`
(`crypto.randomUUID`) + `sessionService.js` in the library, persisted in sessionStorage under
`sessionId`; creating it also records the session-`create` and external-`referrer` statistics
events. The version is also shown on the Settings page.

### Statistics / telemetry (batched, feature-gated)

Library `statisticsService.js`: an in-memory event batch (capped at 500, `constants.js
STATISTICS_LIMIT`) with `add`/`write`/`send`, flushed through `statisticsResource.js` — which
POSTs to `rest/statistics` **only when `config.features.statistics` is on** (it is off by
default, so nothing is sent anywhere; turn the flag on once a backend exists). Events recorded:
session create + external referrer (sessionService), language change
(`LanguageService.changeLanguage`), and one page-visit event per router navigation
(`PageTitleService` — the Angular equivalent of the old Vue app's global page mixin).

### Feature toggles

`config.features` flags in the library (`src/config/index.js`: `bankAccounts`, `statistics`,
`somethingElse`) + the `FeatureDirective` (`src/app/directives/feature.directive.ts`):
`<div feature="bankAccounts">…</div>` renders hidden (`display: none`) while the flag is false —
same behavior as the old app's attribute directive and the Vue `v-feature`. Live demo: the three
bank rows on the contact page.

### Per-tenant content

The old app loaded per-system content JSON (`pagesService`); here it is
`json/content/<tenant>/<lang>.json` (tenant from `tenantService.getTenant()`, `default` on
localhost), loaded by the library's `contentService.js` with the **same version-checked
localStorage cache pattern as translations** (`json/content/versions.json` is always fetched;
the content file only when its version changed; offline falls back to the cache). The Angular
`ContentService` re-loads it on every language change. Current content shape: `pageTitle`,
`subSystem`, and the full `contacts` block (organisation/address/phone/email, social links,
bank/SWIFT/account) that the contact page renders — contact data is **not** hardcoded in the
template anymore.

### Browser tab title per page

`PageTitleService` maps the current URL to a translation key (single source — the header panel
shows the same key) and keeps `document.title` set to the translated title
(`<Page> — <App title>`), re-translated when the language changes.

### REST resource layer

Library `resources/resourceFactory.js` — the fetch-based port of the old axios factory: base URL
and timeout from `src/config/index.js` (`resources.jsonUrl`/`restUrl`/`timeout`),
`AbortSignal.timeout` for the timeout, `requestHook`/`responseHook` as the interceptor
equivalents. Statistics and per-tenant content both go through it, so swapping
static JSON for a real REST backend is a change in one file per resource.

### Version newness detection + language persistence

`versionService.js` (library) compares the running build stamp against the version stored in
localStorage (`appVersion`) from the previous visit: the startup log prints
`New app version: <v> (previous: <old>)` when it changed, and the Settings page appends
"(new version)" to the version row for that first visit on a new build. The selected language
persists the old app's way too — localStorage key `LANG`, read at startup, written on every
language switch — so a reload keeps the user's language instead of resetting to Estonian.

### Provided for later usage (nothing calls them yet, by design)

- `dbService.js` — promise-based IndexedDB layer (`open`/`put`/`get`/`getAllKeys`/`delete`/
  `clear`/`close` around database `HASDB` with a generic `keyValue` store); the modern rework of
  the old app's callback-style skeleton.
- `loadingService.js` — promise-based `loadJS(url)`/`loadCSS(url)` runtime loaders appending to
  `document.head`, deduplicated per URL.

### PWA state, framework-independent

- `pwaUpdateService.js` — the "a new build is waiting" state machine: `available`, `dismissed`,
  `activating`, `currentVersion`/`availableVersion`, `lastCheckedAt`, `error`, `unrecoverable`,
  plus `subscribe(listener)`. Touches no DOM and no service worker, so it is unit tested in a
  plain Node process (`test/unit/pwaUpdateService.test.js`).
- `pwaInstallService.js` — the "Add to home screen" state: owns the captured `beforeinstallprompt`
  event, `shouldPrompt` (installable, not already installed, not recently dismissed), and the
  persisted "Later" (localStorage `pwaInstallDismissedAt`). `listen()` is the only browser-coupled
  part and is a no-op outside a browser.

Both are configured from `src/config/index.js` → `config.pwa` (`updateCheckIntervalMs`,
`reloadOnActivate`, `installPromptDismissDays`) and are the reason the Angular services above are
only ~100 lines of adapter each.

### Smaller migrated pieces (documented in their own sections above)

- Consent/cookie banner (`consent-panel`, localStorage-backed, accept/revoke)
- Offline indicator in the header (`NetworkService`, `signal_wifi_off` icon)
- Per-page title in the header panel
- Contact page icon/label/text row layout (old `contacts-page` structure, filled Material icons)
- Side-nav language `<select>` below the menu items
- Versioned-JSON translations (see "Translations" — new design, the old app had no version gate)
- Settings diagnostics: version, sub-system (content JSON), browser summary
  (`navigator.userAgent`, replacing the old `Is IE`), service-worker support and controller state,
  pending update, last update check, installability, referrer, location
- PWA/service worker, update banner and install prompt (see "Progressive Web App / offline support")

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
  here; a brand deliverable is a separate build with its own LESS module (see
  `angular-start-project-brand-style` and "Brand example" below for how to build/view it).

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
| ------------- | --------- | ------------ | -------------------------------------------------- |
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

## Progressive Web App / offline support

`public/manifest.webmanifest` alone only makes the app **installable** (Android/Chrome's "Add to
Home Screen", `display: standalone`) — it does nothing for offline use. Installing from the
manifest without an actual service worker gives a shortcut icon that opens what is still just a
regular web page: turn the network off and reopen it, and the browser shows its native
"can't reach this page" error instead of the app shell, because there is no cache to serve
`index.html`/JS/CSS from. That was a real, confirmed bug in this template — `@angular/service-worker`
was entirely missing.

Fixed with the standard Angular PWA pieces:

- `@angular/service-worker` dependency + `ngsw-config.json` (asset groups: `app` — prefetched,
  covers `index.html`/JS/CSS/manifest; `assets` — lazy, covers icons/fonts/images; a `translations`
  data group with a `freshness` strategy for `public/json/*.json`, so translations still prefer a
  live version-check when online but fall back to a cached copy offline).
- `packages/angular-start-project/angular.json` build options: `"serviceWorker": "ngsw-config.json"`
  — this makes every build configuration emit `ngsw-worker.js`/`ngsw.json`, unconditionally.
- `src/app/app.config.ts`: `provideServiceWorker('ngsw-worker.js', { enabled: environment.production, registrationStrategy: 'registerWhenStable:30000' })`
  — **registration** (not generation) is gated on the existing `environment.production` flag from
  the table above, so it's active for `ci`/`test`/`prelive`/`live` and inactive for `local`/`dev`
  (avoids a stale cached bundle fighting `ng serve` hot-reload during development).

### Update flow (`PwaUpdateService` + `pwaUpdateService.js`)

Caching the app shell creates the _next_ problem: the service worker downloads a new deployment in
the background and then waits for **every** tab of the app to close before it takes over. A tab
left open for days therefore keeps running the old build indefinitely, and nothing tells the user.

- `src/app/services/pwa-update.service.ts` subscribes to `SwUpdate.versionUpdates` and maps
  `VERSION_READY` / `NO_NEW_VERSION_DETECTED` / `VERSION_INSTALLATION_FAILED` onto the library's
  state machine, plus `SwUpdate.unrecoverable` (a cached version that cannot be repaired — the only
  way out is a reload, so the banner offers one unconditionally).
- It re-checks every `config.pwa.updateCheckIntervalMs` (default 6h) so an already-open tab does
  not have to wait for a navigation.
- `activateUpdate()` swaps the waiting version in and reloads (`config.pwa.reloadOnActivate`).
  Reloading is not cosmetic: after activation the page's lazy chunks come from the _new_ version
  while the already-executing code came from the old one.
- `SwUpdate` is injected `{ optional: true }` — it only exists where `provideServiceWorker()` ran,
  and requiring it would make the whole app shell (which renders `pwa-panel`) impossible to
  instantiate in a test bed or in a copy of this template that drops the service worker.

### Install prompt (`PwaInstallService` + `pwaInstallService.js`)

`beforeinstallprompt` fires **once**, early, and is the only handle on the browser's install
dialog — miss it and there is no install button for the rest of the page's life. It is therefore
captured in `src/main.ts`, before `bootstrapApplication()`, by
`angularStartProjectLibrary.pwaInstallService.listen()`; the Angular service only mirrors the
resulting state into signals. "Later" is persisted for `config.pwa.installPromptDismissDays`
(default 30) — the update banner's dismissal is deliberately _not_ persisted, because re-offering
it on the next visit is the whole point.

Both banners live in one component, `src/app/components/layout/pwa-panel/`, mounted in `app.html`
right below the header. It renders nothing at all unless one of the services says otherwise.

### Diagnostics

The Settings page (`/settings`) reports service-worker support, the **controller state**
(`unsupported` / `none` / `activated` / …), whether an update is waiting, the last update check and
whether the app is installable or already installed — the four things worth knowing when a deployed
change does not show up for someone.

### The build gates it

`ngsw-config.json` also carries a `content` data group (`/json/content/**`) and an `api` data group
(`/api/**`, `/rest/**`, matching `resourceFactory`'s `restUrl`), both `freshness`, plus explicit
`navigationUrls` that exclude those two prefixes so an API 404 never gets the SPA shell.

Because an app can emit all the PWA control files and still be silently broken — a manifest whose
icons 404, an `ngsw.json` that caches nothing — both lifecycle gates check it:

- **Validate** (`tools/validate.js`): if `angular.json` declares a service worker, then
  `@angular/service-worker` must be a dependency, the referenced config must exist and have an
  `index` and non-empty `assetGroups`, `public/manifest.webmanifest` must exist with
  `name`/`short_name`/`start_url`/`display`/`icons` and at least one ≥192px icon, and
  `src/index.html` must actually link the manifest (HTML comments are stripped first — this file
  keeps the old `manifest.old.json` links commented out).
- **Verify** (`tools/verify.js`): the built artifact must contain `ngsw.json`, `ngsw-worker.js` and
  `manifest.webmanifest`; `ngsw.json` must cache its own index and the manifest; and **every**
  manifest icon must exist in the artifact. A missing maskable icon is a warning, not an error.

Everything above is conditional on the `angular.json` declaration, so a copy of this template that
deliberately drops the service worker still passes both phases.

### Icons

`public/manifest.webmanifest` declares the 14 existing sizes as `purpose: "any"` and two dedicated
`purpose: "maskable"` icons (`icons/{192x192,512x512}/Information-maskable.png`). They are separate
files on purpose: a maskable icon is cropped to a circle/squircle by Android, so its artwork must
sit inside the central 80% safe zone on an opaque background. Regenerate them from the 512px master
with:

```shell
cd packages/angular-start-project
for size in 192 512; do
  magick public/icons/512x512/Information.png -resize $((size * 80 / 100))x \
    -background '#fafafa' -alpha remove -alpha off -gravity center -extent ${size}x${size} \
    public/icons/${size}x${size}/Information-maskable.png
done
```

`shortcuts`, `screenshots` and `categories` are present as empty arrays — valid, ignored by
browsers, and the place to add app shortcuts or store screenshots later without touching anything
else.

### Trying it out

A plain `ng serve` (`local`, SW disabled by the flag above) is not enough — build and serve one of
the SW-enabled configurations instead:

```shell
npm run build -- --profile live
npm run server -w angular-start-project   # http://127.0.0.1:4210, correct .webmanifest MIME type
# open it, wait for the SW to finish installing (~30s, registerWhenStable), then use
# DevTools > Application > Service Workers > "Offline" (or actually disconnect) and reload
npm run stop-server -w angular-start-project
```

To see the **update** banner: with that tab open, rebuild (`npm run build -- --profile live`) and
either wait for the next periodic check or run `checkForUpdate()` — the banner appears as soon as
the new version reports `VERSION_READY`. To see the **install** banner, open the app over HTTPS or
`localhost` in Chromium; `beforeinstallprompt` never fires on a plain `http://<lan-ip>` origin.

## Brand example

`packages/angular-start-project-brand-style/brand-example/` is a **standalone demonstration**, not
part of the Angular app, its router, or its build — see `review.md` section 2 ("Brand vs.
web-page/app — the split already exists in production") and `design.md` §1. In this ecosystem,
brand/marketing pages and the webapp/SPA are two separate deployable artifacts on purpose: there is
no CSS-custom-property brand-override API and no runtime theme switcher inside the Angular app, and
there shouldn't be one — a different brand identity is shipped as a different static artifact, not
a parameterized mode of this app.

The split is mirrored in the LESS modules: the webapp styles live in `angular-start-project-style`,
brand styles live in their own module **`angular-start-project-brand-style`** (composes
`setmy-info-less` **base only** — no `setmy-info-less-extended`, none of the app's shell chrome —
and holds the brand classes like `.brandHero`/`.brandSection`). A brand page is a zero-Angular
static HTML page whose entry LESS (`brand-example/brand.less`) just imports the brand-style module
and adds its own by-case rules; `brand-example/` is the template's one concrete, buildable example
of that pattern.

**Current state is deliberately MVP/manual**: the brand artifact is built by hand with the step
below, separately from the app builds — no templating, no generation, no Nginx/Spring Boot setup
yet. `design.md` describes where automation goes later if needed; until then the guides here are
the build system.

```shell
npm run build:brand-example -w angular-start-project-brand-style
# compiles brand-example/brand.less -> brand-example/dist/brand.css (plain lessc, no Angular involved)
```

`brand-example/dist/` is untracked (matched by the root `.gitignore`'s `**/dist`), so this needs to
be (re-)run after a fresh checkout, and again any time the brand LESS changes — nothing watches or
rebuilds it automatically. To view the result, just open the HTML file directly in a browser (it's
a plain static page, no dev server needed):

```shell
open packages/angular-start-project-brand-style/brand-example/index.html   # macOS
xdg-open packages/angular-start-project-brand-style/brand-example/index.html  # Linux
```

If `dist/brand.css` hasn't been built yet, the page still loads but renders unstyled (plain black
text on white) since the stylesheet link 404s — that's the most common "something looks wrong here"
symptom for this page, and the fix is just to run the build command above.

**Adding a real brand page** (manual, MVP): copy `brand-example/` to a new directory (or package)
per brand, keep the entry-LESS pattern (`@import` the brand-style module, add page rules below),
add a matching `build:<brand-name>` lessc script, and run it as one more step in the build list
below. The deployable artifact is simply that directory's `index.html` + `dist/` + assets.

## Development

### Setup

```shell
npm install     # installs all four workspaces at once (run from the repository root)
```

### Firewall (remote access to the dev server)

`ng serve`/`npm start` binds to `localhost:4200` by default and is unreachable from other machines
until the port is opened on the host firewall (`firewalld`):

```shell
sudo firewall-cmd --permanent --add-port=4200/tcp && sudo firewall-cmd --reload && sudo firewall-cmd --list-ports
```

## Running the application locally (development)

The lifecycle below is the _build_. For day-to-day development you want the Angular dev server, not a lifecycle phase:

```shell
npm start -w angular-start-project
# → http://localhost:4200/ , "local" environment, live reload on save
```

That is `ng serve` with the `local` configuration (`angular.json` `defaultConfiguration: local`), so
`src/environments/local.environment.ts` is the active environment. Nothing needs to be built first — the dev server
compiles in memory.

Other loops:

```shell
npm run test:watch -w angular-start-project   # unit tests in Vitest's interactive watcher
npm run watch -w angular-start-project        # incremental `ng build` to dist/ on every change
npm run ver -w angular-start-project          # re-stamp the version into src/app/config/version.ts
```

If you edit `angular-start-project-library` or `angular-start-project-style` while the dev server runs, the change is
picked up like any other source file — they are consumed as source (plain JS / LESS), not as built packages.

**`npm start` is not the same as `npm run server`.** They serve different things on different ports, on purpose:

| Command                     | Serves                         | Port | Use it for                                 |
| --------------------------- | ------------------------------ | ---- | ------------------------------------------ |
| `npm start`                 | `ng serve`, compiled in memory | 4200 | development — live reload, sourcemaps      |
| `npm run server`            | the **built** `dist/` output   | 4210 | checking a real build before deploying it  |
| (automatic, `pre-e2e-test`) | the **built** `dist/` output   | 4211 | the e2e tier — started and stopped for you |

Ports 4210/4211 deliberately avoid 4200 so a dev server and a build check can run side by side. Remote access to the
dev server needs the port opened on the host firewall — see "Firewall" below.

## Lifecycle (Maven-mirroring build)

This repo follows the org's shared build lifecycle: the
[Maven default lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html#default-lifecycle)
phase names and ordering, implemented in npm — the same structure as `setmy.info-js`, `setmy.info-python`,
`setmy.info-elixir` and `setmy-info-less`. See **ADR-0045** for the cross-language phase table,
`setmy.info-js/requirements-rules.md` for the spec, and `report.md` here for what the migration changed.

Run from the repository root, in order:

```shell
npm run bootstrap                      # npm ci
npm run clean
npm run validate                       # structure, ADR-0042 profile names, tsc --noEmit, framework-independence
npm run format:check                   # or: npm run format
npm run lint
npm run generate-sources               # version stamp -> src/app/config/version.ts
npm run resources -- --profile <local|dev|ci|test|prelive|live>
npm run build -- --profile <profile>   # ng build / lessc / library load check
npm test                               # unit tier
npm run pre-integration-test
npm run integration-test
npm run post-integration-test
npm run pre-e2e-test                   # serves the BUILT app; needs Java + Selenium Grid
npm run e2e-test
npm run post-e2e-test
npm run coverage
npm run security
npm run verify
npm run package                        # app -> deployable tar.gz; libraries -> npm pack
npm run sbom
npm run sign
npm run install-local
npm run publish                        # dry-run unless PUBLISH_EXECUTE=true; private app skipped
DEPLOY_TARGET=dev npm run deploy
npm run site
```

Everything except the Selenium e2e tier has been run clean end to end (`EXIT 0`); `npm run security` currently fails
on Angular framework advisories — see `report.md` "Open".

Any phase can be run for one package: `npm run build -w angular-start-project -- --profile dev`.

### Three module types, one set of phase names

Each package declares `config.moduleType` in its `package.json` and the shared `tools/*` dispatch on it. The phase
names are identical everywhere — only what a phase runs differs:

| Package                             | moduleType     | build                          | test               |
| ----------------------------------- | -------------- | ------------------------------ | ------------------ |
| `angular-start-project`             | `angular-app`  | `ng build --configuration <p>` | `ng test` (Vitest) |
| `angular-start-project-library`     | `js-library`   | load check (no transpile)      | `node --test`      |
| `angular-start-project-style`       | `less-package` | `lessc` → dist/index[.min].css | —                  |
| `angular-start-project-brand-style` | `less-package` | `lessc` → dist/index[.min].css | —                  |

`packages/angular-original` and `packages/application.old` are legacy directories, deliberately **not** npm
workspaces, and no phase touches them.

### Framework independence is enforced by the build

`angular-start-project-library` must not depend on Angular (`AGENTS.md`). That is now checked, not just documented:
**Validate** fails on any `@angular/*` or `rxjs` import in the library's source, and **Compile** loads the whole
library in a plain Node process with only a minimal DOM present — no framework, no bundler. Keep new logic in the
library and the Angular layer thin, and the build keeps proving it.

Note: the library is framework-free but _browser-targeted_ — several services touch `localStorage` at module scope, so
it needs a DOM to load. See `report.md`.

### Profiles

The Angular CLI's own build configurations are the profile mechanism, and they are exactly the ADR-0041 canonical six
(`local`, `dev`, `ci`, `test`, `prelive`, `live`), each swapping in its `src/environments/<name>.environment.ts`.
`npm run validate` hard-fails if a non-canonical configuration name is ever added, so ADR-0042 is enforced rather than
hoped for.

### CI

`Jenkinsfile` (1.1.0, from the org's `jenkinsfile-starter`) runs this sequence with the same stages and branch gating
as the sibling repos: `master`, `devel*`, `release*`, `hotfix*`, and feature branches running everything up to Package
but never Publish/Deploy/Tag.

### Day-to-day commands (run from the repo root)

```shell
npm start -w angular-start-project             # dev server, "local" environment, http://localhost:4200/
npm test -w angular-start-project              # Vitest unit tests
npm run build -w angular-start-project         # production-shaped build, "local" environment
npm run watch -w angular-start-project         # incremental rebuild on change, "local" environment
npm run build:brand-example -w angular-start-project-brand-style   # brand page artifact (see "Brand example")
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

One block to install everything, build every module that has something to build (the app **and**
the brand page — after it you have both deployable artifact kinds), run the unit tests, and start
the dev server. Copy-paste from a clean checkout:

```shell
# 1. Install all four workspaces (from the repository root)
rm -rf node_modules packages/*/node_modules
npm install

# 2. Build the app — angular-start-project-library and angular-start-project-style are
#    pure source (plain JS / LESS); Angular's own build step below compiles and bundles
#    them together, they have no separate build script of their own.
npm run build -w angular-start-project              # "local" environment
# or explicitly, per environment:
npm run build:dev -w angular-start-project
npm run build:ci -w angular-start-project
npm run build:test -w angular-start-project
npm run build:prelive -w angular-start-project
npm run build:live -w angular-start-project
#    → app artifact: packages/angular-start-project/dist/application/

# 3. Build the brand page(s) — separate artifact, separate LESS module, manual/MVP
#    (see "Brand example"; one lessc step per brand page, add more as brands are added)
npm run build:brand-example -w angular-start-project-brand-style
#    → brand artifact: packages/angular-start-project-brand-style/brand-example/
#      (index.html + dist/brand.css + assets)

# 4. Unit tests (Vitest, via the Angular builder)
npm test -w angular-start-project
#    angular-start-project-library and the two style packages have no real test
#    runner wired up yet — their own "test" script is a placeholder that exits 1
#    ("Error: no test specified"); don't run `npm test --workspaces` at the root,
#    it will fail on those for that reason.

# 5. Start the dev server
npm start -w angular-start-project
#    → http://localhost:4200/
```

Then, in two more terminals, for E2E (see "E2E / Integration tests" below for details):

```shell
# Terminal 2 — Selenium Grid (setmy-info-scripts tooling)
smi-selenium-hub
smi-selenium-node

# Terminal 3 (app from step 5 must still be running)
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
  `src/app/services/language.service.spec.ts` next to `language.service.ts`. The suite is kept
  GREEN (85 tests, all passing as of 2026-07-12 — the specs were rewritten to match the current
  templates after a period of drift). The navigation-critical components are covered
  content-deep: the header panel asserts one nav link per `menuModel` header item and one
  language button per supported language (current one disabled), the side navigation panel
  asserts one item per menu entry plus the language `<select>` below the `hr` separator, and
  closing behavior on item click / overlay click is unit-tested against `ModalService`.
- `angular-start-project-library` — plain JS, framework-agnostic; no test runner is wired up yet
  (`"test": "echo \"Error: no test specified\" && exit 1"` in its `package.json`) — coverage for its
  services currently comes from the Angular-side specs that exercise them (e.g.
  `language.service.spec.ts` mocks `fetch`/`localStorage` to cover `translationService.js`'s
  version-check/cache logic end-to-end) and from the e2e suites below (translations, content and
  consent all run against the real library code in the browser).

### E2E / Integration tests

E2E tests use [Jest](https://jestjs.io/) + [selenium-webdriver](https://www.selenium.dev/) against
an external Selenium Grid — the same stack, setup style and **verification principle** as the
`setmy-info-less` project's e2e suite (the earlier WebdriverIO setup was outdated and was
replaced). Spec files live in `packages/angular-start-project/test/e2e/*.e2e.js`; the shared
`test/e2e/pageHelper.js` is adapted from `setmy-info-less/packages/common/test/js/pageHelper.js`:
fixed 2000x1200 viewport, one browser session per spec file (serial, `maxWorkers: 1`), bounded
cleanup, and `elementExpectations()` asserting the full set of **concrete computed values**
(margin, padding, font, size, position, colors from `getComputedStyle` + `getBoundingClientRect`)
— never mere element existence. SPA additions on top of the LESS original: route navigation with
translated-content waits, `hover()` (real mouse-move for `:hover` color tests), `cssValueOf()`,
computed-`display` visibility checks, and Firefox geolocation pre-allowed with a fixed test
position (`permissions.default.geo=1` + a `data:` `geo.provider.network.url`, overridable via
`TEST_GEO_LAT`/`TEST_GEO_LNG`) so the `$geo` startup watcher works headlessly instead of hanging
on a permission prompt.

The six suites: `application` (shell + strict computed metrics + footer + terms link),
`mainNavigation` (header menu clicks + per-page content/titles), `sideNavigation` (open/close via
button, close-by-clicking-anywhere-on-overlay, menu items, settings content + location links),
`languageChange` (ET/EN through BOTH menus + persistence across reload), `consent` (accept,
stored, revoke via the privacy view checkbox, persistence),
`hoverAndSelection` (hover colors by emulated mouse move; active/selected element colors incl.
the sunken language button).

**Prerequisites:** the app running on `localhost:4200` and a Selenium Grid on
`localhost:4444/wd/hub` (override via `SELENIUM_HUB_URL`/`APP_BASE_URL`).

```shell
# Terminal 1 – start the app
npm start -w angular-start-project

# Terminal 2 – start the Selenium Grid (setmy-info-scripts tooling)
smi-selenium-hub
smi-selenium-node

# Terminal 3 – run E2E tests
npm run e2e -w angular-start-project
# or a single test by name:
npm run e2e:one -w angular-start-project -- "side navigation"
```

## Licensing — MIT template + proprietary SMI/HASS parts

The repository-level statement anyone entering the project must read is [LICENSE.md](LICENSE.md)
at the repo root (also flagged in the notice at the very top of this README). Summary:

This repository is **not uniformly MIT**. Since the "Migrated functionality" work it contains two
kinds of code side by side:

- **MIT** — the generic Angular-start-template parts (scaffolding, layout shell, build setup,
  placeholder Lorem-Ipsum content).
- **Proprietary SMI / Hear And See Systems (HASS)** — functionality migrated from the old
  setmy.info web application, which is a real product. All rights reserved by the SMI/HASS
  authors. The proprietary license TEXT is pending (not written yet); until it is published,
  **external developers need a separate license/permission from the SMI/HASS authors** to use,
  copy, or modify these parts.

The migrated library candidates (pending the authors' per-file
decision), the SMI branding assets (favicon, icons), and the terms/privacy legal texts are listed
with origins in `packages/angular-start-project-library/LICENSE-NOTES.md` — that file is the
authoritative inventory, and the library's `package.json` points at it
(`"license": "SEE LICENSE IN LICENSE-NOTES.md"`). The legacy `jsdi` npm packages (`js-api-extend`,
`servicejs`, `servedjs`, `servedjs-geo`) are separate published packages with their own licenses.

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
- Read `missing-functionality.md` for the old-solution → new-solution functionality gap list —
  every numbered item is a self-contained work order with a status tag (IMPLEMENTED / PARTIALLY
  IMPLEMENTED / NOT IMPLEMENTED); the implemented ones are documented in "Migrated functionality"
  above.
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
