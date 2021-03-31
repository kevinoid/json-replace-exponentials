/**
 * @copyright Copyright 2021 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('assert');

const jsonReplaceExponentials = require('..');

function neverCalled() {
  assert.fail('Should not be called');
}

describe('jsonReplaceExponentials', () => {
  for (const [exp, fixed] of [
    ['0e0', '0'],
    ['0e+0', '0'],
    ['0e-0', '0'],
    ['0.01e2', '1'],
    ['0.1e2', '10'],
    ['0.1e1', '1'],
    ['0.1e0', '0.1'],
    ['0.1e-0', '0.1'],
    ['0.1e-1', '0.01'],
    ['1e0', '1'],
    ['1e-0', '1'],
    ['1e1', '10'],
    ['1e+1', '10'],
    ['1e-1', '0.1'],
    ['1.0e0', '1.0'],
    ['1.0e-0', '1.0'],
    ['1.0e1', '10'],
    ['1.0e+1', '10'],
    ['1.0e-1', '0.10'],
    ['10e0', '10'],
    ['10e1', '100'],
    ['10e-1', '1.0'],
    ['10e-2', '0.10'],
    ['10.2e2', '1020'],
    ['10.2e1', '102'],
    ['10.2e0', '10.2'],
    ['10.2e-0', '10.2'],
    ['10.2e-1', '1.02'],
    ['10.2e-2', '0.102'],
    ['10.2e-3', '0.0102'],
    ['1.2e2', '120'],
    ['1.2e1', '12'],
    ['1.2e0', '1.2'],
    ['1.2e-0', '1.2'],
    ['1.2e-1', '0.12'],
    ['1.2e-2', '0.012'],
    ['1e010', '10000000000'],
    ['1e+010', '10000000000'],
    ['1e-010', '0.0000000001'],
    ['0.1234567890123456789e1', '1.234567890123456789'],
    ['0.1234567890123456789e0', '0.1234567890123456789'],
    ['0.1234567890123456789e-1', '0.01234567890123456789'],
  ]) {
    it(`converts ${exp} to ${fixed}`, () => {
      assert.strictEqual(
        jsonReplaceExponentials(exp),
        fixed,
      );
    });

    it(`converts -${exp} to -${fixed}`, () => {
      assert.strictEqual(
        jsonReplaceExponentials(`-${exp}`),
        `-${fixed}`,
      );
    });
  }

  for (const unmodifiedJson of [
    '1',
    '1.2',
    '"1e2"',
    '["1e2"]',
    '{"1e2":"1e2"}',
    '"\\"1e2,"',
    '"\\\\\\"1e2,"',
  ]) {
    it(`does not modify or call replacer for ${unmodifiedJson}`, () => {
      assert.strictEqual(
        jsonReplaceExponentials(unmodifiedJson, neverCalled),
        unmodifiedJson,
      );
    });
  }

  for (const [exp, fixed] of [
    ['[1e1,1e-1,1e2]', '[10,0.1,100]'],
    ['[ 1e1 ,1e-1 ,\n1e2\n]', '[ 10 ,0.1 ,\n100\n]'],
    ['{"a":1e2}', '{"a":100}'],
    ['{"a"\n: 1e2\n}', '{"a"\n: 100\n}'],
    ['[1e1,"1e0",1e-1,1e2]', '[10,"1e0",0.1,100]'],
    [
      '[1e1,"1e1\\\\1e1",1e-1,"\\"1e1\\\\\\"1e1",1e2]',
      '[10,"1e1\\\\1e1",0.1,"\\"1e1\\\\\\"1e1",100]',
    ],
    ['["1e1",1e1]', '["1e1",10]'],
    ['{"1e1":1e1}', '{"1e1":10}'],
  ]) {
    it(`converts ${exp} to ${fixed}`, () => {
      // Ensure the test values are valid JSON
      JSON.parse(exp);
      JSON.parse(fixed);

      assert.strictEqual(
        jsonReplaceExponentials(exp),
        fixed,
      );
    });
  }

  it('calls replacer with number to replace', () => {
    let callCount = 0;
    function testReplacer(...args) {
      assert.strictEqual(this, undefined);
      assert.deepStrictEqual(args, ['1e2']);
      callCount += 1;
      return callCount;
    }
    assert.strictEqual(
      jsonReplaceExponentials('[1e2,1e2]', testReplacer),
      '[1,2]',
    );
  });

  it('throws TypeError for no args', () => {
    assert.throws(
      () => jsonReplaceExponentials(),
      TypeError,
    );
  });

  it('throws TypeError for non-string first arg', () => {
    assert.throws(
      () => jsonReplaceExponentials(Buffer.alloc(0)),
      TypeError,
    );
  });

  it('throws TypeError for non-function second arg', () => {
    assert.throws(
      () => jsonReplaceExponentials('', {}),
      TypeError,
    );
  });

  it('throws RangeError for exponent too large without replacer', () => {
    assert.throws(
      () => jsonReplaceExponentials('1e1000000'),
      RangeError,
    );
  });

  it('does not throw for large exponent with replacer', () => {
    const bigExp = '1e1000000';
    const bigReplacement = 'Infinity';
    function testReplacer(num) {
      assert.strictEqual(num, bigExp);
      return bigReplacement;
    }

    assert.strictEqual(
      jsonReplaceExponentials(bigExp, testReplacer),
      bigReplacement,
    );
  });

  it('throws RangeError for exponent too negative without replacer', () => {
    assert.throws(
      () => jsonReplaceExponentials('1e-1000000'),
      RangeError,
    );
  });

  it('does not throw for large negative exponent with replacer', () => {
    const bigExp = '1e-1000000';
    const bigReplacement = '0';
    function testReplacer(num) {
      assert.strictEqual(num, bigExp);
      return bigReplacement;
    }

    assert.strictEqual(
      jsonReplaceExponentials(bigExp, testReplacer),
      bigReplacement,
    );
  });
});
