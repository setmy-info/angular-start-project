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

import angularStartProjectLibrary from 'angular-start-project-library';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Chromium fires `beforeinstallprompt` once and early — often before Angular has finished
// bootstrapping. The event is the ONLY handle on the browser's install dialog and cannot be
// re-requested, so it is captured here, at the earliest point the app owns, rather than from
// PwaInstallService's constructor. listen() is idempotent; the service calls it again harmlessly.
angularStartProjectLibrary.pwaInstallService.listen();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
