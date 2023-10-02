# [0.2.0](https://github.com/kevinoid/json-replace-exponentials/compare/v0.1.0...v0.2.0) (2023-10-02)

### BREAKING CHANGES

* Require Node.js >= 16.  Drop support for previous versions.

### Bug Fixes

* Don't match digits in the non-string, non-number portion of the regular
  expression for replacing numbers in JSON.  This could cause ReDoS due to
  super-linear backtracking of malicious input.
  ([f1db670](https://github.com/kevinoid/json-replace-exponentials/commit/f1db6706deb8f9ce89c63d9d9cf095154293eff7))


# 0.1.0 (2021-03-31)

* Initial release.
