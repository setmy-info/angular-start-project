# Multi module (monorepo) angular application

```shell
npm install
npm install --workspace angular-start-project-style
npm install --workspace angular-start-project-library
npm start -w angular-start-project
```

tab http://localhost:4200/

See [DEVELOPERS-GUIDE.md](DEVELOPERS-GUIDE.md) for day-to-day monorepo workflow: building, testing,
and updating/upgrading the `setmy-info-less` packages. See [review.md](review.md) for the current
plan and findings.

## Unit tests

### angular-start-project (Angular app)

Unit tests use the Angular `@angular/build:unit-test` builder with [Vitest](https://vitest.dev/).

Spec files live next to the source files they test (`*.spec.ts`).

```shell
npm test -w angular-start-project
```

Example service: `packages/angular-start-project/src/services/foo-bar.service.ts`
Example spec: `packages/angular-start-project/src/services/foo-bar.service.spec.ts`

### angular-start-project-library (plain JS library)

Unit tests use [Vitest](https://vitest.dev/) directly (no Angular).

Test files live next to the source files they test (`*.test.mjs`).

```shell
npm test -w angular-start-project-library
```

Example service: `packages/angular-start-project-library/src/services/fooBarService.js`
Example test: `packages/angular-start-project-library/src/services/fooBarService.test.mjs`

## E2E / Integration tests

E2E tests use [WebdriverIO](https://webdriver.io/) with the Jasmine framework and Firefox.

Spec files live in `packages/angular-start-project/test/specs/` and follow the `*.e2e.ts` naming convention.

**Prerequisites:** a running Selenium/GeckoDriver server on `localhost:4444` and the app running on `localhost:4200`.

```shell
# Terminal 1 – start the app
npm start -w angular-start-project

# Terminal 2 – start GeckoDriver (or Selenium Grid)
geckodriver --port 4444

# Terminal 3 – run E2E tests
npm run e2e -w angular-start-project
```

Example E2E spec: `packages/angular-start-project/test/specs/foo-bar.e2e.ts`

## TypeScript config note

Set as:

    //"strict": true,
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
