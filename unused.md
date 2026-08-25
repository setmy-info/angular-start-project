# Unused, missing and renamed LESS/CSS — analysis and refactoring plan

This document is the plan for the LESS/CSS cleanup of the Angular start template project and the
setmy-info-less multimodule project. It is written for AI agents: a later refactoring task can simply
reference a section, table or point of this document ("delete everything in table 3.1", "apply rename
row 2 of table 6.1") and execute it. Everything below is documentation only — no deletions have been
made yet.

## 1. Scope and method

Compared artifacts:

- New Angular app: `packages/angular-start-project/src` (HTML templates, component `*.less`)
- Style package: `packages/angular-start-project-style/src/less/index.less` (imports
  `setmy-info-less` base and `setmy-info-less-extended` sources; nothing else from the LESS project
  is consumed by the Angular build)
- LESS multimodule project: `/home/has/sources/components/setmy.info/submodules/setmy-info-less/packages/*`
  (source LESS under `src/main/less`, not `dist`)
- Old website CSS snapshot: `packages/angular-start-project/public/css/old.less.css` (reference copy
  of the CSS of `https://setmy.info/old/#/`; it is NOT referenced by `angular.json` or `index.html`,
  so it is a comparison artifact only)
- Old Angular 13 app templates: `/home/has/sources/solutions/has-web-app-new/frontend/packages/has-web-app-new-ng/src`
- One-year change diff: `/home/has/sources/components/setmy.info/submodules/setmy-info-less/dead-code-introduced.diff`
  (`package.json` / `package-lock.json` hunks intentionally ignored)

Method: every class and id selector defined in LESS sources was extracted and cross-referenced with
every class and id used in the Angular templates (`class="…"`, `[class.x]`, `routerLinkActive`,
`id="…"`), with the old app templates (including `[ngClass]`), and with the selectors of
`old.less.css`. Element-only selectors (`html`, `body`, `a`, `hr`, …) are resets that always apply
and are excluded from "unused".

## 2. What the new Angular app actually uses (the keep list)

Baseline for all deletion decisions. Everything used by the new app comes from these places:

- IDs: `#application`, `#background`, `#headerPanel`, `#footerPanel`, `#modalBody`, `#sidenav`,
  `#sideNavigationHeaderPanel`, `#sideNavigationContentPanel`
- From `setmy-info-less` (base): `.hidden`, `.phone-hidden`, `.centerText`, `.textCursor`, element
  resets, tokens (`values/index.less`), `canvas#background, div#background`, `#application`
- From `setmy-info-less-extended`: `.pageSectionNarrow` (utility/section.less), `.articleBody`,
  `.definitionTerm`, `.definitionDesc` (utility/article.less)
- From `angular-start-project-style/src/less/index.less`: `.material-symbols-outlined`,
  `.articleBody img`, `.applicationContentMain`, `.articleSectionPanel`, `.sectionHeaderPicture`
- From component `*.less` files: `.active`, `.noHover`, `.sideNavMenuItems`, `.sideNavThinMenuItems`,
  `.envBadge`, plus the id-based layout rules listed above

## 3. Unused / dead code in the setmy-info-less project

### 3.1 setmy-info-less-experimental — entire module is dead weight for the app line

The whole module was introduced inside the one-year window (every file below appears as a new file in
`dead-code-introduced.diff`). It is consumed by no project (the Angular app imports only base +
extended). The module README itself says "framework developers only, not for production". From the
Angular-template point of view every selector is unused and the module is ready for deletion as one
unit; keep it only if the staged-prototype workflow is still wanted.

| Module                       | File (under src/main/less)                                                                                                                                    | Section / selectors                                                                                                                                                                     | Note                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| setmy-info-less-experimental | base/button.less                                                                                                                                              | .btn, .btnPrimary, .btnSecondary, .btnSmall, .btnGroup, .btnGroupItem                                                                                                                   | unused everywhere                                                                     |
| setmy-info-less-experimental | base/color.less                                                                                                                                               | .bg…/.text… (bgPrimary, bgSecondary, bgAccent, bgInfo, bgSuccess, bgWarning, bgDanger, textMuted, textSubtle, textEmphasis, textAccent, textInfo, textSuccess, textWarning, textDanger) | unused everywhere                                                                     |
| setmy-info-less-experimental | base/color-named.less                                                                                                                                         | .AliceBlue … .WhiteSmoke (named-color helpers)                                                                                                                                          | unused everywhere                                                                     |
| setmy-info-less-experimental | base/keyvalue.less                                                                                                                                            | .kvList, .kvRow, .kvLabel, .kvValue                                                                                                                                                     | unused everywhere                                                                     |
| setmy-info-less-experimental | grid/index.less                                                                                                                                               | .grid2col, .grid3col, .grid4col, .gridAuto, .gridSpan2, .gridSpan3                                                                                                                      | moved here from base grid/ during the year; still unused                              |
| setmy-info-less-experimental | forms/forms.less                                                                                                                                              | .formGroup, .formRow, .fullWidthInput, .inlineLabel, .requiredMark, .validationError                                                                                                    | unused everywhere                                                                     |
| setmy-info-less-experimental | data/tables.less                                                                                                                                              | .stripedTable, .denseTable, .tableBordered, .tableFullWidth, .stickyHeader                                                                                                              | unused everywhere                                                                     |
| setmy-info-less-experimental | data/data.less                                                                                                                                                | .dataLabel, .statNumber, .kvRow, .propertyPanel, .emptyState, .loadingPlaceholder                                                                                                       | unused everywhere                                                                     |
| setmy-info-less-experimental | data/dashboard.less                                                                                                                                           | .dashboardGrid, .widgetCard, .widgetTitle, .chartContainer                                                                                                                              | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/card.less                                                                                                                                                  | .cardClickable, .cardCompact, .cardHighlight                                                                                                                                            | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/feedback.less                                                                                                                                              | .alert…, .badge…, .toastMessage, .validationError                                                                                                                                       | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/mediaObject.less                                                                                                                                           | .mediaObject, .mediaFigure, .mediaFigureRight, .mediaBody                                                                                                                               | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/navigation.less                                                                                                                                            | .breadcrumb, .paginationBar, .tabBar, .tabItem, .sideNavList, .sideNavItem                                                                                                              | unused; note .sideNavList/.sideNavItem overlap in intent with app's .sideNavMenuItems |
| setmy-info-less-experimental | ui/noticeBanner.less                                                                                                                                          | .noticeBanner, .noticeBannerStrong                                                                                                                                                      | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/positioning.less                                                                                                                                           | .fixedTop, .fixedBottom, .stickyTop, .aspectRatio…, .zIndex1–9                                                                                                                          | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/priceList.less                                                                                                                                             | .priceList, .priceRow, .priceName, .priceValue                                                                                                                                          | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/profileBlock.less                                                                                                                                          | .profileBlock, .profilePhoto, .profileText, .profileByline                                                                                                                              | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/states.less                                                                                                                                                | .disabled, .loading, .readonly, .selected                                                                                                                                               | unused everywhere                                                                     |
| setmy-info-less-experimental | ui/typography.less                                                                                                                                            | .bold, .italic, .underline, .strikethrough, .truncate, .breakWord, .noSelect, .fontSmall, .fontLarge, .lineHeightRelaxed                                                                | unused everywhere                                                                     |
| setmy-info-less-experimental | web/header.less, web/hero.less, web/tile.less, web/cta.less, web/footer.less, web/langToggle.less, web/scrollHint.less, web/sectionLead.less, web/slogan.less | .siteHeader…, .hero…, .tile…, .ctaBanner…, .siteFooter…, .langToggle…, .scrollHint, .sectionLead, .slogan                                                                               | unused everywhere; web chrome prototypes                                              |

### 3.2 setmy-info-less-ide — unused from the Angular project's perspective

Different audience (IDE-style UIs), so deletion is a product decision, not a dead-code fact. No
project in this workspace uses it.

| Module              | File (under src/main/less)                   | Section / selectors                                                                                                                                                                                            | Note                                                       |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| setmy-info-less-ide | frames/index.less                            | .content, .contentHeader, .contentFooter, .contentLeftUp, .contentLeftBottom, .contentRightUp, .contentRightBottom, .section…, .defaultHeader, .horizontalSeparator, .verticalSeparator, .framesDefaultPadding | moved from extended during the year; unused by Angular app |
| setmy-info-less-ide | experimental/experimental-frames-colors.less | named-color frame helpers (.Cyan, .MoreBlue, .blanchedalmond, …)                                                                                                                                               | unused everywhere                                          |

### 3.3 setmy-info-less-extended — unused parts (used parts must stay)

The Angular app uses only `.pageSectionNarrow`, `.articleBody`, `.definitionTerm`, `.definitionDesc`
from this module. All files below were added within the year (new files in the diff).

| Module                   | File (under src/main/less) | Section / selectors                                                           | Note                                                                                                                                       |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| setmy-info-less-extended | utility/card.less          | .card, .cardTitle, .cardBody, .cardGrid                                       | unused by new app; old site had no cards                                                                                                   |
| setmy-info-less-extended | utility/modal.less         | .overlay, .modal, .modalHeader, .modalBody (class), .modalClose, .modalFooter | unused; the app implements the overlay as id `#modalBody` in modal-overlay.component.less instead — parallel implementation, see section 6 |
| setmy-info-less-extended | utility/section.less       | .fullViewport, .pageSection, .sectionContentCenter, .sectionContentRow        | unused (only .pageSectionNarrow from this file is used)                                                                                    |
| setmy-info-less-extended | utility/article.less       | .blockquote, .codeInline, .codePre                                            | unused (only .articleBody, .definitionTerm, .definitionDesc from this file are used)                                                       |
| setmy-info-less-extended | utility/header.less        | empty file (comment only)                                                     | delete or fill; imported by utility/index.less                                                                                             |

### 3.4 setmy-info-less (base) — dead or never-matching rules

| Module          | File (under src/main/less) | Section / selectors                                                                                   | Note                                                                                                                                                                                                                        |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| setmy-info-less | devices/phone.less         | `#header-panel { height: auto; }`                                                                     | NEVER MATCHES: both the old site and the new app use id `headerPanel` (camelCase). Rename to `#headerPanel` or drop; the same rule is duplicated in the app's header-panel.component.less which is why the bug is invisible |
| setmy-info-less | devices/watch.less         | `#header-panel { height: auto; }`                                                                     | same mismatch as above                                                                                                                                                                                                      |
| setmy-info-less | utility/visibility.less    | .invisible, .visible                                                                                  | added within the year (diff); used by no app, old site did not have them; .hidden is the only visibility class in use                                                                                                       |
| setmy-info-less | utility/cursor.less        | .cursorVerticalResize, .cursorHorizontalResize                                                        | used nowhere, not in old site CSS                                                                                                                                                                                           |
| setmy-info-less | utility/sizing.less        | .defaultHeight, .halfHeight                                                                           | used nowhere, not in old site CSS                                                                                                                                                                                           |
| setmy-info-less | utility/layout.less        | .leftText, .rightText                                                                                 | used nowhere, not in old site CSS (.centerText is used — keep)                                                                                                                                                              |
| setmy-info-less | flex/index.less            | .smi-flex-panel and modifiers (&-left, &-center, &-right, &-box, &-column, &-row), .debug-style mixin | not used by the new app, not present in old site CSS; keep only if flex helpers remain part of the framework API                                                                                                            |
| setmy-info-less | utility/panels.less        | .horizontalStretchPanel, .verticalStretchPanel                                                        | not used by new app; old site used the TYPO variants .horisontalStrechPanel / .verticalStrechPanel — this is a rename, see section 6                                                                                        |

### 3.5 setmy-info-less (base) — unused by the new app but part of the old site's API (keep)

These utility classes are not referenced by the new Angular app today, but they exist in
`old.less.css` and were used by the old site or old app. They are the library's public utility API —
do not delete during the app cleanup. Reference: `utility/spacing.less` (all no*/default*/double*
padding+margin classes), `utility/scroll.less` (scrollbar classes), `utility/sizing.less`
(maxWidth/maxHeight/halfWidth/quarterWidth/threeQuartersWidth/elementHeight/lineHeight),
`utility/layout.less` (float*, noWrap, tableElement, centerBox), `utility/text.less` (asUppercase,
asLowercase, firstAsUppercase, textColorGray), `utility/visual-style.less` (defaultBorder,
defaultShadow, defaultRadius, normalBackground, defaultTextBackground, minifiedText),
`utility/notes.less` (importantNote, timeLabel, detailed), `utility/cursor.less` (pointerCursor),
`devices/pad.less` (.pc-hidden).

### 3.6 Placeholder modules (not dead code, intentional)

`setmy-info-less-enterprise`, `setmy-info-less-fancy` and the new
`setmy-info-less-angular-start-project` are empty skeletons by design (main.less + empty
utility/index.less). Nothing to delete.

## 4. Unused / dead code in the Angular workspace

This table covers two different checks: rows found by cross-referencing against setmy-info-less
(same method as section 3), and rows found by a purely internal self-audit — comparing each Angular
component's own `*.less` against that same component's own `*.html`, and `angular-start-project-style`
against everything under `angular-start-project/src`. Rows marked "self-audit" below are dead or
disabled entirely within this workspace, independent of the LESS project.

| Module                      | File (location)                                                                      | Section / selectors                                                                                                              | Note                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| angular-start-project       | src/app/components/layout/side-navigation-panel/side-navigation-panel.component.less | second `#sideNavigationHeaderPanel` block (lines 19–23)                                                                          | exact duplicate of the block directly above it — delete one                                                                                                                                                                                                                                                                                                                                                        |
| angular-start-project       | src/app/components/layout/side-navigation-panel/content/index.less                   | `.sideNavMenuItems > li > a`, `.sideNavMenuItems > li > a.active`, `.sideNavMenuItems > li > a:hover` (block around lines 71–90) | selector never matches: in the DOM the class sits ON the li (`li.sideNavMenuItems > a`), not above it. Contains leftover debug `background: green` and LESS variables. Whole block is dead — delete                                                                                                                                                                                                                |
| angular-start-project       | src/app/components/layout/side-navigation-panel/content/index.less                   | duplicated icon styling in `…sideNavMenuItems > a > i`                                                                           | repeats the global `.material-symbols-outlined` definition from angular-start-project-style; templates already put that class on the `i` — candidate for simplification                                                                                                                                                                                                                                            |
| angular-start-project       | public/css/old.less.css                                                              | entire file                                                                                                                      | reference snapshot of the old site CSS; not loaded by the build. Keep while this migration document is being executed, delete afterwards                                                                                                                                                                                                                                                                           |
| angular-start-project-style | brand-example/brand.less                                                             | .brandHero, .brandSection                                                                                                        | self-audit: defined only for the standalone `build:brand-example` demo (its own `dist/brand.css`); no class or import anywhere under `angular-start-project/src` references it — 0% consumed by the webapp bundle, per environment/brand split                                                                                                                                                                     |
| angular-start-project       | src/app/components/layout/side-navigation-panel/side-navigation-panel.component.html | comment `TODO : code like old` (line 1)                                                                                          | resolved by the language-selector addition (2026-07-04); remove the TODO on the next edit                                                                                                                                                                                                                                                                                                                          |
| angular-start-project       | src/app/components/layout/modal-body-panel/modal-overlay.component.html              | ~~comment `TODO : like in old`~~ — **done 2026-07-05**                                                                           | removed; see section 10.6 — the visibility mechanism now also matches the old app (`class="hidden"`, not just the id)                                                                                                                                                                                                                                                                                              |
| angular-start-project       | src/app/app.less                                                                     | entire `:host { display: block; height: 100%; width: 100%; }` block, wrapped in `/* … */`                                        | self-audit: fully commented out — emits no CSS. `app.html`'s root children (`header-panel`, `main-panel`, `modal-body-panel`, `side-navigation-panel`, `app-background`) default to `display: inline` on their host unless something else establishes block layout. Decide: re-enable, delete, or fix properly — same class of issue as the header-panel/footer-panel `:host` note in the CSS architecture lessons |
| angular-start-project       | src/app/components/background/background.component.less                              | entire file                                                                                                                      | self-audit: contains only the base-tokens import (`@import url("setmy-info-less/src/main/less/values/index.less")`), no rules of its own — compiles to zero CSS. All `#background`/`div#background` styling comes from setmy-info-less `components/background.less`; this file is a skeleton, same pattern as the LESS placeholder modules (section 3.6)                                                           |
| angular-start-project       | src/app/components/layout/modal-body-panel/modal-overlay.component.less              | comment `// TODO : need to be deleted until modalBody is in lees project` (line 1)                                               | self-audit: the `#modalBody` rule below it IS used (matches the div in modal-overlay.component.html) — not dead — but the author's own comment marks the file as a temporary stand-in, reinforcing the modal question in table 6.1: this id-based rule is meant to be retired once `setmy-info-less-angular-start-project` (or extended's `.modal`/`.overlay` classes) carries the real implementation             |

## 5. Missing CSS targets

### 5.1 Used in the new Angular app but styled nowhere

| Module                | File (location)                      | Selector             | Note                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| angular-start-project | side-navigation-panel.component.html | .sideNavigationPanel | marker class carried over from the old app; the old site's CSS never styled it either (visibility was done via `.hidden`, now via `[style.display]`). Either add a rule to the new LESS module or document it as a pure marker/test hook |

### 5.2 Old-site CSS sections not yet present in the new Angular project or any LESS module

These selectors exist in `old.less.css` (and most are used by the old app templates) but have no
definition in the new stack. They are the backlog for filling the new
`setmy-info-less-angular-start-project` module (application chrome) or a future website-content
module — or they die with the pages that are not migrated.

| Source   | old.less.css section (selector)                                                                                                                                   | Used by old app | Suggested target                                                                                                                                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| old site | .homePage                                                                                                                                                         | yes             | per-view LESS of the new app (views/home) or new angular-start-project LESS module                                                                                                                                                                                                                                                           |
| old site | ~~.contactsPage~~ — **done 2026-07-05**                                                                                                                           | yes             | ported into `contact.component.less`, re-scoped to the component (no `.applicationContentMain` ancestor prefix needed)                                                                                                                                                                                                                       |
| old site | .productsServicesPage                                                                                                                                             | yes             | only if that view gets migrated                                                                                                                                                                                                                                                                                                              |
| old site | .articlesPage                                                                                                                                                     | yes             | only if articles view gets migrated                                                                                                                                                                                                                                                                                                          |
| old site | .articleOverviewContentBox, .articleOverviewContentBoxWindow, .articleOverviewContentBoxShadow, .articleOverviewContentBoxPicture, .articleOverviewContentBoxText | yes             | article-overview component, if migrated                                                                                                                                                                                                                                                                                                      |
| old site | ~~.iconPanel, .labelPanel, .textPanel~~ — **done 2026-07-05**                                                                                                     | yes             | ported into `contact.component.less` — the "decide one pattern" question below is now resolved in favor of icon-rows (matches the old app); settings page (section 10.2) keeps `.definitionTerm`/`.definitionDesc` since it has no old-app icon-row equivalent                                                                               |
| old site | .imagePanel                                                                                                                                                       | yes             | NOT part of the contact-page port above (the old contacts-page template didn't use it either) — still open if a page using it gets migrated                                                                                                                                                                                                  |
| old site | .sectionImage                                                                                                                                                     | yes             | home/article section imagery; partially replaced by .sectionHeaderPicture in angular-start-project-style                                                                                                                                                                                                                                     |
| old site | ~~.consentBody (under #headerPanel)~~ — **done 2026-07-05**                                                                                                       | yes             | ported into `consent-body-panel.component.less` as `#consentBody` (own component, not nested under `#headerPanel` in CSS — see section 9.1)                                                                                                                                                                                                  |
| old site | .detailsLevelList                                                                                                                                                 | yes             | article detail-level widget, if migrated                                                                                                                                                                                                                                                                                                     |
| old site | ~~.alertMaterialIcon~~ — **done 2026-07-05**                                                                                                                      | yes             | ported: the offline (`signal_wifi_off`) indicator `<li>` in `header-panel.component.html` was a dead `<li class="hidden"></li>` stub (network state was dropped during migration); now driven by a new `NetworkService` (`navigator.onLine` + `online`/`offline` window listeners) with the color rule in `header/network-status-panel.less` |
| old site | .material-icons                                                                                                                                                   | yes             | superseded by .material-symbols-outlined — do NOT migrate, see renames                                                                                                                                                                                                                                                                       |
| old site | #headerPanel responsive blocks (media queries at old.less.css lines 1069, 1081)                                                                                   | yes             | the base module's devices/*.less carry these as `#header-panel` — never matching; see rename table                                                                                                                                                                                                                                           |

### 5.3 Old app marker classes that never had CSS

Used in old app templates only, no styles in `old.less.css`: .adsPage, .commercialsPage, .helpPage,
.newsPage, .notFoundPage, .privacyPage, .sponsorsPage, .templatePage,
.toolsPage, .asVerticallyMiddle, .tableCellElement, .hover, .odt, plus content anchor ids
(#articles, #artiklid, #kontakt, …). Nothing to migrate; do not create CSS for these.

**Update 2026-07-05:** `.settingsPage` and `.termsPage` (removed from the list above) are now
carried over as marker classes on the new `settings.component.html` / `terms.component.html`
views (section 9.2/9.3) — still with no CSS attached, matching the old app's own convention for
these two classes. `/settings` and `/terms` are routed but intentionally not added to
`menuModel.js` — the old app didn't link them from any menu either, only the footer copyright
link points at `/terms`.

## 6. Renamed or refactored parts (must be taken into account before deleting)

### 6.1 Rename / replacement mapping

| Old name (old site / old app)                                                                  | New name (new stack)                                         | Where                                           | Status                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| .horisontalStrechPanel                                                                         | .horizontalStretchPanel                                      | setmy-info-less utility/panels.less             | typo fixed in the library; nothing uses either name in the new app yet                                                                                                               |
| .verticalStrechPanel                                                                           | .verticalStretchPanel                                        | setmy-info-less utility/panels.less             | same as above                                                                                                                                                                        |
| .material-icons (Google Material Icons font)                                                   | .material-symbols-outlined (self-hosted Material Symbols)    | angular-start-project-style/src/less/index.less | icon font migration; old class must not come back                                                                                                                                    |
| canvas#background                                                                              | div#background (tsParticles canvas inside)                   | setmy-info-less components/background.less      | diff shows canvas→div change; the file now targets BOTH `canvas#background, div#background` — after migration is settled, drop the selector that is no longer produced               |
| #headerPanel (old site + new app)                                                              | #header-panel (setmy-info-less devices/*.less)               | base module vs applications                     | INCONSISTENT rename inside the library only — the media-query rules never match any real page. Decide one spelling; the cheap fix is renaming the library rules back to #headerPanel |
| .hidden toggled via ngClass on #sidenav                                                        | `[style.display]` binding                                    | side-navigation-panel.component.html            | deliberate change because `.sideNavigationPanel { display: flex }` would beat `.hidden` at equal specificity                                                                         |
| .overlay/.modal/.modalHeader/.modalBody/.modalClose/.modalFooter (extended utility/modal.less) | #modalBody id-based overlay (modal-overlay.component.less)   | extended module vs app component                | two parallel modal implementations; the app kept the old site's id-based one. Pick one: either adopt extended's classes in the app or delete them from extended                      |
| .sideNavList/.sideNavItem (experimental ui/navigation.less)                                    | .sideNavMenuItems/.sideNavThinMenuItems (app component LESS) | experimental vs app                             | same intent, different names; the experimental pair is unused                                                                                                                        |

### 6.2 Structure moves inside setmy-info-less during the year (from dead-code-introduced.diff)

- base `grid/index.less` deleted → grid helpers now live in `setmy-info-less-experimental/grid/`
- base `html/html-extended.less` deleted → content components split out to `setmy-info-less-extended`
- `setmy-info-less-extended/frames` and `experimental-frames-colors` moved → `setmy-info-less-ide`
- removed packages `setmy-info-less-ui`, `setmy-info-less-forms`, `setmy-info-less-data` → merged into
  `setmy-info-less-experimental` subdirectories `ui/`, `forms/`, `data/`
- `.invisible`, `.visible` added to base `utility/visibility.less` (unused, see table 3.4)
- `div#background` added next to `canvas#background` in base `components/background.less`

## 7. New module: setmy-info-less-angular-start-project (created 2026-07-04)

An empty placeholder module now exists in the LESS multimodule project:

- Location: `packages/setmy-info-less-angular-start-project` in the setmy-info-less workspace
- Layer 2 consumer package with a direct dependency on `setmy-info-less-extended` (load order:
  base, extended, angular-start-project)
- Standalone/delta model like every other module; `main.less` imports base `values/index.less` for
  tokens only plus its own (empty) `utility/index.less`
- Wired into the workspace build (`npm run build --workspace setmy-info-less-angular-start-project`
  verified: css, css-min, html, styleguide, lint all pass); root `README.md` updated (module list,
  dependency graph, independence table, stability list, build order)

Its purpose: become the home of the Angular template application chrome CSS that currently lives in
the Angular workspace (`angular-start-project-style/src/less/index.less` application rules and the
per-component `*.less` files: header panel, navigation, side navigation, modal overlay, footer,
views) plus whatever from table 5.2 gets migrated.

## 8. Ordered refactoring plan (next steps for AI agents)

1. Fix the never-matching selectors first (no visual risk):
   delete the duplicate `#sideNavigationHeaderPanel` block and the dead `.sideNavMenuItems > li > a`
   block (table 4); rename `#header-panel` to `#headerPanel` in base `devices/phone.less` and
   `devices/watch.less` (table 3.4 row 1–2), then remove the now-redundant `#headerPanel { height:
auto; }` duplicate from `header-panel.component.less` if the media-query behaviour is confirmed.
2. Delete the safe base-module dead classes from table 3.4 (`.invisible`, `.visible`,
   `.cursorVerticalResize`, `.cursorHorizontalResize`, `.defaultHeight`, `.halfHeight`, `.leftText`,
   `.rightText`) after a final grep across all setmy.info consumers.
3. Decide the modal question (table 6.1): adopt extended's `.overlay/.modal…` classes in the app's
   modal-overlay component, or delete `utility/modal.less` from extended.
4. Trim `setmy-info-less-extended` to what is used (table 3.3): keep section.less
   (.pageSectionNarrow), article.less (.articleBody, .definitionTerm, .definitionDesc), delete or
   consciously keep card.less, the empty header.less, and the losers of step 3.
5. Decide the fate of `setmy-info-less-experimental` (table 3.1) and the ide frames (table 3.2):
   delete outright, or keep as staged prototypes; nothing depends on them.
6. Populate `setmy-info-less-angular-start-project` (section 7): move the application-chrome rules
   out of `angular-start-project-style/src/less/index.less` and the per-component `*.less` files,
   consolidating the Material Symbols duplication noted in table 4; switch
   `angular-start-project-style` to import the new module.
7. Migrate the still-wanted old-site sections from table 5.2 into the new module or per-view LESS,
   honouring the rename table 6.1 (never reintroduce .material-icons or the Strech typos).
8. When steps 6–7 are complete: delete `public/css/old.less.css` and this document's tables become
   history; verify with `npx ng build`, `npx ng test --no-watch`, and the LESS workspace `npm run
build --workspaces`.

## 9. Language selector in the side navigation (done 2026-07-04, precondition for this plan)

The language change was added to the side navigation below the menu items after the horizontal line,
replicating the old app's structure (`li.sideNavMenuItems` with an icon anchor and a `select`
dropdown, old app file side-navigation-panel.component.html):

- `side-navigation-panel.component.html`: new `li.sideNavMenuItems` after the `li.sideNavThinMenuItems`
  hr item — anchor with `<i>language</i>` icon + `view.language` translation, and a `select` of
  `languageService.supportedLanguages` with the current language preselected
- `side-navigation-panel.component.ts`: `onLanguageChange()` delegating to
  `LanguageService.changeLanguage()`
- `content/index.less`: ported the old site's rules `#sideNavigationContentPanel > ul li:last-child`,
  `… li > div` and `… li > div > select` from old.less.css (lines 718–743)

Verified: `npx ng build` passes; `npx ng test --no-watch` shows the same 10 pre-existing failures as
the untouched branch baseline (modal-overlay, header-panel, side-navigation-panel specs — failing
before this change), 42 passing.

## 10. Ported from the old app in this pass (done 2026-07-05)

Four more pieces carried over from `has-web-app-new-ng`, closing gaps this document had flagged
(section 5.2/5.3). Content matches the old app; structure follows this app's own view-component
convention (`<section class="…"><article class="articleBody"><div class="articleSectionPanel">`)
rather than the old app's div/article/div/section nesting.

### 10.1 Material Symbols switched from outlined to filled

`angular-start-project-style/src/less/index.less` `.material-symbols-outlined` now sets
`font-variation-settings: 'FILL' 1;`. No new font file needed — the self-hosted `.woff2` is
already the real variable font (the `@font-face` `font-weight: 100 700` range proves it), so it
carries the `FILL` axis even though the class/family name says "Outlined" (that name is only the
glyph-shape family — Outlined vs Rounded vs Sharp — not the fill state). This matches the old
app's Material Icons look, which was filled-only by design.

### 10.2 Settings view (`/settings`, not in the main menu — matches old app)

New `views/settings/settings.component.{ts,html,less}`, routed at `/settings` in `app.routes.ts`,
not added to `menuModel.js` (old app never linked `/settings` from a menu either — URL-only).
Content is diagnostic, adapted from the old app's `settings-page.component.html` (`Lang`,
`Service workers support`, `Sub system`, `Is IE`, `Version`, `Referrer`) to this app's real
services instead of the old `modelService`/`browserService`: current language code, `environment`
(`envName` + `apiBaseUrl`), `!!navigator.serviceWorker`, `document.referrer`. New translation keys
`view.settings.*` in `translationService.js`. `.settingsPage` marker class kept, no CSS (per 5.3).

### 10.3 Terms view (`/terms`) + footer copyright link fixed

New `views/terms/terms.component.{ts,html,less}`, routed at `/terms`. Full legal text ported
verbatim (et/en) from the old app's `terms-page.component.html`, gated by
`@if (languageService.currentLanguageCode() === 'et'|'en')` instead of the old
`*ngIf="translations.current.lang === …"`. The old page's closing "Privacy policy" paragraph
(linking to `/privacy`) was dropped — this app has no privacy route and adding one wasn't in
scope; re-add that paragraph if/when a privacy view is ported. `footer-panel.component.html`'s
copyright `<a href="#terms">` (a dead anchor — `#terms` matches nothing) was changed to
`<a routerLink="/terms">`, matching the old app's own `main-panel.component.html`
(`<a routerLink="/terms">…</a>`) — the old app already used a real route link here, not a hash
anchor. `.termsPage` marker class kept, no CSS (per 5.3).

### 10.4 Consent/cookie panel (closes 5.2's `.consentBody` gap)

New layout component `consent-panel` (`components/layout/consent-panel/`), mounted as the last
child of `#headerPanel` in `header-panel.component.html` — same DOM position as the old app's
`<consent-body-panel>` inside its `header-panel.component.html`. `#consentBody` CSS ported from
`old.less.css`'s `#headerPanel div.consentBody` block (lines 383–408), re-scoped to the
component's own `#consentBody` (Angular view encapsulation means it no longer needs the
`#headerPanel` ancestor prefix — same pattern as `#modalBody` in `modal-overlay.component.less`).

Storage/consent-state design is a new `consentService` in `angular-start-project-library`
(`localStorage.getItem('consent')` → `{forCookieUsage: boolean}` JSON, wrapped in try/catch) plus
an Angular `ConsentService` (`src/app/services/consent.service.ts`, a `hasConsented` signal
initialized from the library call). This mirrors the old app's `consentService.js` shape
(`modelService.consent.forCookieUsage` + `saveConsent()`) but reimplemented against this app's
signal-based service pattern instead of the old app's shared mutable `modelService` object. Old
app's `[ngClass]="{hidden: modelService.consent.forCookieUsage}"` became
`[style.display]="consentService.hasConsented() ? 'none' : ''"` (`ngClass` is forbidden by
AGENTS.md; `[style.display]` also sidesteps the `.hidden`-vs-specificity issue from the CSS
architecture lessons). The old privacy-policy link inside the banner was replaced with a link to
the new `/terms` page (no `/privacy` route exists — see 10.3).

Verified end-to-end in a real browser (Playwright against `ng serve`): banner renders on first
load, hides on accept, **stays hidden after a full page reload** (confirms the localStorage
persistence works), footer link navigates to `/terms`, `/settings` renders live data. `npx ng
build` passes; `npx ng test --no-watch` is back to the same 10 pre-existing baseline failures
(51 passing, up from 42 — the 9 new tests across `settings`, `terms`, and `consent-panel` specs
all pass).

### 10.5 Contact page switched to the old app's icon-row layout (done 2026-07-05)

Resolves the "decide one pattern" question from table 5.2: `contact.component.html` now uses the
old app's `contacts-page.component.html` icon/label/text row structure (`div.iconPanel` +
`div.labelPanel` + `div.textPanel` per contact field — organisation/address/phone/email, one row
each) instead of a `<dl>`/`.definitionTerm`/`.definitionDesc` list. `.material-symbols-outlined`
icons (`work`, `place`, `phone`, `email`) replace the old app's `Material Icons` font — same rename
already applied everywhere else (table 6.1). `.definitionTerm`/`.definitionDesc` are not orphaned:
the settings view (section 10.2) still uses them, since it has no old-app icon-row equivalent to
port instead.

`contact.component.less` ports the row/`.iconPanel`/`.labelPanel`/`.textPanel` rules from
`old.less.css` (lines 988–1032, `.applicationContentMain.contactsPage>article>div.articleSectionPanel>section>div…`),
re-scoped to just `.contactsPage > article > div.articleSectionPanel > section > div…` — the
`.applicationContentMain` ancestor prefix isn't needed once the rule lives in the component's own
scoped stylesheet, same simplification already applied to `#consentBody` (10.4) and `#modalBody`.

Verified: `npx ng build` passes; `npx ng test --no-watch` still shows the same 10 pre-existing
baseline failures (57 passing, up from 56 — the contact spec's rewritten row-based assertions
pass); confirmed visually in a browser that all four rows render with a filled icon on the left,
label and value on the right.

### 10.6 Modal overlay: `[style.display]` binding replaced with `class="hidden"` (done 2026-07-05)

`modal-overlay.component.html`'s `[style.display]="modalService.isOpen() ? 'block' : 'none'"`
became `[class.hidden]="!modalService.isOpen()"` — no inline `style` attribute at all now, matching
the old app's `modal-body-panel.component.html` (`[ngClass]="{hidden: !modelService.modalPanelVisible}"`,
adapted to `[class.hidden]` since `ngClass` is forbidden by `AGENTS.md`). Safe here, unlike the
side-navigation-panel case in section 9: `#modalBody` in `modal-overlay.component.less` (table 4's
"still needs deleting" TODO) never sets its own `display`, so there is no competing same-specificity
rule for `.hidden` to lose against — the div's browser-default `display: block` is simply toggled
off by the global `.hidden { display: none; }` (`setmy-info-less/utility/visibility.less`).

While in this file, also fixed a bug in `modal-overlay.component.spec.ts` that was the actual cause
of all 4 pre-existing baseline failures for this component: every test queried `#modal-overlay`,
which has never existed in the markup — the real id is `modalBody`. Corrected the selector and
rewrote the display-based assertions as `classList.contains('hidden')` checks.

Verified in a real browser: `#modalBody` has no `style` attribute at any point; `classList` is
exactly `"hidden"` when closed and empty when open; computed `display` is `none`/`block`
accordingly; clicking the overlay re-adds the class and closes it. `npx ng build` passes; `npx ng
test --no-watch` — this component's 4 failures are now fixed (61 passing, up from 57); the
remaining 6 pre-existing failures are unrelated (header-panel ×2, side-navigation-panel ×4).

## 11. Fresh full comparison (2026-07-12): setmy-info-less selectors unused by the current Angular app — DELETE / MOVE-TO-EXPERIMENTAL action plan

Re-run of the section-1 method against the CURRENT state of both projects (the app has grown a
lot since section 2: privacy, settings, terms, consent panel, the
eight old-app pages, content-driven contact page; the LESS project had its own "Cleanup and moved
less" commit). Where this section disagrees with the older tables in section 3, THIS section is
the current truth — section 3 is kept as history. Result: of 305 class/id selectors defined in
setmy-info-less sources, the current Angular app uses 10; 295 are unused by it. This section is
the executable plan for the follow-up step: remove code or move it into
`setmy-info-less-experimental`, row by row.

### 11.1 Changes already executed in the LESS project since the section-3 analysis

- Base `flex/index.less` (`.smi-flex-panel` + modifiers) was already MOVED to
  `setmy-info-less-experimental/flex/` — exactly what section 3.4 suggested; done.
- `#modalBody` (the app's grey full-screen overlay rule) was MOVED from
  `modal-overlay.component.less` (now an empty file) into
  `setmy-info-less-extended/utility/modal.less` — the "modal question" of table 6.1 is thereby
  resolved in favor of the id-based implementation; the class-based `.overlay`/`.modal…` set in
  the same file remains unused (see 11.4).
- `public/css/old.less.css` was deleted from the Angular app (section 8 step 8 executed), so
  "was in the old site" markers in this section come from the section-3 analysis, not a re-scan.

### 11.2 What the current Angular app still uses from setmy-info-less (the keep list)

| Module                   | File (under src/main/less)             | Selectors                                                 |
| ------------------------ | -------------------------------------- | --------------------------------------------------------- |
| setmy-info-less          | components/application.less            | `#application`                                            |
| setmy-info-less          | components/background.less             | `canvas#background, div#background`                       |
| setmy-info-less          | utility/visibility.less                | `.hidden`                                                 |
| setmy-info-less          | utility/cursor.less                    | `.textCursor`                                             |
| setmy-info-less          | devices/watch.less, devices/phone.less | `.phone-hidden` (+ the element-level `main` height rules) |
| setmy-info-less-extended | utility/article.less                   | `.articleBody`, `.definitionTerm`, `.definitionDesc`      |
| setmy-info-less-extended | utility/modal.less                     | `#modalBody` (id rule only)                               |

Also load-bearing but not class/id tokens (excluded from "unused" by method): all element resets
in base `html/html.less`, every LESS variable in `values/`, and the `main { height: … }` device
media rules. `.pc-hidden` (devices/pad.less) is technically unused by the app but is the exact
inverse pair of the used `.phone-hidden` and part of the device-breakpoint contract — KEEP.
Note: the app's `.active` styling comes from the app's own component LESS files; the identically
named `.active` in `setmy-info-less-experimental/ui/{navigation,states}.less` is a coincidental
name match, NOT a dependency.

### 11.3 DELETE — dead everywhere (not used by the app now, not part of the old site's utility API either)

| Module                   | File (under src/main/less) | Selectors / section                                | Action                                                                                                                                                                |
| ------------------------ | -------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| setmy-info-less          | devices/phone.less         | `#header-panel { height: auto; }` block            | DELETE the block — never matches (old site and app both use id `headerPanel`; the app's header-panel.component.less carries its own `#headerPanel { height: auto; }`) |
| setmy-info-less          | devices/watch.less         | `#header-panel { height: auto; }` block            | DELETE the block — same mismatch                                                                                                                                      |
| setmy-info-less          | utility/visibility.less    | `.invisible`, `.visible`                           | DELETE — added within the dead-code year, used nowhere ever; keep only `.hidden` in the file                                                                          |
| setmy-info-less          | utility/cursor.less        | `.cursorVerticalResize`, `.cursorHorizontalResize` | DELETE — used nowhere ever                                                                                                                                            |
| setmy-info-less          | utility/sizing.less        | `.defaultHeight`, `.halfHeight`                    | DELETE — used nowhere ever                                                                                                                                            |
| setmy-info-less          | utility/layout.less        | `.leftText`, `.rightText`                          | DELETE — used nowhere ever (`.centerText` is different: old-site API, see 11.4)                                                                                       |
| setmy-info-less-extended | utility/header.less        | entire file (comment only, zero rules)             | DELETE file + its import in utility/index.less                                                                                                                        |

### 11.4 MOVE to setmy-info-less-experimental — library API unused by the only consumer

These were the old site's utility API (per the section-3 old.less.css comparison) but no current
project uses them. Move source files/blocks into `setmy-info-less-experimental` (the declared
staging area for unvalidated/unconsumed CSS), following the same pattern already used for
`flex/` and grid/base/ui/forms/data; re-promote individual files later when a consumer appears.

| Module                   | File (under src/main/less) | Selectors / section                                                                                                                                      | Action                                                                                                                                              |
| ------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| setmy-info-less          | utility/spacing.less       | entire file (~40 no*/default*/double*/element* padding+margin classes, incl. the `.elementLeftRightPatting` typo — fix the name to …Padding when moving) | MOVE file → experimental                                                                                                                            |
| setmy-info-less          | utility/scroll.less        | entire file (autoScrollBars, noScrollBars, verticalScrollBar, horizontalScrollBar, noVerticalScrollBar, noHorizontalScrollBar)                           | MOVE file → experimental                                                                                                                            |
| setmy-info-less          | utility/text.less          | entire file (asUppercase, asLowercase, firstAsUppercase, textColorGray)                                                                                  | MOVE file → experimental                                                                                                                            |
| setmy-info-less          | utility/visual-style.less  | entire file (defaultBorder, defaultShadow, defaultRadius, normalBackground, defaultTextBackground, minifiedText)                                         | MOVE file → experimental                                                                                                                            |
| setmy-info-less          | utility/notes.less         | entire file (importantNote, timeLabel, detailed)                                                                                                         | MOVE file → experimental                                                                                                                            |
| setmy-info-less          | utility/panels.less        | entire file (horizontalStretchPanel, verticalStretchPanel)                                                                                               | MOVE file → experimental                                                                                                                            |
| setmy-info-less          | utility/sizing.less        | remainder after 11.3 (maxWidth, maxHeight, maxWidthHeight, elementHeight, lineHeight, halfWidth, quarterWidth, threeQuartersWidth)                       | MOVE remainder → experimental (file then disappears from base)                                                                                      |
| setmy-info-less          | utility/layout.less        | remainder after 11.3 (floatLeft, floatRight, floatNone, floatClear, noWrap, tableElement, centerBox, centerText)                                         | MOVE remainder → experimental                                                                                                                       |
| setmy-info-less          | utility/cursor.less        | `.pointerCursor`                                                                                                                                         | MOVE → experimental; `.textCursor` stays in base (used)                                                                                             |
| setmy-info-less-extended | utility/card.less          | entire file (card, cardTitle, cardBody, cardGrid)                                                                                                        | MOVE file → experimental (merge/reconcile with experimental ui/card.less variants)                                                                  |
| setmy-info-less-extended | utility/section.less       | entire file (pageSection, pageSectionNarrow, fullViewport, sectionContentCenter, sectionContentRow)                                                      | MOVE file → experimental — `.pageSectionNarrow` lost its last consumer when view-not-found was rebuilt on the standard applicationContentMain shell |
| setmy-info-less-extended | utility/article.less       | `.blockquote`, `.codeInline`, `.codePre` only                                                                                                            | MOVE these three → experimental; `.articleBody`, `.definitionTerm`, `.definitionDesc` stay (used)                                                   |
| setmy-info-less-extended | utility/modal.less         | `.overlay`, `.modal`, `.modalHeader`, `.modalBody` (class), `.modalFooter`, `.modalClose`                                                                | MOVE the class-based set → experimental; the `#modalBody` id rule stays (used by the app's modal overlay)                                           |

### 11.5 No action needed

- `setmy-info-less-experimental` — all ~150 of its selectors are unused by the app, but that IS
  the staging module; nothing to do (it is the destination of 11.4, not a source).
- `setmy-info-less-ide` (frames, experimental-frames-colors) — unused by this app but a separate
  audience/product (IDE-style UIs); out of scope for this app-driven cleanup.
- `setmy-info-less-enterprise`, `setmy-info-less-fancy`, `setmy-info-less-angular-start-project`
  — intentional empty skeletons.
- Base `values/`, `html/`, `devices/` element rules, `components/` — keep (see 11.2).

### 11.6 Execution order for the follow-up pass

1. 11.3 deletions (no visual risk anywhere — verify with `npm run build --workspaces` in the LESS
   project and `npx ng build` + `npx ng test --no-watch` in the app).
2. 11.4 whole-file moves (spacing, scroll, text, visual-style, notes, panels, card, section):
   move file under `setmy-info-less-experimental/<category>/`, add the import to experimental's
   index chain, remove it from the source module's index. Follow the flex/ move as the example.
3. 11.4 split files (sizing, layout, cursor, article, modal): create the experimental
   counterpart file with the moved rules, delete them at the source, keep the named survivors.
4. Rebuild both projects + run the LESS project's smoke/lint (`npm run smoke:dist`,
   `npm run lint:less --workspaces`) and the app test suite; verify the app visually (header,
   side nav, modal overlay, article detail, contact).
5. Update this document: mark 11.3/11.4 rows as done, refresh 11.2 if usage changed.
