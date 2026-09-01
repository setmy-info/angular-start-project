import test from 'node:test';
import assert from 'node:assert/strict';

import { countRules, resolveExpectation } from '../../css-utils.js';

test('countRules counts rule blocks', () => {
    assert.equal(countRules('a{color:red}b{color:blue}'), 2);
});

test('countRules ignores braces inside comments', () => {
    assert.equal(countRules('/* a{ } */ b{color:red}'), 1);
});

test('countRules returns 0 for a stylesheet with no rules', () => {
    assert.equal(countRules('/* nothing yet */'), 0);
});

test('resolveExpectation defaults to content', () => {
    assert.equal(resolveExpectation({}), 'content');
});

test('resolveExpectation honours a declared skeleton', () => {
    assert.equal(resolveExpectation({ config: { cssExpectation: 'skeleton' } }), 'skeleton');
});
