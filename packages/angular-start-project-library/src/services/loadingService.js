// Dynamic script/CSS loader — promise-based rework of the old library's loadingService.js
// (which used callback-style onload/onreadystatechange and appended to #scripts/#head anchor
// elements; here everything goes to document.head and IE support is dropped). Provided for later
// usage: nothing in the template calls it yet (tsParticles uses its own dynamic import()).
// Repeated calls for the same URL return the same promise — each resource loads once.
const loaded = {};

const loadingService = {
    loadJS: function (url) {
        if (loaded[url]) {
            return loaded[url];
        }
        loaded[url] = new Promise(function (resolve, reject) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onload = function () {
                resolve(url);
            };
            script.onerror = function () {
                delete loaded[url];
                reject(new Error('Failed to load script: ' + url));
            };
            document.head.appendChild(script);
        });
        return loaded[url];
    },

    loadCSS: function (url) {
        if (loaded[url]) {
            return loaded[url];
        }
        loaded[url] = new Promise(function (resolve, reject) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.type = 'text/css';
            css.href = url;
            css.onload = function () {
                resolve(url);
            };
            css.onerror = function () {
                delete loaded[url];
                reject(new Error('Failed to load stylesheet: ' + url));
            };
            document.head.appendChild(css);
        });
        return loaded[url];
    }
};

module.exports = loadingService;
