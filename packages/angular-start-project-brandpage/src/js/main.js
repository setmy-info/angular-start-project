/*
 * Brand page behaviour.
 *
 * Vue the old-school way: the global production build (delivered into js/vendor/, committed) is
 * loaded by a <script> tag before this file, so `Vue` is a global and there is no bundler and no
 * module graph. The SMI brand page module documents this exact set of interactions — the module's
 * own test pages implement them in plain JS; here they are the Vue app the module expects:
 *
 *   .pl        opens the privacy overlay   (#prv gets .open)
 *   .pvx       closes it again
 *   .ga        accepts consent             (#gb goes away)
 *   .lb        selects a language          (.on moves to the clicked button)
 *   .dot       selects a panel             (.on moves to the clicked dot)
 *
 * Everything below the wiring is placeholder campaign content to be replaced.
 */
/* global Vue */
(function () {
    'use strict';

    var element = document.getElementById('brandApp');

    if (!element || typeof Vue === 'undefined') {
        return;
    }

    // Read back on load so an accepted consent bar does not reappear on the next page.
    function storedConsent() {
        try {
            return window.localStorage.getItem('brandConsent') === 'accepted';
        } catch (error) {
            return false;
        }
    }

    Vue.createApp({
        data: function () {
            return {
                year: new Date().getFullYear(),
                language: 'en',
                previewOpen: false,
                consentAccepted: storedConsent(),
                currentPanel: 'p1',
                // What the campaign's call to action points at — the application this brand page
                // is promoting. Substituted from config.brand.promotes at build time.
                promotes: 'https://angular-start-project.setmy.info',
                panels: [
                    { id: 'p1', label: 'Panel 1' },
                    { id: 'p2', label: 'Panel 2' },
                    { id: 'p3', label: 'Panel 3' },
                ],
                slogans: [
                    {
                        number: '01',
                        title: 'Lorem ipsum dolor',
                        text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
                    },
                    {
                        number: '02',
                        title: 'Consectetur adipiscing',
                        text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat.',
                    },
                    {
                        number: '03',
                        title: 'Tempor incididunt',
                        text: 'Cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum sed ut perspiciatis unde omnis iste.',
                    },
                ],
                // Share targets. Each is a URL template; share() fills in this page's own
                // canonical and title, so the links stay correct on every page and on a copy of
                // this brand page with a different host.
                shareNetworks: [
                    { name: 'X', url: 'https://twitter.com/intent/tweet?url={url}&text={title}' },
                    { name: 'Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
                    {
                        name: 'LinkedIn',
                        url: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
                    },
                ],
            };
        },
        methods: {
            share: function (network) {
                var canonical = document.querySelector('link[rel="canonical"]');
                var url = canonical ? canonical.getAttribute('href') : window.location.href;

                return network.url
                    .replace('{url}', encodeURIComponent(url))
                    .replace('{title}', encodeURIComponent(document.title));
            },
            showPanel: function (id) {
                this.currentPanel = id;

                var panel = document.getElementById(id);

                if (panel && panel.scrollIntoView) {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            },
            acceptConsent: function () {
                this.consentAccepted = true;

                try {
                    window.localStorage.setItem('brandConsent', 'accepted');
                } catch (error) {
                    // Private mode or blocked storage — the bar simply returns next visit.
                }
            },
        },
    }).mount(element);
})();
