# git-diff 🧭

A GitHub Action for gathering the `git diff` of a pull request in JSON format

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
      - uses: actions/checkout@v3.0.2
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/git-diff@vX.X.X
        id: git-diff

      # Print the diff in JSON format
      - name: echo json diff
        run: echo "${{ steps.git-diff.outputs.json-diff }}"

      # Print the diff in raw git format
      - name: echo raw diff
        run: echo "${{ steps.git-diff.outputs.raw-diff }}"
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
      - uses: actions/checkout@v3.0.2
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/git-diff@vX.X.X
        id: git-diff

      # Print the diff in JSON format
      - name: echo json diff
        run: echo "${{ steps.git-diff.outputs.json-diff }}"

      # Print the diff in raw git format
      - name: echo raw diff
        run: echo "${{ steps.git-diff.outputs.raw-diff }}"
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

## Inputs 📥

| Input | Required? | Default | Description |
| ----- | --------- | ------- | ----------- |
| base_branch | yes | `${{ github.event.pull_request.base.sha }}` | The "base" or "target" branch to use for the git diff |

## Outputs 📤

| Output | Description |
| ------ | ----------- |
| json-diff | The `git diff` of the pull request in JSON format |
| raw-diff | The raw `git diff` of the pull request |
