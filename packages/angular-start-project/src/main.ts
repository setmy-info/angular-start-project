// Bootstraps the legacy setmy.info jsdi service layer (README.md "Legacy jsdi service layer")
// by loading it here, as ordinary side-effect imports of real npm packages, so Angular's own
// build pipeline bundles them normally. Each attaches its services to the global `jsdi`
// registry; angular-start-project-library's `jsdi` accessor (see legacyServiceLayer.js) just
// reads that registry lazily, so import order here only needs to precede first use, not
// necessarily precede the angular-start-project-library import below.
import 'js-api-extend';
import 'servicejs';
import 'servedjs';
import 'servedjs-geo';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
