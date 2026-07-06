import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import angularStartProjectLibrary from 'angular-start-project-library';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { LocationService } from './services/location.service';
import { PageTitleService } from './services/page-title.service';
import { version } from './config/version';

// Example of calling the legacy jsdi DI service layer (README.md "Legacy jsdi service layer"):
// jsdi.get('<serviceName>') is the shortest way to reach any of its services. $log defaults to
// OFF (see servedjs), so raise the level before it will print anything.
function logAppOpenedTimeAndTimezone(): void {
  const log = angularStartProjectLibrary.jsdi.get('$log');
  log.setLevel(log.INFO);
  const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown';
  log.info('App opened at', new Date().toString(), '— timezone:', timeZone);
}

// The old solutions' startup line (`App started:  Object { version: "0.43.1" } , for: <uuid>`,
// see old main.ts): version is the build stamp regenerated from package.json by
// bin/versionModule.js (npm run ver — NOT a git hash), the uuid is the per-browser-session id
// (uuid v4 in sessionStorage; creating it also records the session-create + referrer statistics
// events, see the library's sessionService.js). versionService compares the stamp against the
// version stored from the previous visit, so the log (and the Settings page) can say whether
// this is a NEW version for this browser.
function logAppStarted(): void {
  const log = angularStartProjectLibrary.jsdi.get('$log');
  log.setLevel(log.INFO);
  const versionState = angularStartProjectLibrary.versionService.check(version.version);
  log.info('App started: ', version, ', for: ', angularStartProjectLibrary.sessionService.getSessionId());
  if (versionState.isNewVersion) {
    log.info('New app version: ', versionState.version, ' (previous: ', versionState.previousVersion ?? 'none — first visit', ')');
  }
}

// Try-it-out example of the legacy $geo service (servedjs-geo, via jsdi) — prints the device's
// location (and Google Maps / OpenStreetMap links for it, also shown on the Settings page) once
// at startup. Not required by anything else; delete this function and its one call below (in
// provideAppInitializer) to remove it entirely.
function logAppOpenedLocationOnce(): void {
  const log = angularStartProjectLibrary.jsdi.get('$log');
  const locationService = inject(LocationService);

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    const message = 'Geolocation not available in this browser.';
    log.warn(message);
    locationService.setError(message);
    return;
  }
  // Geolocation is refused by the browser on any origin that isn't https:// or localhost —
  // e.g. opening the app over a plain http://<lan-ip> address (see README.md "Progressive Web
  // App / offline support"). Check this upfront so the failure is visible instead of the
  // watcher's error callback silently never firing on some browsers.
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    const message = 'Geolocation requires HTTPS (or localhost) — this page was opened over an insecure origin.';
    log.warn(message);
    locationService.setError(message);
    return;
  }

  const geo = angularStartProjectLibrary.jsdi.get('$geo');
  const watcher = geo.newWatcher(
    (position: { latitude: number; longitude: number }) => {
      locationService.set(position);
      log.info('App opened at location:', position.latitude, position.longitude);
      log.info('Google Maps:', locationService.googleMapsUrl(position));
      log.info('OpenStreetMap:', locationService.openStreetMapUrl(position));
      watcher.stop();
    },
    (error: { message?: string }) => {
      const message = error?.message || 'unknown error';
      log.warn('Could not determine location:', message);
      locationService.setError(message);
    }
  );
  watcher.start();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(logAppStarted),
    provideAppInitializer(logAppOpenedTimeAndTimezone),
    provideAppInitializer(logAppOpenedLocationOnce), // comment out to disable the $geo example
    // Eagerly instantiate the page-title owner (document.title sync + page-visit statistics) —
    // nothing injects it lazily on the critical path, so it must be created at bootstrap.
    provideAppInitializer(() => void inject(PageTitleService)),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
