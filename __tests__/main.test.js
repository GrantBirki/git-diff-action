import {gitDiff} from '../src/functions/git-diff'
import * as core from '@actions/core'

const infoMock = jest.spyOn(core, 'info')

beforeEach(() => {
  jest.clearAllMocks()

  jest.spyOn(core, 'saveState').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'setOutput').mockImplementation(() => {})

  process.env.INPUT_BASE_BRANCH = 'HEAD^1'
  process.env.INPUT_SEARCH_PATH = '.'
  process.env.INPUT_MAX_BUFFER_SIZE = '1000000'
  process.env.INPUT_FILE_OUTPUT_ONLY = 'false'
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index'
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/main.diff'
})

test('executes gitDiff', async () => {
  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('utils/cache-machine.mjs')
  expect(lastFile.type).toBe('DeletedFile')
  expect(lastFile.chunks[0].changes[0].type).toBe('DeletedLine')
  expect(lastFile.chunks[0].changes[0].content).toBe(`// cache url`)
  expect(lastFile.chunks[0].changes[0].lineBefore).toBe(1)
  expect(lastFile.chunks[0].changes[0]?.lineAfter).toBe(undefined)

  expect(results.files[0].type).toBe('ChangedFile')
  expect(results.files[0].chunks[0].changes[0].content).toBe(
    `import { v4 as uuidv4 } from 'uuid';`
  )
  expect(results.files[0].chunks[0].changes[0].type).toBe('UnchangedLine')
  expect(results.files[0].chunks[0].changes[2].content).toBe(
    `import cacheMachine from '../utils/cache-machine.mjs';`
  )
  expect(results.files[0].chunks[0].changes[2].type).toBe('DeletedLine')

  expect(infoMock).toHaveBeenCalledWith('total files changed (raw diff): 5')
  expect(infoMock).toHaveBeenCalledWith('total files changed (json diff): 5')
})

test('executes gitDiff with binary files', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/with-binary-files.diff'
  const results = await gitDiff()

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('utils/cache-machine.mjs')

  expect(results.files[0].type).toBe('ChangedFile')
  expect(results.files[0].chunks[0].changes[0].content).toBe(
    `import { v4 as uuidv4 } from 'uuid';`
  )
  expect(results.files[0].chunks[0].changes[0].type).toBe('UnchangedLine')
  expect(results.files[0].chunks[0].changes[2].content).toBe(
    `import cacheMachine from '../utils/cache-machine.mjs';`
  )
  expect(results.files[0].chunks[0].changes[2].type).toBe('DeletedLine')

  expect(results.files.length).toBe(7)
  expect(infoMock).toHaveBeenCalledWith(
    'reading git diff from file: __tests__/fixtures/with-binary-files.diff'
  )
  expect(infoMock).toHaveBeenCalledWith('total files changed (raw diff): 7')
  expect(infoMock).toHaveBeenCalledWith('total files changed (json diff): 7')
})

// this test case is a bug test
// there is an issue with the 'parseGitDiff' library where if the --binary flag is used, it will break the parsing
// it will still return "some" results, but it will break the parsing and return an incomplete set of results
test('executes gitDiff with binary files and --binary flag and breaks (bug test)', async () => {
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index --binary'
  process.env.INPUT_GIT_DIFF_FILE =
    '__tests__/fixtures/with-binary-files-and-binary-flag.diff'
  const results = await gitDiff()

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('kv-cache.js')

  expect(results.files.length).toBe(4)
  expect(infoMock).toHaveBeenCalledWith(
    'reading git diff from file: __tests__/fixtures/with-binary-files-and-binary-flag.diff'
  )

  // note that the total files changed is 7, but the json diff only has 4 files
  expect(infoMock).toHaveBeenCalledWith('total files changed (raw diff): 7')
  expect(infoMock).toHaveBeenCalledWith('total files changed (json diff): 4')
})
