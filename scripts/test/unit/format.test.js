import test from 'node:test';
import assert from 'node:assert/strict';

import { FORMATTERS } from '../../format.js';

test('FORMATTERS runs prettier on LESS, then stylelint, then prettier on the rest', () => {
    assert.deepEqual(
        FORMATTERS.map((spec) => spec.name),
        ['less', 'stylelint', 'prettier'],
    );
});

test('each formatter has write and check commands', () => {
    for (const spec of FORMATTERS) {
        assert.ok(Array.isArray(spec.write) && spec.write.length > 0);
        assert.ok(Array.isArray(spec.check) && spec.check.length > 0);
        assert.equal(spec.write[0], spec.check[0]);
    }
});

test('stylelint write is the check command plus --fix', () => {
    const stylelint = FORMATTERS.find((spec) => spec.name === 'stylelint');
    assert.ok(stylelint);
    assert.deepEqual(stylelint.write, [...stylelint.check, '--fix']);
});
