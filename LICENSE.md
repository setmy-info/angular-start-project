# License — READ THIS FIRST: this repository is NOT uniformly MIT

This repository contains code under TWO different licenses, side by side:

## 1. MIT (template parts)

The generic Angular-start-template parts — scaffolding, application shell/layout, build setup,
placeholder Lorem-Ipsum content, and the style packages (`angular-start-project-style`,
`angular-start-project-brand-style`) — are MIT licensed.

Copyright (c) Imre Tabur.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 2. Proprietary — SMI / Hear And See Systems (HASS) authors (migrated product parts)

Functionality migrated from the old setmy.info web application (a real product, not template
scaffolding) is proprietary. All rights reserved by the SMI/HASS author(s). It is NOT covered by
the MIT license above.

**The proprietary license text is pending (not yet written). Until it is published, external
developers need a separate license/permission from the SMI/HASS authors to use, copy, or modify
these parts.**

Confirmed proprietary (each source file carries a `LICENSE NOTICE — NOT MIT` header):

- `packages/angular-start-project-library/src/services/objToDomService.js`
  (JSON-document → HTML renderer)
- `packages/angular-start-project-library/src/services/domToJsonService.js`
  (HTML/DOM → JSON-document parser)
- `packages/angular-start-project-library/src/services/jsonDocumentService.js`
  (JSON-document loader/facade)
- `packages/angular-start-project/public/json/documents/*.json`
  (sample content in that proprietary document format)

Also not MIT-licensed template content: the SMI branding assets
(`packages/angular-start-project/public/favicon.ico`, `public/icons/`) and the terms-of-use /
privacy-policy texts (`views/terms`, `views/privacy`).

The full inventory — including further migrated files suggested as proprietary and awaiting the
authors' per-file decision — is maintained in
`packages/angular-start-project-library/LICENSE-NOTES.md`.

The legacy `jsdi` npm dependencies (`js-api-extend`, `servicejs`, `servedjs`, `servedjs-geo`) are
separately published packages with their own licenses, not covered by this repository.
