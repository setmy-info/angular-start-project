# License notes — mixed licensing in this package

Repository-level statement: see `LICENSE.md` at the repo root (this file is the detailed per-file
inventory it points to).

This package is NOT uniformly MIT. It contains two kinds of code side by side:

1. **MIT-licensed template code** — the generic Angular-start-template parts, written for this
   template project.
2. **Proprietary SMI / Hear And See Systems (HASS) code** — functionality migrated from the old
   setmy.info web application (`has-web-app-new`), which is a real product, not template
   scaffolding. All rights reserved by the SMI/HASS authors.

The proprietary license TEXT is pending (not yet written). Until it is published, external
developers need a separate license/permission from the SMI/HASS authors to use, copy, or modify
the proprietary files. The package.json `license` field says `SEE LICENSE IN LICENSE-NOTES.md`
for this reason.

## Proprietary candidates (migrated from the old solution — pending author confirmation)

These were ported from the old setmy.info solution's `library` package rather than written
fresh for the template. They are currently NOT marked with license headers; the SMI/HASS authors
should decide per file whether it stays MIT (generic utility) or gets the proprietary notice
(product code):

| File                                                                        | Origin in the old solution                                                     | Note                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `src/services/statisticsService.js` + `src/resources/statisticsResource.js` | `library/src/services/statisticsService.js`, `resources/statisticsResource.js` | product telemetry design                                                         |
| `src/services/sessionService.js`                                            | `library/src/services/sessionService.js`                                       | session/statistics pattern; `uuidService.js` itself is a trivial generic wrapper |
| `src/services/contentService.js`                                            | equivalent of `library/src/services/pagesService.js`                           | new implementation, old design                                                   |
| `src/services/consentService.js`                                            | `library/src/services/consentService.js`                                       | new implementation, old shape                                                    |
| `src/services/dbService.js`                                                 | `library/src/services/dbService.js`                                            | promise rework of the old skeleton                                               |
| `src/services/loadingService.js`                                            | `library/src/services/loadingService.js`                                       | promise rework                                                                   |
| `src/resources/resourceFactory.js`                                          | `library/src/resources/resourceFactory.js`                                     | fetch rework of the old axios factory                                            |
| `src/config/index.js`, `src/constants/index.js`                             | `library/src/config`, `library/src/constants`                                  | structure/values from the old product                                            |

Related but outside this package:

- The legacy `jsdi` npm packages (`js-api-extend`, `servicejs`, `servedjs`, `servedjs-geo`) are
  separate published packages with their own licenses — check each package's own LICENSE, they
  are not covered by this repository at all.
- The terms-of-use and privacy-policy texts in the app package (`views/terms`, `views/privacy`)
  and the SMI favicon/brand icons (`public/favicon.ico`, `public/icons/`) are content/branding of
  the SMI/HASS authors, not MIT-licensed template content.

## TODO

- Write and publish the actual SMI/HASS proprietary license text and link it here.
- Author decision on the candidates table above; add LICENSE NOTICE headers to the
  files that are confirmed proprietary.
