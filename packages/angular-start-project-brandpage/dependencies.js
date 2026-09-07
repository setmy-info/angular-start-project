/*
 * What this brand page copies in, and what it minifies.
 *
 * There is no bundler and no build output: src/ IS the served folder, and everything in it is
 * committed. `npm run build` only fills in the two kinds of file that are not hand-written —
 * third-party assets copied out of node_modules, and the minified twin of each hand-written
 * source — and writes them straight back into src/ so they can be committed too.
 *
 * `copy` — from is resolved against the repo's node_modules, to against src/. The SMI modules
 * publish an already-minified dist/main.min.css, so nothing needs minifying on the way in; the
 * order here is the order the stylesheets must be linked in the HTML.
 *
 * `minify` — this page's own sources, minified in place next to the original. The HTML links
 * the .min twin; the readable original stays beside it, committed, so the page can always be
 * read and edited without a source map. There are two brand page examples in this package and
 * each has its own CSS and JS, so each gets its own pair here.
 */
export default {
    copy: [
        { from: 'setmy-info-less/dist/main.min.css', to: 'css/setmy-info-less.min.css' },
        {
            from: 'setmy-info-less-extended/dist/main.min.css',
            to: 'css/setmy-info-less-extended.min.css',
        },
        {
            from: 'setmy-info-less-fancy/dist/main.min.css',
            to: 'css/setmy-info-less-fancy.min.css',
        },
        {
            from: 'setmy-info-less-brandpage/dist/main.min.css',
            to: 'css/setmy-info-less-brandpage.min.css',
        },
        // Vue's global production build is already minified upstream.
        { from: 'vue/dist/vue.global.prod.js', to: 'js/vue.global.prod.js' },
    ],
    minify: [
        // First example (index/about/contact.html), on the SMI brand page design system.
        { from: 'css/brand.css', to: 'css/brand.min.css' },
        { from: 'js/main.js', to: 'js/main.min.js' },
        // Second example (previous-*.html), on the setmy-info-less base only.
        { from: 'css/previous-brand.css', to: 'css/previous-brand.min.css' },
        { from: 'js/previous-main.js', to: 'js/previous-main.min.js' },
    ],
};
