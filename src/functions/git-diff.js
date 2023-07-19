import * as core from '@actions/core'
import parseGitDiff from 'parse-git-diff'
import {exec} from 'child_process'
import {writeFileSync} from 'fs'

// Helper function to get the diff from the git command
// :returns: The diff object which is parsed git diff
// If an error occurs, setFailed is called and it returns null
export function gitDiff() {
  try {
    // Get the base branch to use for the diff
    const baseBranch = core.getInput('base_branch')
    core.debug(`base_branch: ${baseBranch}`)
    const searchPath = core.getInput('search_path')
    core.debug(`search_path: ${searchPath}`)

    exec(`git diff ${baseBranch} ${searchPath}`, (error, stdout, stderr) => {
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

      // Write the raw diff to a file if the path is provided
      const rawPath = core.getInput('raw_diff_file_output')
      if (rawPath) {
        core.debug(`writing raw diff to ${rawPath}`)
        core.setOutput('raw-diff-path', rawPath)
        writeFileSync(rawPath, stdout)
      }

      // JSON diff
      const diff = parseGitDiff(stdout)
      core.debug(JSON.stringify(diff))

      const jsonDiff = JSON.stringify(diff)
      core.setOutput('json-diff', jsonDiff)

      // Write the JSON diff to a file if the path is provided
      const jsonPath = core.getInput('json_diff_file_output')
      if (jsonPath) {
        core.debug(`writing json diff to ${jsonPath}`)
        core.setOutput('json-diff-path', jsonPath)
        writeFileSync(jsonPath, jsonDiff)
      }

      return diff
    })
  } catch (e) {
    core.setFailed(`error getting git diff: ${e}`)
  }
}
