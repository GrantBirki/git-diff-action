# git-diff-action 📃

[![test](https://github.com/GrantBirki/git-diff-action/actions/workflows/test.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/test.yml) [![CodeQL](https://github.com/GrantBirki/git-diff-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/codeql-analysis.yml) [![package-check](https://github.com/GrantBirki/git-diff-action/actions/workflows/package-check.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/package-check.yml) [![sample-workflow](https://github.com/GrantBirki/git-diff-action/actions/workflows/sample-workflow.yml/badge.svg)](https://github.com/GrantBirki/git-diff-action/actions/workflows/sample-workflow.yml)

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
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/git-diff-action@vX.X.X
        id: git-diff-action
        with:
          json_diff_file_output: diff.json
          raw_diff_file_output: diff.txt

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
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/git-diff-action@vX.X.X
        id: git-diff-action
        with:
          json_diff_file_output: diff.json
          raw_diff_file_output: diff.txt

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
| base_branch | yes | `HEAD^1` | The "base" or "target" branch to use for the git diff |
| json_diff_file_output | no | - | Optionally write the JSON diff output to a file. This is a string to the file path you wish to write to. **highly recommended** |
| raw_diff_file_output | no | - | Optionally write the raw diff output to a file. This is a string to the file path you wish to write to. **highly recommended** |

## Outputs 📤

| Output | Description |
| ------ | ----------- |
| json-diff | The `git diff` of the pull request in JSON format |
| raw-diff | The raw `git diff` of the pull request |
| json-diff-path| The path to the JSON diff file if `json_diff_file_output` was specified |
| raw-diff-path | The path to the raw diff file if `raw_diff_file_output` was specified |

## Known Issues

You should always opt for using the `json_diff_file_output` and `raw_diff_file_output` inputs to write the diff output to a file. This is because the diff output can be quite large and can cause issues with the GitHub Actions API.

If your git diff is too large, you may see an error like this:

```text
Error: An error occurred trying to start process '/usr/bin/bash' with working directory '/home/runner/work/<repo>/<dir>'. Argument list too long
```

This is because GitHub Actions can only support argument lists from environment variables up to a certain size. To get around this, it is highly recommended to use the `json_diff_file_output` and `raw_diff_file_output` inputs to write the diff output to a file and then read that file in subsequent steps.
