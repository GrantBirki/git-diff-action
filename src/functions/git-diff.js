import * as core from '@actions/core'
import parseGitDiff from 'parse-git-diff'
import {execFileAsync} from './exec-async'
import fs from 'fs'
import path from 'path'

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

function tokenizeInputArgs(value, inputName) {
  if (!value || value.trim() === '') {
    return []
  }

  const args = []
  let current = ''
  let quote = null
  let escaped = false
  let tokenInProgress = false

  for (const char of value) {
    if (escaped) {
      current += char
      escaped = false
      tokenInProgress = true
      continue
    }

    if (quote === "'") {
      if (char === "'") {
        quote = null
      } else {
        current += char
      }
      tokenInProgress = true
      continue
    }

    if (quote === '"') {
      if (char === '"') {
        quote = null
      } else if (char === '\\') {
        escaped = true
      } else {
        current += char
      }
      tokenInProgress = true
      continue
    }

    if (/\s/.test(char)) {
      if (tokenInProgress) {
        if (current !== '') {
          args.push(current)
        }
        current = ''
        tokenInProgress = false
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      tokenInProgress = true
      continue
    }

    if (char === '\\') {
      escaped = true
      tokenInProgress = true
      continue
    }

    current += char
    tokenInProgress = true
  }

  if (quote) {
    throw new Error(`${inputName} contains an unterminated quoted value`)
  }

  if (escaped) {
    throw new Error(`${inputName} ends with an incomplete escape sequence`)
  }

  if (tokenInProgress && current !== '') {
    args.push(current)
  }

  return args
}

function getGitDiffArgs(gitOptions, baseBranch, searchPath) {
  return [
    '--no-pager',
    'diff',
    ...tokenizeInputArgs(gitOptions, 'git_options'),
    baseBranch,
    '--',
    searchPath
  ]
}

function resolveWorkspacePath(filePath) {
  const workspaceRoot = fs.realpathSync(
    process.env.GITHUB_WORKSPACE || process.cwd()
  )
  const resolvedPath = path.resolve(workspaceRoot, filePath)
  const realPath = fs.realpathSync(resolvedPath)
  const relativePath = path.relative(workspaceRoot, realPath)

  if (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  ) {
    return realPath
  }

  throw new Error(
    'git_diff_file must resolve to a file inside the GitHub workspace'
  )
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
      const safeGitDiffFile = resolveWorkspacePath(gitDiffFile)
      core.info(`📂 reading git diff from file: ${safeGitDiffFile}`)
      rawGitDiff = fs.readFileSync(safeGitDiffFile, 'utf8')
    } else {
      // if max_buffer_size is not defined, just use the default
      const maxBufferSize = getMaxBufferSize(maxBufferSizeInput)
      const gitDiffArgs = getGitDiffArgs(gitOptions, baseBranch, searchPath)

      if (gitDiffArgs.includes('--binary')) {
        core.warning(
          `--binary flag is set, this may cause unexpected issues with the diff`
        )
      }

      // --no-pager ensures that the git command does not use a pager (like less) to display the diff
      core.debug(
        `running git diff argv: ${JSON.stringify(['git', ...gitDiffArgs])}`
      )
      const {stdout, stderr} = await execFileAsync('git', gitDiffArgs, {
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
