#!/usr/bin/env node
/**
 * scripts/publish-sdks.mjs
 *
 * Safe, idempotent publishing script for WORKO SDKs to GitHub Packages.
 *
 * Usage: node scripts/publish-sdks.mjs
 *
 * Rules:
 *   - Checks whether each version already exists on the registry before publishing.
 *   - Skips packages that are already published at the current version.
 *   - Never overwrites an existing version.
 *   - Reports success/skip/failure per package.
 *   - Exits with code 1 only if a publish FAILED (not if skipped).
 *   - Never logs the GITHUB_TOKEN.
 */

import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SDKS = [
  join(ROOT, 'packages', 'database'),
  join(ROOT, 'packages', 'auth-sdk'),
];
const REGISTRY = 'https://npm.pkg.github.com';
const token = process.env.GITHUB_TOKEN || process.env.NODE_AUTH_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN (or NODE_AUTH_TOKEN) is required to publish to GitHub Packages.');
  process.exit(1);
}

function run(cmd, opts = {}) {
  const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
  return (output ?? '').toString().trim();
}

function isAlreadyPublished(name, version) {
  try {
    const result = run(
      `npm view "${name}@${version}" version --registry ${REGISTRY}`,
      { env: { ...process.env } },
    );
    return result.trim() === version;
  } catch {
    return false;
  }
}

let anyFailed = false;
const verifiedPackages = [];

for (const pkgDir of SDKS) {
  const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  const { name, version } = manifest;
  const publishedName = manifest.publishConfig?.name || name;

  process.stdout.write(`\n📦 ${name}@${version}\n`);

  if (isAlreadyPublished(publishedName, version)) {
    console.log(`  ⏭  Already published — skipping.`);
    verifiedPackages.push({ name, version });
    continue;
  }

  try {
    run('pnpm publish --no-git-checks --access restricted', {
      cwd: pkgDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_AUTH_TOKEN: token,
        GITHUB_TOKEN: token,
      },
    });
    console.log(`  ✅ Published successfully as ${publishedName}@${version}.`);

    // Verify publication
    const published = isAlreadyPublished(publishedName, version);
    if (!published) {
      console.error(`  ❌ Verification failed: ${publishedName}@${version} not found after publish.`);
      anyFailed = true;
    } else {
      console.log(`  ✓  Verified on registry.`);
      verifiedPackages.push({ name, version });
    }
  } catch (err) {
    console.error(`  ❌ Failed to publish ${publishedName}@${version}: ${err.message}`);
    anyFailed = true;
  }
}

if (anyFailed) {
  console.error('\n❌ One or more packages failed to publish.');
  process.exit(1);
} else {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `publishedPackages=${JSON.stringify(verifiedPackages)}\n`,
    );
  }
  console.log('\n✅ All packages published (or already up-to-date).');
}
