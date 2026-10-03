# Contributing 💻

Use the exact Node version in `.node-version`. Consumers still run the committed `dist/index.js` with the Node runtime declared in `action.yml`.

```bash
script/bootstrap
script/all
script/verify-bundle
```

`script/bootstrap` installs the exact lockfile with lifecycle scripts disabled and uses Socket Firewall when available. It stores downloaded artifacts in ignored `.npm/`. After a successful bootstrap, `script/bootstrap --offline` can reconstruct `node_modules` from that cache. Checks, tests, acceptance, and builds use local tools and do not download packages. The cache and Node runtime are not vendored, so a fresh checkout still needs an initial online bootstrap.

Local development and CI share these entrypoints. The `npm run` aliases remain available:

- `script/format` formats TypeScript source and tests.
- `script/lint` checks formatting and strict TypeScript diagnostics, including unused code, return paths, and indexed access. It does not run ESLint.
- `script/test` runs native Node tests with 100% line, branch, and function coverage for each runtime module. Each source file has a matching test file named after it. Coverage is measured separately per module so Node's synthetic ESM mocks cannot distort the real source totals. Combined LCOV output is written to `coverage/lcov.info`.
- `script/build` type-checks and rebuilds all of `dist/` with the pinned `ncc` version, source maps, and license notices.
- `script/acceptance` copies the distribution into temporary directories without `node_modules`, then tests runner outputs, fixture checksums, real Git execution, and failures.
- `script/all` runs lint, unit tests, build, and acceptance.
- `script/verify-bundle` rebuilds and rejects tracked or untracked changes in `dist/`. Run it after committing the generated files.

Keep inputs, outputs, defaults, errors, and diff parsing compatible. The parser currently truncates some `--binary` diffs and retains a trailing tab for some paths containing spaces. Tests preserve these existing behaviors. Parser fixes should be separate, deliberate changes.

The only runtime package is `parse-git-diff`. TypeScript provides type checking, `@types/node` describes the supported runtime, Prettier provides formatting, and `ncc` produces the self-contained Action. The local Actions adapter implements only the string input/output and logging functions this repository uses. Its toolkit attribution is in `LICENSES/actions-toolkit.txt` and the generated distribution notices.

Dependency refreshes must preserve `.npmrc`, exact version pins, integrity records, and disabled install scripts. Review registry publication dates and security findings before fetching new versions. An unchanged lockfile provides repeatable inputs, not a guarantee that third-party code is safe.

Open a pull request with the source, tests, documentation, lockfile, and rebuilt distribution. Keep release tags and releases separate from ordinary changes.
