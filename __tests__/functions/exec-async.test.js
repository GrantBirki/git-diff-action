import {execFileAsync} from '../../src/functions/exec-async'
import {execFile} from 'child_process'
import * as util from 'util'

jest.mock('child_process')
jest.mock('util')

describe('execFileAsync', () => {
  it('should call execFile and promisify', async () => {
    const execFileMock = jest.fn()
    execFile.mockImplementation(execFileMock)
    const promisifyMock = jest.fn().mockImplementation(() => execFileMock)
    util.promisify.mockImplementation(promisifyMock)

    const file = 'git'
    const args = ['status', '--short']
    const opts = {}

    await execFileAsync(file, args, opts)

    expect(promisifyMock).toHaveBeenCalledWith(execFile)
    expect(execFileMock).toHaveBeenCalledWith(file, args, opts)
  })
})
