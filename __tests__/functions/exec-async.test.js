import {execAsync} from '../../src/functions/exec-async'
import {exec} from 'child_process'
import * as util from 'util'

jest.mock('child_process')
jest.mock('util')

describe('execAsync', () => {
  it('should call exec and promisify', async () => {
    const execMock = jest.fn()
    exec.mockImplementation(execMock)
    const promisifyMock = jest.fn().mockImplementation(() => execMock)
    util.promisify.mockImplementation(promisifyMock)

    const cmd = 'echo hello'
    const opts = {}

    await execAsync(cmd, opts)

    expect(promisifyMock).toHaveBeenCalledWith(exec)
    expect(execMock).toHaveBeenCalledWith(cmd, opts)
  })
})
