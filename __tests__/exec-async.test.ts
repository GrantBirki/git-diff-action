import assert from 'node:assert/strict'
import {test} from 'node:test'
import {execFileAsync} from '../src/functions/exec-async.ts'
test('captures stdout and stderr as UTF-8 strings', async () => {
  assert.deepEqual(
    await execFileAsync(
      process.execPath,
      ['-e', 'process.stdout.write("雪"); process.stderr.write("warning")'],
      {}
    ),
    {stdout: '雪', stderr: 'warning'}
  )
})
test('passes arguments literally without executing a shell', async () => {
  const argument = 'space ; $(echo injected)'
  const result = await execFileAsync(
    process.execPath,
    ['-e', 'process.stdout.write(process.argv[1])', argument],
    {}
  )
  assert.equal(result.stdout, argument)
})
test('rejects nonzero exits', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, ['-e', 'process.exit(3)'], {}),
    {code: 3}
  )
})
test('enforces maxBuffer', async () => {
  await assert.rejects(
    execFileAsync(
      process.execPath,
      ['-e', 'process.stdout.write("long output")'],
      {maxBuffer: 2}
    ),
    {code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}
  )
})
