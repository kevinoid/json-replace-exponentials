#!/usr/bin/env node
/**
 * Executable script which reads JSON from stdin, then writes JSON to stdout
 * with numbers in exponential notation replaced by numbers in fixed-point
 * notation.
 *
 * @private
 * @copyright Copyright 2017-2021 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 * @module json-replace-exponentials/bin/json-replace-exponentials
 */

'use strict';

const packageJson = require('../package.json');
const jsonReplaceExponentials = require('..');

/** Options for command entry points.
 *
 * @typedef {{
 *   env: !object<string,string>,
 *   stdin: !module:stream.Readable,
 *   stdout: !module:stream.Writable,
 *   stderr: !module:stream.Writable
 * }} CommandOptions
 * @property {!object<string,string>} env Environment variables.
 * @property {!module:stream.Readable} stdin Stream from which input is read.
 * @property {!module:stream.Writable} stdout Stream to which output is
 * written.
 * @property {!module:stream.Writable} stderr Stream to which errors and
 * non-output status messages are written.
 */
// const CommandOptions;

/** Entry point for this command.
 *
 * @param {!Array<string>} args Command-line arguments.
 * @param {!CommandOptions} options Options.
 * @param {function(number)} callback Callback with exit code.
 */
function jsonReplaceExponentialsCmd(args, { stdin, stdout, stderr }, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (args !== undefined
      && args !== null
      && Math.floor(args.length) !== args.length) {
    throw new TypeError('args must be Array-like');
  }

  if (!stdin || typeof stdin.on !== 'function') {
    throw new TypeError('options.stdin must be a stream.Readable');
  }
  if (!stdout || typeof stdout.write !== 'function') {
    throw new TypeError('options.stdout must be a stream.Writable');
  }
  if (!stderr || typeof stderr.write !== 'function') {
    throw new TypeError('options.stderr must be a stream.Writable');
  }

  const usage = 'Usage: json-replace-exponentials <input.json >output.json\n';
  switch (args[2]) {
    case '-h':
    case '-?':
    case '--help':
      stdout.write(usage);
      process.nextTick(callback, 0);
      return;

    case '-V':
    case '--version':
      stdout.write(`${packageJson.name} ${packageJson.version}\n`);
      process.nextTick(callback, 0);
      return;

    default:
      break;
  }

  if (args.length > 2) {
    stderr.write(`Error: Unexpected arguments.\n${usage}`);
    process.nextTick(callback, 1);
    return;
  }

  function onWriteError(err) {
    stderr.write(`Error writing to stdout: ${err}\n`);
    callback(1);
  }

  stdout.once('error', onWriteError);

  const jsonData = [];
  stdin
    .once('error', (err) => {
      stderr.write(`Error reading from stdin: ${err}\n`);
      callback(1);
    })
    .on('data', (data) => jsonData.push(data))
    .once('end', () => {
      // TODO: Detect UTF-16/32 using algorithm from RFC 4627:
      // https://tools.ietf.org/html/rfc4627#section-3
      const oldJson = Buffer.concat(jsonData).toString('utf8');
      const newJson = jsonReplaceExponentials(oldJson);
      try {
        stdout.write(newJson, (err) => {
          if (!err) {
            callback(0);
          }
        });
      } catch (errWrite) {
        onWriteError(errWrite);
      }
    });
}

module.exports = jsonReplaceExponentialsCmd;

if (require.main === module) {
  // This file was invoked directly.
  // Note:  Could pass process.exit as callback to force immediate exit.
  jsonReplaceExponentialsCmd(process.argv, process, (exitCode) => {
    process.exitCode = exitCode;
  });
}
