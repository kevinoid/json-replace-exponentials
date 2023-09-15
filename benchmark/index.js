/**
 * @copyright Copyright 2021 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { readFile } = require('node:fs');
const { promisify } = require('node:util');

const Benchmark = require('benchmark');

// Note: fs.promises.readFile only accepts FileHandle, not number FD
const readFileP = promisify(readFile);

// https://github.com/import-js/eslint-plugin-import/issues/2844
// eslint-disable-next-line import/extensions,n/no-unpublished-require
global.jsonReplaceExponentials = require('..');
global.toJsonNoExponential = require('./to-json-no-exponential.js');

exports.createBenchmarkSuite =
function createBenchmarkSuite() {
  const suite = new Benchmark.Suite();

  suite.add({
    name: 'toJsonNoExponential',
    fn: 'toJsonNoExponential(jsonValue);',
  });

  suite.add({
    name: 'JSON.parse+toJsonNoExponential',
    fn: 'toJsonNoExponential(JSON.parse(jsonStr));',
  });

  suite.add({
    name: 'jsonReplaceExponentials',
    fn: 'jsonReplaceExponentials(jsonStr);',
  });

  return suite;
};

exports.runSuite = function runSuite(suite, options) {
  return new Promise((resolve, reject) => {
    suite
      .on('cycle', (evt) => {
        const bench = evt.target;
        if (bench.error) {
          // Workaround for https://github.com/bestiejs/benchmark.js/pull/122
          options.stderr.write(`${bench.name}: ${bench.error}`);
        } else {
          options.stdout.write(`${bench}\n`);
        }
      })
      .on('abort', () => reject(new Error('Aborted')))
      .on('complete', resolve)
      .run({ async: true });
  });
};

exports.main =
function main(args, options, exit) {
  if (!Array.isArray(args)) {
    throw new TypeError('args must be an Array');
  }
  if (!options || typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }
  if (!exit || typeof exit !== 'function') {
    throw new TypeError('exit must be a function');
  }

  const usage = `Usage: ${args[1]} <JSON file>\n`;
  if (args.length !== 3) {
    options.stderr.write(`Error: Expected exactly 1 argument.\n${usage}`);
    queueMicrotask(() => exit(1));
    return;
  }

  const filename = args[2];

  // eslint-disable-next-line promise/catch-or-return
  readFileP(
    filename === '-' ? 0 : filename,
    { encoding: 'utf8' },
  )
    .then((jsonStr) => {
      global.jsonStr = jsonStr;
      global.jsonValue = JSON.parse(jsonStr);
      return this.runSuite(this.createBenchmarkSuite(), options);
    })
    .then(
      () => exit(0),
      (err) => {
        options.stderr.write(`${err}\n`);
        exit(1);
      },
    );
};

if (require.main === module) {
  // This file was invoked directly.
  // Note:  Could pass process.exit as callback to force immediate exit.
  exports.main(process.argv, process, (exitCode) => {
    process.exitCode = exitCode;
  });
}
