# Changesets

This directory stores pending changesets created by contributors via `pnpm changeset`.

Each `.md` file in this directory describes a pending change to one or more packages.
They are consumed and deleted during `pnpm version-packages` to bump versions and update changelogs.

Do not edit these files manually unless you know exactly what you are doing.

## Quick Reference

```bash
# Describe a change to a package
pnpm changeset

# Apply all pending changesets (bumps versions, updates changelogs)
pnpm version-packages

# Build all SDKs before publishing
pnpm release:build

# Publish to GitHub Packages
pnpm release
```
