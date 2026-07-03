# Review — environments, brand/webapp split, CSS, Material, migration plan

## Current prompt

Need to have environments by setmy-info SMI standards (`adr-0041-environment-name-conventions.md`,
`adr-0042-runtime-and-build-time-profile-name-conventions.md`). Compare against the SMI/HASS web app
(`has-web-app-new-ng`, old Angular) to understand pages/panels. Plan CSS missing from `setmy-info-less`
into `angular-start-project-style` (to be moved around later). This project is a **template** for
future applications/websites — content should stay generic: use
`setmy-info.github.io/.../placeholder.svg` for images, Lorem Ipsum for text, but every page must be
implemented and visible/navigable. Understand SMI/HASS principles from its README. Main requirement: the
template must support a **brand page** (any custom style) and a **company web page/app** — there is no
hard separation between "web page" and "application" layering, so the template needs to fit both
categories. Also: how to self-host Material Design correctly, with **no Google CDN** — everything served
from the same origin. Helper JS/TS should be transferred. Angular upgrade/migration — what's left to do.
Deliverable: this `review.md` with findings and a plan for next execution passes.

---

## 1. Environment naming — ADR-0041 / ADR-0042 vs. current state

Canonical names (the *only* allowed environment/profile names, per ADR-0041 §3 and ADR-0042 §3):

```
local · dev · ci · test · prelive · live
```

`stage`, `staging`, `pre-live`, `prod`, `production` are explicitly forbidden as environment or
profile identifiers anywhere in setmy.info docs, config, topics, or build/runtime profiles.

**Current state — non-compliant, and not just here:**

- `packages/angular-start-project/angular.json` build target only defines `"production"` /
  `"development"` configurations (Angular CLI defaults), `defaultConfiguration: "production"`. Neither
  name is canonical.
- No `src/environments/` folder exists in the current Angular 21 app at all (removed vs. the old
  scaffold) — there is currently *nowhere* that per-environment config values would even live.
- The legacy `packages/application.old/src/environments/{environment.ts,environment.prod.ts}` only ever
  held `{ production: boolean }` — a single flag, not real per-environment config, and only 2 of the 6
  canonical environments existed even informally (dev-implicit + prod).
- The old production app `has-web-app-new-ng` has the same 2-file `production: boolean` pattern — this
  non-compliance predates the current project and was inherited, not introduced here.

**Plan:**

1. Add `packages/angular-start-project/src/environments/environment.{local,dev,ci,test,prelive,live}.ts`,
   each exporting a typed config object (not just a boolean) — start with `{ envName, apiBaseUrl,
   production }` and grow as real config needs appear.
2. Rename `angular.json` build **configurations** from `production`/`development` to the 6 canonical
   names, each with its own `fileReplacements` pointing at the matching `environment.<name>.ts`, mapped
   1:1 per ADR-0042 §3 ("Profile systems must stay one-to-one with environments at both build time and
   runtime"). `defaultConfiguration` should be `local` for `ng serve`, matching how a developer runs it
   day to day.
3. Update `serve` target configurations the same way (`ng serve --configuration=dev`, etc.).
4. Update `package.json` scripts: keep `start`/`build` defaulting to `local`, add
   `build:dev`, `build:ci`, `build:test`, `build:prelive`, `build:live` (or a single parametrized script
   — minimum-change preference per SMI conventions, see `setmy-info-less/review.md` §"Review and fix
   README.md... Fix with minimum changes").
5. Document the mapping (env name → what it's for → who deploys to it) in `README.md`.
6. This is a template-repo decision that will be inherited by every future app generated from it — worth
   getting right once here rather than per-project later.

---

## 2. Brand vs. web-page/app — the split already exists in production, reuse it

This was the open question in the prompt: "no separations from web paging and application layering...
should fit into two categories: brand and web page/app." **HASS already answers this in production**,
and the answer is architectural, not a runtime theme switch:

- **Brand** (`has-web-app-new` root package): a completely separate, non-Angular, zero-build static
  site (originally Vue/global-build era) built by `build-brand.sh` → `brand.tar.gz`, deployed straight
  to nginx as its own artifact. Any visual style, no shared component system, no shared build pipeline.
  This is what "fancy, nice, difficult, by-case" brand pages need — total freedom.
- **Web page / app** (`has-web-app-new-ng`): the many-paged Angular SPA — articles, tools, settings,
  contact, etc. — one consistent look, one build, one deploy. Routing-driven, `views = 1 route = 1 main
  panel` convention (already the convention this template follows: `home`/`about`/`contact`).
- No CSS-custom-property brand-override API and no runtime theme switcher exists inside the Angular app.
  Brand identity variation happens entirely by deploying a *different artifact*, not by parameterizing
  one.

**`setmy-info-less`'s own package layering mirrors this split exactly** (confirmed from
`setmy-info-less/{web-page-design.md,setmy-info-design.md}` and the live package tree):

| Layer                      | Depends on           | Audience                                                                                            | Status                            |
|----------------------------|----------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------|
| `base` (`setmy-info-less`) | —                    | everyone                                                                                            | stable                            |
| `extended`                 | base                 | shared content patterns (cards, articles, modals, forms once promoted)                              | stable                            |
| `fancy`                    | extended             | **brand / public marketing pages** — opinionated site chrome (header, hero, tile grid, CTA, footer) | empty skeleton, design docs exist |
| `enterprise`               | extended             | **internal app / webapp style** — sibling of `fancy`, cannot borrow from it                         | empty skeleton, placeholder       |
| `experimental`             | enterprise (staging) | unvalidated prototypes of both `fancy`- and `extended`-bound blocks                                 | has real content already (see §3) |
| `ide`                      | enterprise           | dev-tool/IDE-chrome frames                                                                          | separate concern, not needed here |

**Plan:** angular-start-project (the template) is itself a **web page/app**, so it should compose
`base` + `extended` + `enterprise`, never `fancy`. A future *brand* deliverable generated from/alongside
this template is a **separate static artifact** (own build, own LESS entry, may or may not import `base`
utilities), not a "mode" of this Angular app. Don't build a theming API to unify them — the SMI
architecture has already decided against that, twice (once in HASS, once in the LESS package layering).
Record this as the answer instead of re-deriving it per project.

---

## 3. CSS — what's missing, and what's simply not wired up yet

**Not a "missing CSS" problem first — a wiring problem:**

- `packages/angular-start-project-style/src/less/index.less` has `//@import 'setmy-info-less';`
  **commented out**. None of `base`'s utilities, resets, breakpoints, or variables are active in this
  project today, despite `setmy-info-less@^3.0.0` being a declared dependency in both
  `angular-start-project-style/package.json` and `angular-start-project-library/package.json`.
- Only `extended` layer is missing as a dependency entirely (not in `package.json` of
  `angular-start-project-style`); `enterprise`/`experimental`/`fancy` likewise absent.

**Design work is already done — reuse, don't re-derive.** `setmy-info-less/web-page-design.md` and
`setmy-info-design.md` already inventory exactly the blocks a header/nav/footer/modal/language-toggle
page needs, with a concrete block table and a working demo
(`setmy-info-less-experimental/src/test/pug/spa.pug` → `dist/spa.html`, load order base → extended →
experimental). Relevant existing/planned classes for this template's actual components:

| This template's component                                          | Needed blocks                                                                                                             | Where they live today                                                                 |
|--------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `header-panel`                                                     | `.siteHeader`, `.siteHeaderInner`, `.siteLogo`, `.siteNav`, `.langToggle`/`.langToggleItem(Active)`                       | `experimental/web/`                                                                   |
| `side-nav-panel` (currently **empty**, see §5)                     | `.sideNavList` or compose from `.tabBar`/nav utilities                                                                    | `experimental/ui/navigation`                                                          |
| `modal-overlay`                                                    | `.overlay`, `.modal`, `.modalHeader/Body/Footer/Close`, `.btn`/`.btnPrimary`                                              | `extended` (overlay/modal) + `experimental/base` (buttons)                            |
| `footer-panel`                                                     | `.siteFooter`, `.siteFooterInner`, `.siteFooterInfo`, `.siteFooterNav`, `.siteFooterLink`                                 | `experimental/web/`                                                                   |
| home/about/contact views                                           | `.pageSection(Narrow)`, `.centerBox`, `.card`/`.cardGrid`, `.kvList`/`.kvRow` (contact), `.tileGrid`/`.tile` (home/about) | `extended` (card, pageSection) + `experimental/base` (kv) + `experimental/web` (tile) |
| GDPR/cookie consent (see §5, HASS has this, this template doesn't) | `.overlay`/`.modal` + `noticeBanner` pattern                                                                              | `extended`/`experimental`                                                             |

**Plan (matches `web-page-design.md` §6 build order, applied to this project):**

1. Uncomment the `base` import in `angular-start-project-style/src/less/index.less`. This alone activates
   breakpoints, visibility helpers, flex helpers, z-index scale — currently completely unused.
2. Add `setmy-info-less-extended` and `setmy-info-less-enterprise` as dependencies (this is a webapp per
   §2, not a `fancy` brand build).
3. For blocks still only in `experimental` that this template needs now (buttons, forms, kvList,
   nav/tabs, siteHeader/siteFooter family, langToggle) — either (a) consume `experimental` directly as a
   stopgap, clearly marked as unvalidated, or (b) do the promotion work described in
   `web-page-design.md` §4 (`experimental` → `extended`) upstream in `setmy-info-less` first. Recommend
   (a) for template velocity now, tracked as follow-up to do (b) upstream — don't block this project on
   an upstream promotion pass.
4. Side-nav slide transition and the modal-overlay backdrop styling are **genuinely new** — not covered
   by any existing package yet (flagged as open in `setmy-info-design.md` §5). These belong in
   `angular-start-project-style` itself for now, per the user's own note ("later I will move them
   around") — i.e., build them here, don't block on upstreaming.
5. Fix the icon font mismatch (§4) as part of this pass since it's in the same file.

---

## 4. Material Design — self-host, zero Google CDN

**Current state:** `packages/angular-start-project/public/index.html` loads
`https://fonts.googleapis.com/icon?family=Material+Icons` — the one and only third-party CDN reference
in the project. `@angular/material`/`@angular/cdk` are **not installed** anywhere in this repo; icon
usage today is hand-rolled `<i class="material-icons">` / `.material-symbols-outlined` CSS classes, not
the Angular Material component library.

**Bug already present, independent of the CDN question:** `index.less` defines
`.material-symbols-outlined { font-family: 'Material Symbols Outlined', ... }`, but no `@font-face` for
that family exists anywhere, and the CDN link in `index.html` loads a *different* font family
(`Material Icons`, the older ligature-font, matching `.material-icons` not `.material-symbols-outlined`).
Result: every `.material-symbols-outlined` icon in `contact`, `side-nav-panel`, `footer-panel` etc.
currently renders as fallback text/tofu, not an icon — this is broken today, independent of the
CDN-removal work.

**HASS already solved self-hosting once**, proven pattern: `has-web-app-new-style` depends on
`material-design-icons@^3.0.1` and hand-writes a `@font-face` block pointing at
`node_modules/material-design-icons/iconfont/*` paths, pulled in via `angular.json`'s `styles` array so
the Angular CLI bundles the font files at build time — zero runtime network call, same origin as the app.

**Plan:**

1. Remove the `fonts.googleapis.com` `<link>` from `index.html` immediately — it's a one-line deletion
   and the single biggest concrete step toward "no Google CDN."
2. Adopt the `material-symbols` npm package (actively maintained variable font, matches the family name
   already referenced in this codebase — `material-design-icons` is the older/legacy package HASS used
   and Google has since moved to Symbols) as a devDependency of `angular-start-project` or
   `angular-start-project-style`.
3. Add a real `@font-face` for `Material Symbols Outlined` in `angular-start-project-style`, sourcing
   `.woff2` from the npm package via `angular.json` asset copying (same mechanism HASS proved out), fixing
   the mismatch bug from §4 in the same change.
4. Decide on Roboto: either self-host `.woff2` the same way, or drop Roboto and use a system-font stack
   (simplest, zero extra assets, template stays generic) — recommend system-font stack for a *template*
   specifically, since a real brand will supply its own type choice later anyway.
5. `@angular/material@21.x` is version-compatible with the current `^21.0.0` core packages if/when the
   project wants actual Material components (not just icons) — confirmed available via npm. Its SCSS
   theming (`mat.theme()`) has no CDN dependency at all; only `ng add`'s auto-inserted index.html link
   and the icon font are the culprits. Not currently installed — decide whether this template wants the
   full component library or stays with hand-rolled `.btn`/`.card`/etc. from `setmy-info-less` (§3) as
   its primary UI kit. Recommend the latter for consistency with the rest of the SMI ecosystem, adding
   `@angular/material` only for components SMI/HASS's own CSS doesn't cover (date pickers, complex
   selects) if/when a concrete need appears — don't add it speculatively.

---

## 5. Pages, panels, and what's actually broken right now

**HASS page/panel inventory** (for reference — this template doesn't need to replicate all of these,
but should know what a "full" SMI web app eventually has): `home`, `about`(`minust`), `services`,
`ads`, `articles`, `commercials`, `contacts`, `help`, `news`, `privacy`, `products-services`, `settings`,
`sponsors`, `template`, `terms`, `tools`, plus global panels `header-panel`, `side-navigation-panel`,
`main-panel`, `modal-body-panel`, and **`consent-body-panel` (GDPR/cookie consent)** — this last one has
**no equivalent in the current template** and should be added since every real SMI deployment needs it
(the modal-overlay/`.overlay`+`.modal` blocks from §3 cover the CSS side already).

**Current template implements:** `home`, `about`, `contact`, `view-not-found` — routed and reachable by
URL. This satisfies "all pages implemented" at the routing level. It does **not** satisfy "visible" at
the navigation level — concrete bugs found by direct inspection:

1. `side-nav-panel.component.html` is an **empty div** — `MenuService`/`menuModel.js` already has the
   correct 3 items (Home/About/Contact → `/`, `/about`, `/contact`) wired to `MenuService.rawMenuItems`,
   but nothing renders them. The hamburger button opens an empty panel.
2. `header-panel.component.html` nav is **hardcoded** `<a>Item 1</a>` — also not using
   `MenuService`/`menuModel.js`, despite `HeaderPanelComponent` already injecting `MenuService`.
3. Language buttons (`ET`/`EN`) in `header-panel` call `nothing()` (`console.log('nothing')`) —
   no-ops. `translationService.js` exists in the library package but nothing calls it from the header.
4. `FooterPanelComponent` is imported into `app.ts` but **never placed in `app.html`**'s template — its
   own template is also just an empty `<footer></footer>`. Meanwhile `main-panel.component.html`
   contains a **second, inline, duplicate footer** with a commented-out broken binding
   (`<!-- translations.current.companyName -->`) and a dead link `routerLink="/terms"` (no `/terms`
   route exists → this would 404 if clicked).
5. `BackgroundComponent` (tsParticles) import is **commented out** in `app.ts` — background never
   renders, despite being fully implemented.

**Plan:**

1. Wire `side-nav-panel` to render `MenuService.rawMenuItems()` as an actual nav list (`@for` +
   `routerLink`), using `.sideNavList`/nav blocks from §3.
2. Replace `header-panel`'s hardcoded nav with the same `MenuService` data (single source of truth,
   don't duplicate the menu model in two templates).
3. Wire the `ET`/`EN` buttons to `translationService.js` / a `LanguageService` (per memory, one may have
   existed and been removed — recheck; currently absent from `src/app/services/`) instead of `nothing()`.
4. Delete the duplicate inline footer from `main-panel.component.html`; put `<app-footer-panel>` in
   `app.html` once, give `FooterPanelComponent`'s own template the real copyright content (currently
   empty), and either add a real `/terms` route or remove the dead link — template placeholder content
   should still be a working link, not a 404.
5. Re-enable `BackgroundComponent` in `app.ts`/`app.html` (uncomment) — it's finished, just switched off.
6. Add a `consent-body-panel` component (empty stub is fine for a template — GDPR text can be Lorem
   Ipsum) using the `.overlay`/`.modal` blocks, matching HASS's existing panel.
7. Replace all page imagery with
   `setmy-info.github.io/src/site/resources/images/placeholder.svg` (copy into
   `packages/angular-start-project/public/images/`) and confirm every view (`home`, `about`, `contact`)
   uses only Lorem Ipsum text — spot-check during this pass, memory says this was already done but
   re-verify given the wiring bugs found above.

---

## 6. Template cruft to remove

Leftover from Angular's stock "Tour of Heroes" tutorial scaffold, copied over in commit `c00c3ff` ("Old
components copied to new") and never fully cleaned despite two later cleanup commits. Not part of the
brand/webapp/pages work, but blocks a clean template baseline — do this first, it's pure deletion:

- `packages/angular-start-project/src/constants/ExampleConstants.ts`
- `packages/angular-start-project/src/models/Example.ts`
- `packages/angular-start-project/src/services/{example,message}.service.ts` (+ `.spec.ts`)
- `packages/angular-start-project/src/app/components/views/example/` (component + html + less + spec) —
  not wired into `app.routes.ts` already, dead code
- `README.md` still documents `http://localhost:4200/example/11`, a route that doesn't exist — rewrite
  once the example view is deleted
- `packages/application.old/` — confirmed dead weight (verdict from direct audit: `config`,
  `directives`, `pipes`, `plugins`, `resources` dirs are empty placeholders; `assets/js`, `assets/lib`
  empty; only real content is the same Tour-of-Heroes demo and a 2-value `environment.ts`). Nothing here
  is worth porting — the current `angular-start-project-library` services (`localStorageService.js`,
  `sessionStorageService.js`, `tenantService.js`, `translationService.js`) already exceed it. Recommend
  deleting `packages/application.old/` once the user confirms it's no longer needed for reference; not
  deleting unilaterally since it's user-owned history, not agent-generated cruft.
- `packages/application/` (bare `dist/` cache dir, not git-tracked, no source) — safe to `.gitignore`/
  clean, not a real package.

---

## 7. Helper JS/TS transfer

Searched both source repos for genuinely portable framework-agnostic helper code beyond what's already
in `angular-start-project-library`:

- `has-web-app-new-ng/src/app/{directives,pipes}`: small, but all Angular-specific (structural
  directive, pipe classes) — logic itself is trivial (currency formatting, object-to-array, HTML
  sanitizing passthrough) and not worth porting as-is; if needed, re-implement as plain functions in
  `angular-start-project-library` and wrap in a thin Angular pipe locally, keeping the library pure JS
  per `AGENTS.md`.
- `has-web-app-new-ng/src/app/config/version.js`: a generated build-version stamp — worth adopting the
  *pattern* (a build step that stamps a version file) rather than the file itself.
- `application.old/src/assets/{js,lib}`: empty — nothing to transfer.
- Real reusable logic in the HASS ecosystem lives in the sibling `has-web-app-new-library` package,
  which was out of scope for this pass — **next step:** audit that package specifically (not yet done)
  before concluding helper-JS transfer is complete.

**Plan:** no bulk transfer needed today; `angular-start-project-library` is already ahead of both legacy
sources. Follow-up: audit `has-web-app-new-library` (sibling of `has-web-app-new-ng`, not yet examined)
specifically for anything missing from `angular-start-project-library`.

---

## 8. Angular upgrade / migration status

- Core packages already at `^21.0.0` (`@angular/common/compiler/core/forms/platform-browser/router`),
  `@angular/build`/`@angular/cli` at `^21.0.4` — current, no version upgrade needed.
- `AGENTS.md` constraints (no `standalone: true`, signals/`input()`/`output()`/`computed()`/`inject()`,
  `@if`/`@for`/`@switch`, no `ngClass`/`ngStyle`) are already followed in the components inspected
  (`header-panel`, `side-nav-panel`, etc. use `inject()`, `ChangeDetectionStrategy.OnPush`).
- Remaining migration-shaped work is content/wiring (§5), not framework version work.

---

## 9. Priority order for next execution pass

1. **§6 cruft removal** — pure deletion, unblocks a clean template, no design decisions needed.
2. **§5 wiring fixes** (menu render, footer dedup, background re-enable, language buttons) — makes the
   existing implementation actually visible/navigable, which is the literal "all pages should be
   implemented, visible" requirement; currently the biggest gap between "code exists" and "works."
3. **§4 Material/CDN** — delete the CDN link (1 line) + fix the icon font bug together, since both touch
   the same files.
4. **§3 CSS wiring** — uncomment the base import, add `extended`/`enterprise` deps, consume needed
   `experimental` blocks for header/nav/footer/modal.
5. **§1 environments** — add the 6-file environment setup and `angular.json` configuration renames.
6. **§5.6 consent panel** — new component, lowest urgency since no legal requirement drives a template.
7. **§2 brand/webapp** — no code work required now; it's a documented architectural decision
   (this template = webapp category, brand = separate future artifact) to prevent scope creep into a
   theming system nobody asked for.
8. **§7 follow-up** — audit `has-web-app-new-library` once the above is stable.

Everything above is scoped to this template repo. Re-run `/code-review` or equivalent after each pass
before moving to the next.

---

## 10. Execution log — pass 1 (2026-07-01)

User directed execution of the plan above with four adjustments to the original analysis:

- `setmy-info-less-extended` pinned to `^3.1.0` (was proposed as a future add; user had already
  bumped `angular-start-project-style/package.json` to this version before this pass started).
- The `setmy-info-less` package layering (`base`/`extended`/`fancy`/`enterprise`/...) is **not** to
  be mirrored 1:1 as a folder structure in this repo — only its *documentation style* (how the
  `setmy-info-less` project documents day-to-day monorepo build/update/upgrade workflow) should be
  adopted here, as a `DEVELOPERS-GUIDE.md`.
- Material Symbols font: fetch via `npm pack` into a scratch/temp directory at dev time and copy the
  needed `.woff2` in as a static asset, rather than adding `material-symbols` as a permanent
  `package.json` dependency.
- Brand-vs-webapp separation should still be concretely addressed in this repo, not only documented
  as a deferred architectural decision.

**Done in this pass, in priority order from section 9, plus the adjustments above:**

1. **Cruft removal (§6).** Deleted the Tour-of-Heroes scaffold (`ExampleConstants.ts`, `Example.ts`,
   `example`/`message` services + specs, `views/example/*`); fixed `README.md`'s dead `/example/11`
   link.
2. **CSS wiring (§3) and dependency fix.** Uncommented and corrected the `setmy-info-less` import in
   `angular-start-project-style/index.less` to import the packages' **source** `main.less`, not the
   `"main"` field (which points at pre-built `dist/main.min.css` with no LESS variables). Removed a
   version-skew bug across three `package.json` files that was silently pinning the whole workspace
   to `setmy-info-less@3.0.0` (missing `@overlayBackgroundColor`, needed by extended's `modal.less`)
   despite `setmy-info-less-extended@3.1.0` being installed — fixed by removing two unused/stale
   direct `setmy-info-less` pins (`angular-start-project` and `angular-start-project-library` neither
   import it directly) and declaring `angular-start-project-style`'s own direct dependency on both
   packages explicitly at `^3.1.0`. `npm update <pkg> --workspaces` was needed to force
   re-resolution — plain `npm install` does not upgrade a package still satisfied by a looser range
   elsewhere in the tree. Documented this whole class of gotcha in `DEVELOPERS-GUIDE.md`.
3. **Layout CSS (§3/§5).** Rewrote `header-panel`, `side-nav-panel`, `modal-overlay`, `main-panel`,
   `footer-panel`, `background`, and all four view components' `.less` files from scratch using real
   `setmy-info-less` tokens (`@headerPanelHeight`, `@sideNavWidth`, `@footerHeight`, `@z-index-*`,
   color variables) and `extended` classes (`.overlay`/`.modal`, `.pageSectionNarrow`, `.articleBody`,
   `.definitionTerm`/`.definitionDesc`). Learned and documented that **component-scoped LESS compiles
   in isolation** — each file needs its own `@import url("setmy-info-less/.../values/index.less");`;
   the global import in `angular-start-project-style` does not leak into `*.component.less`.
4. **Wiring bugs (§5).** Fixed all five: side-nav now renders `MenuService` items; header nav uses
   the same service instead of hardcoded "Item 1"; added a `LanguageService` wrapping the library's
   existing (previously unused) `translationService.js` and wired the EN/ET buttons to it; removed
   the duplicate inline footer from `main-panel` (dead `routerLink="/terms"`, broken commented
   binding) and gave `FooterPanelComponent` real content, wired into `app.html`; re-enabled
   `BackgroundComponent`. Also fixed the `[class.hidden]`/CSS-specificity bug flagged in prior memory
   by switching side-nav and modal-overlay to `[style.display]` bindings. Normalized all layout
   component selectors to a consistent `app-*` prefix (`app-header-panel`, `app-side-nav-panel`,
   `app-modal-overlay`, `app-background`) and renamed the mismatched `ModalBodyPanelComponent` class
   (selector/file said "modal-overlay", class said "modal body") to `ModalOverlayComponent` — this
   also happened to make the pre-existing (previously never-passing) spec files consistent, since
   they already assumed this convention. Rewrote the four view-page spec files, which asserted
   fictional classes (`.sectionHeaderPicture`, `.articleSectionPanel`, `.iconPanel`) that exist
   nowhere in `setmy-info-less` and content contradicting the real i18n strings — treated as leftover
   aspirational scaffolding rather than a spec to chase.
5. **Material/CDN (§4).** Removed the `fonts.googleapis.com` `<link>` from `index.html`. Fetched
   `material-symbols` via `npm pack` into a scratch temp directory (not a project dependency),
   extracted `material-symbols-outlined.woff2` (+ its license) into
   `packages/angular-start-project/public/fonts/`, and added the matching `@font-face` — fixing the
   pre-existing bug where `.material-symbols-outlined` had no backing font at all (rendered as
   fallback text). Documented the re-fetch steps in `DEVELOPERS-GUIDE.md` since the font isn't in
   `package.json`/lockfile-tracked.
6. **Environments (§1).** Added `src/environments/{local,dev,ci,test,prelive,live}.environment.ts` (a
   typed `Environment` model, not just a boolean) plus a default `environment.ts`. Files are named
   `<name>.environment.ts`, **not** `environment.<name>.ts` — Vitest's default test-file glob matches
   `*.test.ts` and silently tried to run `environment.test.ts` as a test suite. Renamed
   `angular.json`'s build/serve configurations from `production`/`development` to the six canonical
   names with per-configuration `fileReplacements`; added a `local` configuration to the `test`
   architect target too (the unit-test builder needs an explicit build target once `development` no
   longer exists). Added `build:dev`/`build:ci`/`build:test`/`build:prelive`/`build:live` npm scripts.
   Wired `environment` into `FooterPanelComponent` as a small non-production env badge, to prove the
   plumbing works end-to-end rather than leaving it unused scaffolding.
7. **`DEVELOPERS-GUIDE.md` (adjustment, not §7 of the original plan).** New file at the repo root,
   modeled on `setmy-info-less/DEVELOPERS-GUIDE.md`'s structure (Purpose → workspace modules →
   day-to-day commands → gotchas → notes for AI agents), covering this repo's own workflow: install/
   build/test commands, the six environments, `npm update <pkg> --workspaces` for upgrading a shared
   dependency, the two `setmy-info-less` import gotchas from item 2/3 above, the brand/webapp
   decision, and the Material Symbols re-fetch steps. Explicitly does **not** mirror
   `setmy-info-less`'s internal package layering as a folder structure in this repo.
8. **Brand/webapp demonstration (adjustment, not deferred as originally planned).** Added
   `packages/angular-start-project-style/brand-example/` — a standalone static HTML page (own
   `brand.less` importing only `setmy-info-less` **base**, no `extended`, no Angular, no app-shell
   chrome) plus an `npm run build:brand-example` script (`lessc`). This is deliberately **not** a
   route inside the Angular app/router — keeping it a separate static artifact is the point being
   demonstrated (see section 2). Verified it compiles cleanly to `brand-example/dist/brand.css`.
9. **Verification.** `npx ng test --no-watch`: 52/52 passing across all 10 spec files. `npx ng build`
   succeeded for all six configurations (`local`/`dev`/`ci`/`test`/`prelive`/`live`); confirmed the
   `live` config's `apiBaseUrl` was actually baked into the output bundle. Ran the app in a headless
   browser (Playwright, `chromium-cli` wasn't available in this environment) against the dev server
   and drove it through: home page content + placeholder image, header nav, side-nav open/navigate/
   auto-close, EN/ET language switch, footer copyright + env badge, tsParticles background canvas,
   `/about` and `/contact` content, and the 404 page's heading + home link. Zero browser console
   errors. Screenshots confirmed the visual layout (fixed header, off-canvas drawer with dimmed
   backdrop, particle background) renders correctly, not just passes assertions.

**Not done in this pass — carried forward:**

- §5.6 GDPR/`consent-body-panel` component — still not added (lowest priority per section 9).
- §7 follow-up audit of `has-web-app-new-library` — still not examined.
- Icon font is the full variable `material-symbols-outlined.woff2` (~3.9 MB) — not subsetted. Fine
  for a template; a real deployment may want to subset to only the icons actually used
  (`menu`, `close`, `home`, `info`, `contact_page`, `copyright`).
- `npm audit` reports 25 vulnerabilities (2 low, 10 moderate, 12 high, 1 critical) in the dependency
  tree as of this pass — not investigated or fixed; out of scope for this pass but worth a dedicated
  look before this template is used as a real application base.
