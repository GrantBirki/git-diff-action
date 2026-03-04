import {execFile} from 'child_process'
import * as util from 'util'

export async function execFileAsync(file, args, opts) {
  const execFileAsyncFunc = util.promisify(execFile)
  return await execFileAsyncFunc(file, args, opts)
}
