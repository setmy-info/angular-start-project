// Stylelint-config-standard, plus the few selectors this CSS API uses
// that the standard kebab-only patterns reject. Same idea as setmy-info-less:
// prettier then stylelint --fix must produce a tree that already satisfies
// the remaining standard rules.
export const classAndIdPattern = '^[a-zA-Z][a-zA-Z0-9_-]*$';

export default {
    customSyntax: 'postcss-less',
    extends: ['stylelint-config-standard'],
    rules: {
        'selector-class-pattern': classAndIdPattern,
        'selector-id-pattern': classAndIdPattern,
        'selector-type-no-unknown': [
            true,
            {
                ignoreTypes: ['app'],
            },
        ],
    },
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
