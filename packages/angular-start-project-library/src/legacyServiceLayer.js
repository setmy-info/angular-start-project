// The old setmy.info site's dependency-injection service layer ("jsdi") — see README.md
// "Legacy jsdi service layer". This file is only an ACCESSOR: it reads the global `jsdi`
// registry that js-api-extend/servicejs/servedjs/servedjs-geo attach themselves to
// (`window.jsdi` in a browser). It deliberately does NOT `require()` those packages itself —
// this file lives inside a workspace package that the Angular dev server excludes from
// dependency pre-bundling (angular.json serve.options.prebundle.exclude, for hot-reload), and a
// bare `require('servedjs-geo')` from inside such an excluded/raw-served file breaks esbuild's
// bundling of that real npm dependency (surfaces in the browser as
// "Uncaught Error: Dynamic require of ... is not supported"). The four packages are instead
// loaded once, as ordinary side-effect imports, from Angular app source
// (packages/angular-start-project/src/main.ts) which IS normally bundled — see that file.
//
// Exported as a getter (not a captured value) so it always reflects the current global state,
// regardless of when those side-effect imports actually ran relative to this module.
function getJsdi() {
    const globalScope = typeof window === 'undefined' ? global : window;
    return globalScope.jsdi;
}

module.exports = getJsdi;
