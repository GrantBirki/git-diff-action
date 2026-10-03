import assert from 'node:assert/strict'
import {mock, test} from 'node:test'
const run = mock.fn(async () => undefined)
mock.module('../src/functions/git-diff.ts', {namedExports: {gitDiff: run}})
test('entrypoint awaits one action execution', async () => {
  await import('../src/main.ts')
  assert.equal(run.mock.callCount(), 1)
})
