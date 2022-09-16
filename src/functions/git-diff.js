import * as core from '@actions/core'
import parseGitDiff from 'parse-git-diff'
import {exec} from 'child_process'

// Helper function to get the diff from the git command
// :returns: The diff object which is parsed git diff
// If an error occurs, setFailed is called and it returns null
export function gitDiff() {
  try {
    // Get the base branch to use for the diff
    const baseBranch = core.getInput('base_branch')

    exec(`git diff ${baseBranch}`, (error, stdout, stderr) => {
      if (error) {
        core.setFailed(`git diff error: ${error.message}`)
        return
      }
      if (stderr) {
        core.setFailed(`git diff error: ${stderr}`)
        return
      }

      // Raw diff
      core.debug(`raw git diff: ${stdout}`)
      core.setOutput('raw-diff', stdout)

      // JSON diff
      const diff = parseGitDiff(stdout)
      core.debug(JSON.stringify(diff))
      core.setOutput('diff', JSON.stringify(diff))
      return diff
    })
  } catch (e) {
    core.setFailed(`Error getting git diff: ${e}`)
  }
}
