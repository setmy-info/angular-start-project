import fs from 'node:fs';

// Counts CSS rule blocks, ignoring comments so a commented-out brace never
// counts. Used by `npm run verify`.
export function countRules(css) {
    return (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\{/g) ?? []).length;
}

export function readRuleCount(cssPath) {
    return countRules(fs.readFileSync(cssPath, 'utf8'));
}

// "content" - the package must emit at least one rule.
// "skeleton" - the package is wired into the load order on purpose but emits
// nothing yet; zero rules is correct, not a failure.
export function resolveExpectation(packageJson) {
    return packageJson.config?.cssExpectation === 'skeleton' ? 'skeleton' : 'content';
}
