import {gitDiff} from './functions/git-diff'

export async function run() {
  await gitDiff()
}

/* istanbul ignore next */
if (process.env.GIT_DIFF_JEST_TEST !== 'true') {
  run()
}
