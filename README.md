# git-diff-action 📃

[![test](https://github.com/GrantBirki/git-diff-action/actions/workflows/test.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/test.yml) [![lint](https://github.com/GrantBirki/git-diff-action/actions/workflows/lint.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/lint.yml) [![CodeQL](https://github.com/GrantBirki/git-diff-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/codeql-analysis.yml) [![package-check](https://github.com/GrantBirki/git-diff-action/actions/workflows/package-check.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/package-check.yml) [![sample-workflow](https://github.com/GrantBirki/git-diff-action/actions/workflows/sample-workflow.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/sample-workflow.yml) [![acceptance](https://github.com/GrantBirki/git-diff-action/actions/workflows/acceptance.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/acceptance.yml) [![coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action for gathering the `git diff` of a pull request in JSON format or standard `git diff` format

## About 💡

A useful Action for grabbing the `git diff` output of a pull request in a machine readable JSON format. This Action can be used in conjunction with other Actions or tools to perform tasks such as:

- Auditing the changes made in a pull request
- Running subsequent workflows conditionally based on the files, lines, or directories changed in a pull request
- Send out a signal to reviewers when certain files or even specific lines are changed in a pull request

## Turbo Quickstart ⚡

Checkout the example below to see how you can use this Action in your workflow to get the `git diff` of changes made in the context of a pull request

> All references to `vX.X.X` are places holders and you can find the latest version of this Action under the [Releases](https://github.com/GrantBirki/git-diff/releases) section

```yaml
      # Checkout the repo
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/git-diff-action@vX.X.X
        id: git-diff-action
        with:
          json_diff_file_output: diff.json
          raw_diff_file_output: diff.txt
          file_output_only: "true"

      # Print the diff in JSON format
      - name: print json diff
        env:
          DIFF: ${{ steps.git-diff-action.outputs.json-diff-path }}
        run: cat $DIFF

      # Print the diff in raw git format
      - name: print raw diff
        env:
          DIFF: ${{ steps.git-diff-action.outputs.raw-diff-path }}
        run: cat $DIFF
```

> View the section below to see a more detailed example

## Example 📚

This is a full workflow example with detailed comments for how you can use this Action

```yaml
name: sample-workflow

# Run on all pull_request related events
on:
  pull_request:

permissions:
  contents: read # this is necessary for the Action to be able to read the contents of the repo

jobs:
  sample:
    runs-on: ubuntu-latest
    steps:
      # Checkout the repo
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/git-diff-action@vX.X.X
        id: git-diff-action
        with:
          json_diff_file_output: diff.json
          raw_diff_file_output: diff.txt
          file_output_only: "true"

      # Print the diff in JSON format
      - name: print json diff
        env:
          DIFF: ${{ steps.git-diff-action.outputs.json-diff-path }}
        run: cat $DIFF

      # Print the diff in raw git format
      - name: print raw diff
        env:
          DIFF: ${{ steps.git-diff-action.outputs.raw-diff-path }}
        run: cat $DIFF
```

### JSON Diff Output 📝

Expand the section below to see an example of the JSON diff output

<details>
<summary> JSON Example </summary>

```json
{
    "type": "GitDiff",
    "files": [
        {
            "type": "ChangedFile",
            "chunks": [
                {
                    "type": "Chunk",
                    "toFileRange": {
                        "start": 12,
                        "lines": 8
                    },
                    "fromFileRange": {
                        "start": 12,
                        "lines": 6
                    },
                    "changes": [
                        {
                            "type": "UnchangedLine",
                            "lineBefore": 12,
                            "lineAfter": 12,
                            "content": "    steps:"
                        },
                        {
                            "type": "UnchangedLine",
                            "lineBefore": 13,
                            "lineAfter": 13,
                            "content": "      # Need to checkout for testing the Action in this repo"
                        },
                        {
                            "type": "UnchangedLine",
                            "lineBefore": 14,
                            "lineAfter": 14,
                            "content": "      - uses: actions/checkout@2541b1294d2704b0964813337f33b291d3f8596b # pin@v3.0.2"
                        },
                        {
                            "type": "AddedLine",
                            "lineAfter": 15,
                            "content": "        with:"
                        },
                        {
                            "type": "AddedLine",
                            "lineAfter": 16,
                            "content": "          fetch-depth: 0 # needed to checkout all branches"
                        },
                        {
                            "type": "UnchangedLine",
                            "lineBefore": 15,
                            "lineAfter": 17,
                            "content": ""
                        },
                        {
                            "type": "UnchangedLine",
                            "lineBefore": 16,
                            "lineAfter": 18,
                            "content": "      # Start check the PR diff"
                        },
                        {
                            "type": "UnchangedLine",
                            "lineBefore": 17,
                            "lineAfter": 19,
                            "content": "      - uses: ./"
                        }
                    ]
                }
            ],
            "path": ".github/workflows/sample-workflow.yml"
        }
    ]
}
```

</details><br>

> Click [here](example/diff.json) to see an even more detailed example of the JSON diff output

## Inputs 📥

| Input | Required? | Default | Description |
| ----- | --------- | ------- | ----------- |
| `base_branch` | yes | `HEAD^1` | The "base" or "target" branch to use for the git diff |
| `json_diff_file_output` | no | - | Optionally write the JSON diff output to a file. This is a string to the file path you wish to write to. **highly recommended** |
| `raw_diff_file_output` | no | - | Optionally write the raw diff output to a file. This is a string to the file path you wish to write to. **highly recommended** |
| `file_output_only` | no | `"false"` | Only use file related outputs and do not print any diffs to console / loggers. **highly recommended** |
| `search_path` | no | `.` | Optionally limit the scope of the diff operation to a specific sub-path. Useful for limiting scope of the action. |
| `max_buffer_size` | no | `"10000000"` | Maximum output buffer size for call to git binary. Default is 10M, try increasing this value if you have issues with maxBuffer overflow. This value is technically a string but it gets converted to an integer. |
| `git_options` | no | `"--no-color --full-index"` | Additional options to pass to the git binary |
| `git_diff_file` | no | `"false"` | Optionally read the diff from a file instead of running `git diff` |

## Outputs 📤

| Output | Description |
| ------ | ----------- |
| `json-diff` | The `git diff` of the pull request in JSON format |
| `raw-diff` | The raw `git diff` of the pull request |
| `json-diff-path` | The path to the JSON diff file if `json_diff_file_output` was specified |
| `raw-diff-path` | The path to the raw diff file if `raw_diff_file_output` was specified |

## `base_branch` Input

The `base_branch` input is `HEAD^1` by default. This means that the "base" or "target" branch for the git diff will be the branch that the pull request is targeting. For most use cases, it's best to compare the pull request merge commit against its first parent, which will only show changes that the pull request itself introduces.

This option can be changed to any valid git ref, such as a branch name, tag name, or commit hash.

Another common option that can be used in the context of GitHub Actions is `${{ github.event.pull_request.base.sha }}`

## `search_path` Input

The `search_path` input is `.` by default. This means that the working directory (base of the repository) is in-scope for the git diff command.

If you want to limit the scope of the `git diff` command you can specify a subfolder, subpath or file glob in it's place. Here are some examples:

```yaml
# Only look in files called CHANGELOG.md
search_path: '**/CHANGELOG.md'

# Only search in YAML files
search_path: '**/*.yaml'

# Only look in the src/ directory
search_path: src/
```

## Known Issues

You should always opt for using the `json_diff_file_output`, `raw_diff_file_output`, and `file_output_only` (set to `"true"`) inputs to write the diff output to a file. This is because the diff output can be quite large and can cause issues with the GitHub Actions API.

If your git diff is too large, you may see an error like this:

```text
Error: An error occurred trying to start process '/usr/bin/bash' with working directory '/home/runner/work/<repo>/<dir>'. Argument list too long
```

This is because GitHub Actions can only support argument lists from environment variables up to a certain size. To get around this, it is highly recommended to use the `json_diff_file_output` and `raw_diff_file_output` inputs to write the diff output to a file and then read that file in subsequent steps.

Setting `file_output_only: "true"` can also help avoid any sort of memory issues that could occur in GitHub Actions runners if they try to log massive diffs to the console.

The TL;DR of this section, is that you should really just be using file based outputs to avoid issues that can occur when printing huge amounts of text to the console with Action runners.

Here is an example with the suggested configuration options explicitly set:

```yaml
- uses: GrantBirki/git-diff-action@vX.X.X
  id: git-diff-action
  with:
    base_branch: HEAD^1 # compare the PR merge commit against its first parent
    json_diff_file_output: diff.json # write the JSON diff output to a file called 'diff.json'
    raw_diff_file_output: diff.txt # write the raw diff output to a file called 'diff.txt' (just in case)
    file_output_only: "true" # do not print any diff output to the console (safety first)
    search_path: '.' # look in the entire repo for changes
    max_buffer_size: "1000000" # the default git diff buffer size, increase if you have issues
```

Now your configuration is pretty much self-documenting and you can easily see what the Action is doing
