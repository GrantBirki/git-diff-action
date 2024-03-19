import {run} from '../src/main'
import * as gitDiff from '../src/functions/git-diff'

const SAMPLE_DIFF = {
  type: 'GitDiff',
  files: [
    {
      type: 'AddedFile',
      chunks: [
        {
          type: 'Chunk',
          toFileRange: {
            start: 1,
            lines: 47
          },
          fromFileRange: {
            start: 0,
            lines: 0
          },
          changes: [
            {
              type: 'AddedLine',
              lineAfter: 1,
              content: 'name: package-check'
            }
          ]
        }
      ],
      path: '.github/workflows/package-check.yml'
    }
  ]
}

beforeEach(() => {
  jest.spyOn(gitDiff, 'gitDiff').mockImplementation(() => {
    return SAMPLE_DIFF
  })

  process.env.INPUT_BASE_BRANCH = 'HEAD^1'
  process.env.INPUT_SEARCH_PATH = '.'
  process.env.INPUT_MAX_BUFFER_SIZE = '1000000'
  process.env.INPUT_FILE_OUTPUT_ONLY = 'false'
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index --binary'
})

test('executes main', async () => {
  expect(await run()).toStrictEqual(undefined)
})
