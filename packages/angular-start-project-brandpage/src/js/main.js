/*
 * Brand page behaviour.
 *
 * Vue the old-school way: the global production build is loaded by a <script> tag before this
 * file, so `Vue` is a global and there is no bundler, no module graph and no build step for the
 * JavaScript. Everything below is placeholder content to be replaced.
 */
/* global Vue */
(function () {
    'use strict';

    var element = document.getElementById('brandApp');

    if (!element || typeof Vue === 'undefined') {
        return;
    }

    Vue.createApp({
        data: function () {
            return {
                year: new Date().getFullYear(),
                // Placeholder cards — replace with the real offering.
                cards: [
                    {
                        title: 'Lorem ipsum',
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
                    },
                    {
                        title: 'Dolor sit amet',
                        text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
                    },
                    {
                        title: 'Consectetur',
                        text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.',
                    },
                ],
            };
        },
    }).mount(element);
})();
