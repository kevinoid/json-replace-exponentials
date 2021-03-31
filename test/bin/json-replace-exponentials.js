/**
 * @copyright Copyright 2021 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('assert');
const { PassThrough } = require('stream');

const jreBin = require('../../bin/json-replace-exponentials.js');
const packageJson = require('../../package.json');

const sharedArgs = ['node', 'json-replace-exponentials'];
const usage = 'Usage: json-replace-exponentials <input.json >output.json\n';

function getTestOptions() {
  return {
    stdin: new PassThrough(),
    stdout: new PassThrough({ encoding: 'utf8' }),
    stderr: new PassThrough({ encoding: 'utf8' }),
  };
}

function neverCalled() {
  assert.fail('Should not be called');
}

describe('json-replace-exponentials', () => {
  it('throws TypeError with no args', () => {
    assert.throws(
      () => jreBin(),
      TypeError,
    );
  });

  it('throws TypeError for non-Array first arg', () => {
    assert.throws(
      () => jreBin({}, getTestOptions(), neverCalled),
      TypeError,
    );
  });

  it('throws TypeError for non-Object second arg', () => {
    assert.throws(
      () => jreBin(sharedArgs, 1, neverCalled),
      TypeError,
    );
  });

  it('throws TypeError for missing stdin', () => {
    const options = getTestOptions();
    delete options.stdin;
    assert.throws(
      () => jreBin(sharedArgs, options, neverCalled),
      TypeError,
    );
  });

  it('throws TypeError for missing stdout', () => {
    const options = getTestOptions();
    delete options.stdout;
    assert.throws(
      () => jreBin(sharedArgs, options, neverCalled),
      TypeError,
    );
  });

  it('throws TypeError for missing stderr', () => {
    const options = getTestOptions();
    delete options.stderr;
    assert.throws(
      () => jreBin(sharedArgs, options, neverCalled),
      TypeError,
    );
  });

  it('throws TypeError for non-function callback', () => {
    assert.throws(
      () => jreBin(sharedArgs, getTestOptions(), {}),
      TypeError,
    );
  });

  it('writes error and exit 1 for unexpected args', (done) => {
    const options = getTestOptions();
    const result = jreBin([...sharedArgs, 'hi'], options, (code) => {
      assert.strictEqual(code, 1);
      assert.strictEqual(options.stdout.read(), null);
      assert.strictEqual(
        options.stderr.read(),
        `Error: Unexpected arguments.\n${usage}`,
      );
      done();
    });
    assert.strictEqual(result, undefined);
  });

  it('writes usage and exit 0 for --help', (done) => {
    const options = getTestOptions();
    const result = jreBin([...sharedArgs, '--help'], options, (code) => {
      assert.strictEqual(code, 0);
      assert.strictEqual(options.stdout.read(), usage);
      assert.strictEqual(options.stderr.read(), null);
      done();
    });
    assert.strictEqual(result, undefined);
  });

  it('writes version and exit 0 for --version', (done) => {
    const options = getTestOptions();
    const result = jreBin([...sharedArgs, '--version'], options, (code) => {
      assert.strictEqual(code, 0);
      assert.strictEqual(
        options.stdout.read(),
        `${packageJson.name} ${packageJson.version}\n`,
      );
      assert.strictEqual(options.stderr.read(), null);
      done();
    });
    assert.strictEqual(result, undefined);
  });

  it('writes transformed JSON to stdout', (done) => {
    const options = getTestOptions();
    const result = jreBin(sharedArgs, options, (code) => {
      assert.strictEqual(code, 0);
      assert.strictEqual(options.stdout.read(), '100');
      assert.strictEqual(options.stderr.read(), null);
      done();
    });
    assert.strictEqual(result, undefined);
    options.stdin.end('1e2');
  });

  it('handles input split across multiple reads', (done) => {
    // Ensure string parsing maintains state across reads
    const options = getTestOptions();
    const result = jreBin(sharedArgs, options, (code) => {
      assert.strictEqual(code, 0);
      assert.strictEqual(options.stdout.read(), '[100,"1e2,1e2",100]');
      assert.strictEqual(options.stderr.read(), null);
      done();
    });
    assert.strictEqual(result, undefined);
    options.stdin.write('[1e2,"1e2');
    setTimeout(
      () => options.stdin.end(',1e2",1e2]'),
      10,
    );
  });

  it('writes error and exit 1 for stdin read error', (done) => {
    const errTest = new Error('test');
    const options = getTestOptions();
    const result = jreBin(sharedArgs, options, (code) => {
      assert.strictEqual(code, 1);
      assert.strictEqual(options.stdout.read(), null);
      assert.strictEqual(
        options.stderr.read(),
        `Error reading from stdin: ${errTest}\n`,
      );
      done();
    });
    assert.strictEqual(result, undefined);
    options.stdin.emit('error', errTest);
  });

  it('writes error and exit 1 for stdout write error', (done) => {
    const errTest = new Error('test');
    const options = getTestOptions();
    // eslint-disable-next-line no-underscore-dangle
    options.stdout._transform = (chunk, enc, cb) => cb(errTest);
    const result = jreBin(sharedArgs, options, (code) => {
      assert.strictEqual(code, 1);
      assert.strictEqual(
        options.stderr.read(),
        `Error writing to stdout: ${errTest}\n`,
      );
      done();
    });
    assert.strictEqual(result, undefined);
    options.stdin.end('{}');
  });

  it('writes error and exit 1 for sync stdout write error', (done) => {
    const errTest = new Error('test');
    const options = getTestOptions();
    options.stdout.write = () => { throw errTest; };
    const result = jreBin(sharedArgs, options, (code) => {
      assert.strictEqual(code, 1);
      assert.strictEqual(
        options.stderr.read(),
        `Error writing to stdout: ${errTest}\n`,
      );
      done();
    });
    assert.strictEqual(result, undefined);
    options.stdin.end('{}');
  });
});
