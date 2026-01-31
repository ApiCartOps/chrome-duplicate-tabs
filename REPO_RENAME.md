# Renaming the repository to `jwd-browser-tab-manager`

This repository is ready to be renamed to `jwd-browser-tab-manager`. Renaming the repository is an administrative action that must be performed by a repository owner or someone with repo admin permissions.

Below are safe, step-by-step instructions and an optional script you can run locally to perform the rename using either the GitHub CLI (`gh`) or the REST API (with a token).

---

## Recommended steps (manual via GitHub UI)

1. Go to the repository Settings → General → Repository name.
2. Change the name to `jwd-browser-tab-manager` and confirm.
3. GitHub preserves redirects from the old repo name, but update the following:
   - README clone instructions and any docs that referenced `chrome-duplicate-tabs` (already updated in this repo).
   - CI / automation or third-party services referencing the old repository URL or webhooks.
   - Any release or publishing infrastructure that uses the repo name in paths.

## CLI / API methods

### Using GitHub CLI (`gh`)

Requires: `gh` authenticated and repo admin permissions.

```bash
# Rename using gh (interactive if necessary)
gh repo rename ApiCartOps/chrome-duplicate-tabs --new-name jwd-browser-tab-manager
```

### Using REST API (curl)

Requires: `GITHUB_TOKEN` or `GH_TOKEN` with `repo` scope.

```bash
# Example (replace token):
curl -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/ApiCartOps/chrome-duplicate-tabs \
  -d '{"name":"jwd-browser-tab-manager"}'
```

## After the rename

- Update local clones:
  - `git remote set-url origin git@github.com:ApiCartOps/jwd-browser-tab-manager.git` (or the https equivalent)

- Verify CI and automation pipelines are still working. If workflows reference paths containing the old repo name explicitly, update them.

---

If you want, I can also open an issue in the repo with these instructions (so it shows up in your issue tracker) and/or prepare a PR with any additional references that need updating. Let me know which you prefer.