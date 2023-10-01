/**
 * @copyright Copyright 2016-2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 * @module json-replace-exponentials
 */

'use strict';

/** Pattern for a JSON number in exponential notation (i.e. with mandatory
 * exp production from https://tools.ietf.org/html/rfc7158#section-6 ).
 *
 * @private
 */
const numberExpPattern = '(-?)([0-9]+)(?:\\.([0-9]+))?[eE]([+-]?[0-9]+)';

/** Pattern for a JSON string
 * https://tools.ietf.org/html/rfc7158#section-7
 *
 * @private
 */
const stringPattern =
  '"(?:[^\\x00-\\x1F\\\\"]|\\\\(?:["\\\\/bfnrt]|u[0-9a-fA-F]{4}))*"';

/** RegExp for JSON number in exponential notation occurring after after any
 * number of quoted strings and non-quote characters (i.e. a JSON number in
 * exponential notation occurring outside of a string).
 *
 * @private
 */
const jsonWithNumberExpRE =
  new RegExp(`((?:${stringPattern}|[^"])*?)(${numberExpPattern})`, 'gy');

/** Converts the parts of a number in exponential notation to fixed-point
 * notation.
 *
 * @private
 * @param {string} signPart Sign part of number. (i.e. '-' or '')
 * @param {string} intPart Integer part of number. (i.e. part before decimal)
 * @param {string} fracPart Fractional part of number, if any. (i.e. part
 * after decimal).
 * @param {number} exponent Exponential of number. (i.e. part after "e")
 * @returns {string} Number in fixed-point notation.
 */
function exponentialPartsToFixed(signPart, intPart, fracPart, exponent) {
  // These are easier to express without templates
  /* eslint-disable prefer-template */

  if (exponent >= 0) {
    // Move decimal exponent digits to the right, adding 0s as necessary

    let unsigned;
    if (fracPart.length <= exponent) {
      unsigned = intPart
        + fracPart
        + '0'.repeat(exponent - fracPart.length);
    } else {
      unsigned = intPart
        + fracPart.slice(0, exponent)
        + '.'
        + fracPart.slice(exponent);
    }

    // Remove unnecessary leading zeros
    return signPart + unsigned.replace(/^0+(?=[0-9])/, '');
  }

  // Move decimal -exponent digits to the left, adding 0s as necessary
  exponent = -exponent;

  if (intPart.length > exponent) {
    return signPart
      + intPart.slice(0, exponent)
      + '.'
      + intPart.slice(exponent)
      + fracPart;
  }

  return signPart
    + '0.'
    + '0'.repeat(exponent - intPart.length)
    + intPart
    + fracPart;

  /* eslint-enable prefer-template */
}

/** Replacer function for jsonWithNumberExpRE which replaces the number in
 * exponential notation with one in fixed-point notation if the exponent
 * does not exceed +/-1000.
 *
 * @private
 * @param {string} match Substring which matched jsonWithNumberExpRE.
 * @param {string} prefix Substring before the number.
 * @param {string} numExp Number in exponential notation.
 * @param {string} signPart Sign part of number. (i.e. '-' or '')
 * @param {string} intPart Integer part of number. (i.e. part before decimal)
 * @param {string|undefined} fracPart Fractional part of number, if any.
 * (i.e. part after decimal).
 * @param {string} expPart Exponential part of number. (i.e. part after "e")
 * @returns {string} Prefix followed by numExp in fixed-point notation.
 * @throws {RangeError} If expPart is larger than 1,000 or smaller than
 * -1,000.
 */
function exponentialToFixedReplacer(
  match,
  prefix,
  numExp,
  signPart,
  intPart,
  fracPart,
  expPart,
) {
  // Limit exponent to mitigate issues due to large fixed-point representations
  // (e.g.  eating all memory for 1e99999999999)
  const exp = Number(expPart);
  if (exp > 1000 || exp < -1000) {
    throw new RangeError(`${numExp} exponent exceeds maximum`);
  }

  return prefix
    + exponentialPartsToFixed(signPart, intPart, fracPart || '', exp);
}

/** Replaces numbers in exponential notation in a given JSON string.
 *
 * @param {string} json JSON in which to replace numbers.
 * @param {(function(string):string)=} replacer Optional replacer function
 * called with a number in exponential format returning a string which will
 * replace the number in the return value.
 * @returns {string} Input JSON with numbers in exponential format replaced
 * by fixed-point format, or by replacer, if provided.
 * @throws {TypeError} If json is not a string.
 * @throws {TypeError} If replacer is not a function.
 * @throws {RangeError} If replacer is undefined and a number in exponential
 * format has an exponent which is larger than 1,000 or smaller than -1,000.
 * (To mitigate risks from unexpected large size increase in output.)
 */
module.exports =
function jsonReplaceExponentials(json, replacer) {
  if (typeof json !== 'string') {
    throw new TypeError('json must be a string');
  }

  let wrapReplacer;
  if (replacer === undefined) {
    wrapReplacer = exponentialToFixedReplacer;
  } else if (typeof replacer === 'function') {
    wrapReplacer = (match, prefix, numExp) => prefix + replacer(numExp);
  } else {
    throw new TypeError('replacer must be a function');
  }

  jsonWithNumberExpRE.lastIndex = 0;
  return json.replaceAll(jsonWithNumberExpRE, wrapReplacer);
};
