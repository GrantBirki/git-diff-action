import {run} from '../src/main'
import * as gitDiff from '../src/functions/git-diff'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(gitDiff, 'gitDiff').mockImplementation(() => {
    return true
  })
})

describe('main.js', () => {
  it('runs main', async () => {
    expect(await run()).toBe(undefined)
  })
})
