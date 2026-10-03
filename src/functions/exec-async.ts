import {execFile, type ExecFileOptions} from 'node:child_process'
import {promisify} from 'node:util'

export async function execFileAsync(
  file: string,
  args: string[],
  opts: ExecFileOptions
) {
  return await promisify(execFile)(file, args, {...opts, encoding: 'utf8'})
}
