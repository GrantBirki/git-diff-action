# Copilot Instructions

This is a TypeScript GitHub Action. Consumers execute `dist/index.js` through `action.yml` on Node 24.

Use the exact `.node-version`. Run `script/bootstrap` for installation, `script/all` for formatting checks, strict type checking, native tests, build, and standalone acceptance. Run `script/format` when formatting needs updating. The same scripts run in CI.

Preserve inputs, outputs, errors, Git argv handling, workspace path restrictions, and the existing parser behavior. Keep the Actions adapter narrow. Do not replace the diff parser or expand the adapter solely to remove dependencies.

Every runtime source file requires a corresponding native Node test with 100% line, branch, and function coverage. Use `node:test` and `node:assert/strict`, not a compatibility wrapper for a removed test framework. Acceptance tests must exercise the generated distribution without installed packages.

Runtime changes must include regenerated `dist/` files and license notices. Never hand-edit generated distribution files. After committing, `script/verify-bundle` must find no tracked or untracked changes in `dist/`.

Use exact dependency versions and the committed lockfile. Preserve `.npmrc`, verify dependency publication ages and security findings, and disable installation scripts. Use Socket Firewall when installed. Routine checks and builds should remain offline after bootstrap.

Keep changes small and readable, document meaningful tradeoffs, and preserve least-privilege workflow permissions and existing action pins. Do not merge, tag, or release without explicit authorization.
