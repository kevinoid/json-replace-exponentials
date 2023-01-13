json-replace-exponentials
=========================

[![Build Status](https://img.shields.io/github/actions/workflow/status/kevinoid/json-replace-exponentials/node.js.yml?branch=main&style=flat&label=build)](https://github.com/kevinoid/json-replace-exponentials/actions?query=branch%3Amain)
[![Coverage](https://img.shields.io/codecov/c/github/kevinoid/json-replace-exponentials/main.svg?style=flat)](https://app.codecov.io/gh/kevinoid/json-replace-exponentials/branch/main)
[![Dependency Status](https://img.shields.io/librariesio/release/npm/json-replace-exponentials.svg?style=flat)](https://libraries.io/npm/json-replace-exponentials)
[![Supported Node Version](https://img.shields.io/node/v/json-replace-exponentials.svg?style=flat)](https://www.npmjs.com/package/json-replace-exponentials)
[![Version on NPM](https://img.shields.io/npm/v/json-replace-exponentials.svg?style=flat)](https://www.npmjs.com/package/json-replace-exponentials)

This module provides a function which takes a JSON string and replaces all
numbers in exponential notation.  By default, numbers in exponential notation
are replaced by numbers in fixed-point notation.  If an optional replacer
function is provided, its return value is used instead.

The primary motivation for this module is to produce JSON for programs which
handle exponential notation incorrectly (e.g.
[Azure/autorest#3006](https://github.com/Azure/autorest/issues/3006)).


## Introductory Example

Using the CLI:

```sh
json-replace-exponentials <input-exponentials.json >output-fixed.json
```

Using the API:

```js
const { readFile, writeFile } = require('fs').promises;
const jsonReplaceExponentials = require('json-replace-exponentials');

readFile('input-exponentials.json', { encoding: 'utf8' })
  .then((json) => writeFile(
    'output-fixed.json',
    JSON.stringify(jsonReplaceExponentials(json), undefined, 2),
  );
```


## Features

* Preserves white-space and formatting of input JSON.
* Preserves full precision of replaced numbers, even for numbers which can
  not be exactly represented by the JavaScript `number` type.
* The default replacer throws `RangeError` for numbers where the exponential
  is larger than 1,000 or smaller than -1,000 to mitigate unexpected result
  size increases for large fixed-point representations.
  **Warning:** Consider this risk when using a custom replacer.


## Non-Features

* Does not parse or validate input JSON.  If input is not valid JSON, the
  behavior of `json-replace-exponentials` is undefined.


## Installation

[This package](https://www.npmjs.com/package/json-replace-exponentials) can be
installed using [npm](https://www.npmjs.com/), either globally or locally, by
running:

```sh
npm install json-replace-exponentials
```


## Recipes

### Replace large exponents

As noted above, by default, exponents larger than 1,000 or -1,000 cause
`RangeError` to be thrown.  To replace with (non-standard) `Infinity` and
`Underflow`, and others with the default replacement:

```js
const jsonReplaceExponentials = require('json-replace-exponentials');

function replacer(exponential) {
  const match = /[eE]([+-]?)[0-9]{4,}$/.exec(exponential);
  if (match) {
    return match[1] === '-' ? 'Underflow' : 'Infinity';
  }

  return jsonReplaceExponentials(exponential);
}

jsonReplaceExponentials(json, replacer);
```


## API Docs

To use this module as a library, see the [API
Documentation](https://kevinoid.github.io/json-replace-exponentials/api).


## Contributing

Contributions are appreciated.  Contributors agree to abide by the [Contributor
Covenant Code of
Conduct](https://www.contributor-covenant.org/version/1/4/code-of-conduct.html).
If this is your first time contributing to a Free and Open Source Software
project, consider reading [How to Contribute to Open
Source](https://opensource.guide/how-to-contribute/)
in the Open Source Guides.

If the desired change is large, complex, backwards-incompatible, can have
significantly differing implementations, or may not be in scope for this
project, opening an issue before writing the code can avoid frustration and
save a lot of time and effort.


## License

This project is available under the terms of the [MIT License](LICENSE.txt).
See the [summary at TLDRLegal](https://tldrlegal.com/license/mit-license).
