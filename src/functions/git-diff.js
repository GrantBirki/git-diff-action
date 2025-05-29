import * as core from '@actions/core'
import parseGitDiff from 'parse-git-diff'
import {execAsync} from './exec-async'
import fs from 'fs'

// Constants
const DEFAULT_MAX_BUFFER_SIZE = 1000000
const GIT_DIFF_MARKER = 'diff --git'

// Helper function to validate and get max buffer size
function getMaxBufferSize(maxBufferSizeInput) {
  if (
    isNaN(maxBufferSizeInput) ||
    maxBufferSizeInput === null ||
    maxBufferSizeInput === undefined
  ) {
    core.info(
      `max_buffer_size is not defined, using default of ${DEFAULT_MAX_BUFFER_SIZE}`
    )
    return DEFAULT_MAX_BUFFER_SIZE
  }
  return maxBufferSizeInput
}

// Helper function to get the diff from the git command
// :returns: The diff object which is parsed git diff
// If an error occurs, setFailed is called and it returns null
export async function gitDiff() {
  try {
    core.info('🏃 starting the git-diff-action')

    // Get the base branch to use for the diff
    const baseBranch = core.getInput('base_branch')
    core.debug(`base_branch: ${baseBranch}`)
    const searchPath = core.getInput('search_path')
    core.debug(`search_path: ${searchPath}`)
    const maxBufferSizeInput = parseInt(core.getInput('max_buffer_size'))
    core.debug(`max_buffer_size: ${maxBufferSizeInput}`)
    const fileOutputOnly = core.getInput('file_output_only') === 'true'
    const gitOptions = core.getInput('git_options')
    core.debug(`git_options: ${gitOptions}`)
    const gitDiffFile = core.getInput('git_diff_file')
    core.debug(`git_diff_file: ${gitDiffFile}`)

    var rawGitDiff

    // If git_diff_file is provided, read the file and return the diff
    if (gitDiffFile !== 'false') {
      core.info(`📂 reading git diff from file: ${gitDiffFile}`)
      rawGitDiff = fs.readFileSync(gitDiffFile, 'utf8')
    } else {
      // if max_buffer_size is not defined, just use the default
      const maxBufferSize = getMaxBufferSize(maxBufferSizeInput)

      if (gitOptions.includes('--binary')) {
        core.warning(
          `--binary flag is set, this may cause unexpected issues with the diff`
        )
      }

      // --no-pager ensures that the git command does not use a pager (like less) to display the diff
      const gitDiffCmd = `git --no-pager diff ${gitOptions} ${baseBranch} -- ${searchPath}`
      core.debug(`running git diff command: ${gitDiffCmd}`)
      const {stdout, stderr} = await execAsync(gitDiffCmd, {
        maxBuffer: maxBufferSize
      })

      if (stderr) {
        core.setFailed(`git diff error: ${stderr}`)
        return
      }

      rawGitDiff = stdout
    }

    // Count files changed in the raw diff
    // Note: This simple counting method may over-count if file content contains the git diff marker
    const totalFilesChanged = rawGitDiff.split(GIT_DIFF_MARKER).length - 1
    core.info(
      `🧮 total detected files changed (raw diff): ${totalFilesChanged}`
    )

    // only log the raw diff if the Action is explicitly set to run in debug mode
    core.debug(`raw git diff: ${rawGitDiff}`)
    if (fileOutputOnly === false) {
      // only set the output if fileOutputOnly is false
      core.setOutput('raw-diff', rawGitDiff)
    }

    // Write the raw diff to a file if the path is provided
    const rawPath = core.getInput('raw_diff_file_output')
    if (rawPath) {
      core.info(`💾 writing raw diff to: ${rawPath}`)
      core.setOutput('raw-diff-path', rawPath)
      fs.writeFileSync(rawPath, rawGitDiff)
    }

    // JSON diff
    const diff = parseGitDiff(rawGitDiff)
    const jsonDiff = JSON.stringify(diff)

    // log the total amount of files changed in the json diff
    core.info(
      `🧮 total detected files changed (json diff): ${diff.files.length}`
    )

    // only log the json diff if the Action is explicitly set to run in debug mode
    core.debug(`jsonDiff: ${jsonDiff}`)

    // only set the output if fileOutputOnly is false
    if (fileOutputOnly === false) {
      core.setOutput('json-diff', jsonDiff)
    }

    // Write the JSON diff to a file if the path is provided
    const jsonPath = core.getInput('json_diff_file_output')
    if (jsonPath) {
      core.info(`💾 writing json diff to: ${jsonPath}`)
      core.setOutput('json-diff-path', jsonPath)
      fs.writeFileSync(jsonPath, jsonDiff)
    }

    core.info('✅ git-diff-action completed successfully')
    return diff
  } catch (e) {
    core.setFailed(`error getting git diff: ${e}`)
  }
}
