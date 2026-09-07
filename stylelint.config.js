// Stylelint-config-standard, plus the few selectors this CSS API uses
// that the standard kebab-only patterns reject. Same idea as setmy-info-less:
// prettier then stylelint --fix must produce a tree that already satisfies
// the remaining standard rules.
export const classAndIdPattern = '^[a-zA-Z][a-zA-Z0-9_-]*$';

export default {
    customSyntax: 'postcss-less',
    extends: ['stylelint-config-standard'],
    rules: {
        // The app's component LESS files are intentionally empty apart from their imports —
        // the rules live in setmy-info-less-angular-start-project — and that must not be an error.
        'no-empty-source': null,
        // Old-school CSS on purpose: `(min-width: …)`, not the range syntax.
        'media-feature-range-notation': 'prefix',
        'selector-class-pattern': classAndIdPattern,
        'selector-id-pattern': classAndIdPattern,
        'selector-type-no-unknown': [
            true,
            {
                ignoreTypes: ['app'],
            },
        ],
    },
    overrides: [
        {
            // Two rules that only know plain CSS: LESS import options (`@import (inline) …`) and
            // LESS variables inside composite values (`1px solid @tertiaryColor`) are valid LESS.
            files: ['**/*.less'],
            rules: {
                'at-rule-prelude-no-invalid': null,
                'declaration-property-value-no-unknown': null,
            },
        },
    ],
    ignoreFiles: [
        '**/node_modules/**',
        '**/dist/**',
        // Copied third-party CSS (scripts/dependencies.js) and minified output
        // (scripts/minify.js) — machine-written into the source tree, so the upstream
        // project's lint gate applies to them, not this one's.
        '**/src/css/setmy-info-less*.css',
        '**/*.min.css',
        'packages/angular-original/**',
        'packages/application.old/**',
        'packages/application/**',
    ],
};
