import {exec} from 'child_process'
import * as util from 'util'

export async function execAsync(cmd, opts) {
  const execAsyncFunc = util.promisify(exec)
  return await execAsyncFunc(cmd, opts)
}
