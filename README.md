# pr-diff 🧭

A GitHub Action for gathering the `git diff` of a pull request in JSON format

## About 💡

A useful Action for grabbing the `git diff` output of a pull request in a machine readable JSON format. This Action can be used in conjunction with other Actions or tools to perform tasks such as:

- Auditing the changes made in a pull request
- Running subsequent workflows conditionally based on the files, lines, or directories changed in a pull request
- Send out a signal to reviewers when certain files or even specific lines are changed in a pull request

## Turbo Quickstart ⚡

Checkout the example below to see how you can use this Action in your workflow to get the `git diff` of changes made in the context of a pull request

> All references to `vX.X.X` are places holders and you can find the latest version of this Action under the [Releases](https://github.com/GrantBirki/pr-diff/releases) section

```yaml
      # Checkout the repo
      - uses: actions/checkout@v3.0.2
        with:
          fetch-depth: 0 # needed to checkout all branches for this Action to work

      # Check the PR diff using the current branch and the base branch of the PR
      - uses: GrantBirki/pr-diff@vX.X.X
        id: pr-diff

      # Print the diff in JSON format
      - name: echo json diff
        run: echo "${{ steps.pr-diff.outputs.diff }}"

      # Print the diff in raw git format
      - name: echo raw diff
        run: echo "${{ steps.pr-diff.outputs.diff-raw }}"
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
      - uses: GrantBirki/pr-diff@vX.X.X
        id: pr-diff

      # Print the diff in JSON format
      - name: echo json diff
        run: echo "${{ steps.pr-diff.outputs.diff }}"

      # Print the diff in raw git format
      - name: echo raw diff
        run: echo "${{ steps.pr-diff.outputs.diff-raw }}"
```
