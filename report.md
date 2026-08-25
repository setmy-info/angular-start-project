# angular-start-project — build refactoring report

Date: 2026-08-25

## Scope

Migrated this repository's build onto the org's shared, Maven-mirroring lifecycle — the same structure already
implemented in `setmy.info-js` (npm), `setmy.info-python`, `setmy.info-elixir` and `setmy-info-less`, per **ADR-0045**
and `setmy.info-js/requirements-rules.md`. Maven phase names, order and gating behaviour are the priority; the tools
behind each phase are the ones that suit each module type.

This repo is the most heterogeneous of the five: one Angular application, one framework-independent JS library and two
LESS packages live side by side. The lifecycle handles that with a declared **`config.moduleType`** per package
(`angular-app` | `js-library` | `less-package`) that the shared `tools/*` dispatch on — the phase NAMES stay identical
for all of them, only what a phase runs differs. That is the extension point the JS sibling's README describes
("Adapting the skeleton to other module types"), used here for real for the first time.

## Phase mapping (Maven → this repo, per module type)

| Maven                | angular-app                                                                                               | js-library                                             | less-package                          |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `clean`              | dist/, .angular cache, site/, coverage/                                                                   | dist/, site/                                           | dist/, site/                          |
| `validate`           | angular.json present, **build configuration names hard-checked against the ADR-0041 six**, `tsc --noEmit` | manifest checks + **no Angular/RxJS import allowed**   | manifest checks, `main` is index.less |
| `generate-sources`   | `bin/versionModule.js` → `src/app/config/version.ts`                                                      | n/a                                                    | n/a                                   |
| `process-resources`  | `ng build --configuration <profile>` IS the profile mechanism (fileReplacements)                          | `${token}` filtering if a `resources/` dir exists      | same                                  |
| `compile`            | `ng build --configuration <profile>`                                                                      | load-check with a minimal DOM + build-info.json        | `lessc` → dist/index.css + .min.css   |
| `test`               | `ng test` (Vitest, 81 tests)                                                                              | `node --test test/unit`                                | (none yet)                            |
| `integration-test`   | (none yet)                                                                                                | `node --test test/integration`, against Build's output | (none yet)                            |
| `e2e-test`           | jest + Selenium against the **built** app served by pre-e2e-test                                          | n/a                                                    | n/a                                   |
| `jacoco:report`      | `ng test --coverage` (73% statements)                                                                     | `node --test --experimental-test-coverage`             | n/a                                   |
| `verify`             | dist/application/browser/index.html exists                                                                | dist/build-info.json well-formed                       | both CSS artifacts exist              |
| `package`            | **tar.gz of the built browser output** (design.md's deployable)                                           | `npm pack`                                             | `npm pack`                            |
| `install`            | skipped (private — nothing to install)                                                                    | packed tarball loaded like a consumer would            | packed tarball resolves               |
| `deploy` (registry)  | skipped (private)                                                                                         | `npm run publish`, dry-run by default                  | same                                  |
| `cargo:deploy` (env) | `DEPLOY_TARGET=<env> npm run deploy` descriptor                                                           | same                                                   | same                                  |
| `site`/`javadoc`     | lint/coverage/security/dependency reports                                                                 | + JSDoc API docs                                       | reports only                          |

Shared for all: `format`/`format:check` (prettier), `lint` (ESLint), `security` (`npm audit --audit-level=high`),
`sbom`, `sign`, aggregated root `site`.

## Framework independence — now enforced, not just documented

`AGENTS.md:12` and `README.md:33-34` require `angular-start-project-library` to stay Angular-free. That was true but
unchecked. Two phases now enforce it mechanically:

- **Validate** fails the build if any file under the library's `src/` imports `@angular/*` or `rxjs`.
- **Compile** loads the whole library in a plain Node process with only a minimal DOM (jsdom) present — no framework,
  no bundler — and asserts it exports an object. That is what "usable without a frontend framework" means in practice,
  and it now has to keep being true for the build to pass.

Observed while wiring this up, worth knowing: the library **cannot be `require`d in a bare Node process** — several
services touch `localStorage`/`sessionStorage` at module scope, and without any DOM the load fails (one legacy
transitive dependency even referenced a global `angular`). So the library is _framework-free_ but _browser-targeted_.
That is a real portability property, not a bug in the migration; making the services lazy/injectable would be a
separate, deliberate change (and would let them run under Node, in SSR, or in a worker).

## What changed structurally

1. **Root `tools/`** with the lifecycle scripts (ported from the siblings, adapted per module type) and `profiles/`
   with the ADR-0041 canonical six.
2. **Workspace discovery now reads the root `package.json` `workspaces` field**, not "every directory under
   packages/". This repo is why that matters: `packages/angular-original` and `packages/application.old` are
   git-tracked legacy directories that are deliberately not workspaces — and `application.old` reuses the real
   application's package name, so a directory scan silently shadowed the app being built. Neither legacy directory is
   touched by any phase now.
3. **Every package exposes the same 24 phase scripts**; the placeholder `"test": "echo \"Error: no test specified\" &&
exit 1"` scripts are gone (the README warned not to run `npm test --workspaces` because of them — that warning is
   now obsolete).
4. **`generate-sources` is a real, named phase.** The version stamp used to run as an npm `prebuild` hook, invisible
   in the phase list. It is the first genuine `generate-sources` implementation across all five repos.
5. **A lint phase exists at all** — there was none. ESLint for JS/TS across tools, the library and the app.
6. **`Jenkinsfile` added** (there was no CI file of any kind): version 1.1.0 from `jenkinsfile-starter` 1.1.0, same
   stages and branch gating (`master`/`devel*`/`release*`/`hotfix*`) as the four siblings.
7. **Library tests added** (unit + integration) — the docs recorded "library-side unit tests are still a gap".
8. **Maven failsafe semantics** ported from the `setmy-info-less` sibling: integration/e2e failures are recorded and
   re-raised by the paired `post-*-test` step, so cleanup always runs and no test server is ever leaked.

## Defects found and fixed while migrating

1. `application.old` shadowing the real application in any packages/*-scanning tool (see 2 above).
2. `less-plugin-clean-css` was missing, so no minified CSS could be produced for the style packages.
3. ESLint (newly introduced) found two undefined references in the ported `install-local.js` — caught before use.
4. The generated `version.ts` failed the new format gate; generated output is now excluded from it.
5. `@vitest/coverage-v8` was missing, so `ng test --coverage` could not run at all.

## Verified by running

Full sequence, repository root, **EXIT 0**:
`clean → validate → format:check → lint → generate-sources → resources --profile ci → build --profile ci → test →
pre-integration-test → integration-test → post-integration-test → coverage → verify → package → sbom → sign →
install-local → publish (dry-run) → deploy → site`.

4/4 packages validated, verified, install-local'd (app correctly skipped as private), publish-resolved and deployed;
5 site pages (4 packages + aggregated root). Angular unit tests: **81 passed**. Coverage: 73% statements. The app's
deployable is `.artifacts/angular-start-project/angular-start-project-1.0.0-SNAPSHOT.tar.gz`.

## Post-migration fixes (same day)

- **`npm test` sat in watch mode.** The Angular CLI defaults `--watch` to true in a TTY, so a plain `npm test` in a
  terminal dropped into Vitest's interactive watcher instead of running once. A lifecycle phase must behave the same
  for a human, a script and Jenkins — `mvn test` runs and returns. The `test` and `coverage` phases now pass
  `--watch=false` explicitly; `npm run test:watch` is there for the interactive watcher. Verified under a real pty:
  81 passed, 3.1s, exit 0.
- **Two e2e failures, one of them caused by this migration.**
    - _Mine:_ `sideNavigation.e2e.js` asserted the literal environment `'local'`. That only ever passed because e2e used
      to run against `ng serve` (default configuration `local`); the tier now runs against the **built** app, which is
      built with `--profile ci` in CI per ADR-0041 §4.4. Fixed properly rather than by pinning a profile: **Build now
      records the profile it used in `dist/build-info.json`** (the Maven-MANIFEST equivalent) and the e2e tier reads it
      back and passes it to the suite. No `BUILD_PROFILE` has to be exported by hand, and the assertion always follows
      the artifact actually being served. `verify` now also requires that marker.
    - _Pre-existing:_ `languageChange.e2e.js` asserted `li.sideNavMenuItems:nth-child(4)` contains `SEADED`. The side
      navigation renders 3 menu items plus a language row, so Settings is the **third** item and the fourth li is the
      language row — exactly what the passing `sideNavigation.e2e.js:63-66` already asserted
      (`countOf === 4`, `nth-child(3) = SEADED`). A stale assertion contradicting its own sibling test, unrelated to the
      build migration. Corrected to `nth-child(3)`.
    - After both: **40/40 e2e tests pass, 6/6 suites**, with the failsafe chain proven — a failing `e2e-test` exits 0
      with the failure recorded, servers are stopped, and `post-e2e-test` exits 1 to fail the build.
- One flaky test observed: `hoverAndSelection.e2e.js` hover-state assertions failed once in three runs with a 10s
  timeout, and passed otherwise. Real-browser hover timing; worth hardening the wait, not a break.

- **The migration documented the build but not the dev loop, and it had squatted on `ng serve`'s port.** The new
  Lifecycle section described 24 phases and never said how to just run the app. Two fixes: the app's lifecycle static
  server moved off **4200** (now 4210 manual / 4211 for the e2e tier), so `npm start` and `npm run server` can run at
  the same time instead of fighting for the port; and README gained a "Running the application locally (development)"
  section _before_ the lifecycle, covering `npm start` (ng serve, 4200, `local` environment, live reload),
  `npm run test:watch`, `npm run watch`, and a table making the `npm start` vs `npm run server` distinction explicit
  (dev server compiled in memory vs the built `dist/` output). Verified by running both simultaneously: 4200 → HTTP
  200, 4210 → HTTP 200, and the SPA fallback route `/settings` on 4210 → HTTP 200.

## Open / not done

1. **`npm run security` fails: 5 high advisories remain**, all in Angular framework packages (`@angular/common`,
   `forms`, `platform-browser`, `router`, plus transitive `undici`). `npm audit fix` took the repo from 18 high to 5;
   the rest need a version beyond the vulnerable range `21.0.0-next.0 - 21.2.18`, i.e. a deliberate Angular patch
   upgrade. **That is a maintainer decision, so dependencies were left exactly as they were** (an attempted
   `npm update` made it worse and was reverted). The gate stays at `--audit-level=high`, matching the siblings.
2. **E2E was not run.** It needs Java + an external Selenium Grid, and now runs against the built app served by
   `pre-e2e-test` rather than `ng serve`. The wiring is in place and unverified.
3. **No integration tier for the Angular app** and no unit/integration tiers for the LESS packages.
4. **No docs generator** for the Angular app (typedoc/compodoc) or the LESS packages (KSS, as in `setmy-info-less`);
   `docs` reports the gap rather than pretending.
5. **Angular template linting** (`angular-eslint`) is not wired — only JS/TS rules.
6. **18 unused `catch (e)` bindings** in the library are tolerated by config, not fixed; the modern fix is optional
   catch binding, applied deliberately as its own change.
7. `packages/angular-original` and `packages/application.old` remain untouched — `review.md` recommends deleting
   `application.old`, but that is user-owned history, not a build decision.
