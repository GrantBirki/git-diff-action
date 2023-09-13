import {gitDiff} from './functions/git-diff'

export async function run() {
  gitDiff()
}

if (process.env.ACTION_JEST_TEST !== 'true') {
  run()
}
