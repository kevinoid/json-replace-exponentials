/**
 * JSON.stringify() which does not produce numbers in exponential notation.
 *
 * Avoid numbers in exponential notation due to
 * https://github.com/Azure/autorest/issues/3006
 *
 * @copyright Copyright 2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('assert');
const jsonStringifyRaw = require('json-stringify-raw');

function getFixed(value) {
  if (value === 0
    || (value > 1e-7 && value < 1e21)
    || (value < -1e-7 && value > -1e21)) {
    // Built-in string conversion is fixed-point
    return `${value}`;
  }

  if (value < 0) {
    return `-${getFixed(-value)}`;
  }

  // Convert exponentials from built-in string conversion to fixed-point.
  //
  // Note: Could use Number.prototype.toFixed(100) then trim excess except:
  // - It returns exponential format for x >= 1e21,
  // - It is likely to have excess precision.
  // See https://tc39.es/ecma262/#sec-number.prototype.tofixed and Note 2
  const s = `${value}`;
  const ei = s.indexOf('e');
  assert(ei > 0);

  const exponent = Number(s.slice(ei + 1));
  assert(Number.isFinite(exponent));
  assert(exponent !== 0);

  // These are easier to express without templates
  /* eslint-disable prefer-template */

  if (exponent > 0) {
    if (s[1] === '.') {
      // Move decimal exponent digits to the right, adding 0s as necessary

      const decimalDigits = ei - 2;
      if (decimalDigits < exponent) {
        return s[0]
          + s.slice(2, ei)
          + '0'.repeat(exponent - decimalDigits);
      }

      if (decimalDigits > exponent) {
        return s[0]
          + s.slice(2, 2 + exponent)
          + '.'
          + s.slice(2 + exponent, ei);
      }

      return s[0] + s.slice(2, ei);
    }

    return s.slice(0, ei)
      + '0'.repeat(exponent);
  }

  if (s[1] === '.') {
    // Move decimal |exponent| digits to the left, adding 0s as necessary
    if (exponent === -1) {
      return '0.' + s[0] + s.slice(2, ei);
    }

    return '0.'
      + '0'.repeat(-exponent - 1)
      + s[0]
      + s.slice(2, ei);
  }

  return '0.'
    + '0'.repeat(-exponent - 1)
    + s.slice(0, ei);

  /* eslint-enable prefer-template */
}

function rawReplacer(key, value) {
  if (Number.isFinite(value)) {
    // Ensure finite numbers are represented using fixed-point.
    // https://github.com/Azure/autorest/issues/3006
    return getFixed(value);
  }

  // Leave everything else as-is.
  return undefined;
}

module.exports =
function toJsonNoExponential(openapi, replacer, space) {
  if (replacer) {
    throw new Error('replacer is not supported');
  }

  return jsonStringifyRaw(openapi, rawReplacer, space);
};
