import {gitDiff} from './functions/git-diff'

export async function run() {
  await gitDiff()
}

run()
