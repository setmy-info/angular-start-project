import globals from 'globals';
import tseslint from 'typescript-eslint';

// Lint phase (Maven `checkstyle:check`). There was no lint at all in this
// repo before the lifecycle migration - this is the minimum honest gate:
// correctness rules for JS and TypeScript, scoped by extension so the
// framework-free library and the Angular app share one invocation.
// Angular template linting (angular-eslint) is NOT wired yet - see report.md.
export default [
    {
        ignores: [
            '**/dist/**',
            '**/site/**',
            '**/.angular/**',
            'packages/angular-original/**',
            'packages/application.old/**',
            '**/*.min.js',
        ],
    },
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
        },
        rules: {
            // caughtErrors: "none" - ESLint 9 changed this default to "all",
            // which flags every `catch (e)` whose binding is unused. That is a
            // source-style decision, not a build-migration one, and this
            // codebase has 18 of them; the modern fix is optional catch
            // binding (`catch {`) applied deliberately, not forced by a lint
            // gate introduced on day one. Revisit as its own change.
            'no-unused-vars': ['error', { caughtErrors: 'none' }],
            'no-undef': 'error',
        },
    },
    {
        // Test tiers bring their own globals: jest for the Selenium e2e
        // suites, vitest for the Angular unit specs, node:test for the
        // framework-independent library's tests.
        files: ['**/test/**/*.js', '**/*.e2e.js', '**/*.spec.ts', '**/*.test.js'],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.node,
                ...globals.browser,
            },
        },
    },
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: ['**/*.ts'],
        languageOptions: {
            ...config.languageOptions,
            globals: { ...globals.browser },
        },
        rules: {
            ...config.rules,
            // The app's tsconfig deliberately runs non-strict (documented in
            // README); flagging every implicit any as an error would gate the
            // build on a decision that is not this phase's to make.
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    })),
];
