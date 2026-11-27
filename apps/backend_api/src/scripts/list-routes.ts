/**
 * list-routes.ts — CLI Route Explorer
 * Run: pnpm routes:list
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import chalk from 'chalk';
import Table from 'cli-table3';
import logSymbols from 'log-symbols';
import gradient from 'gradient-string';

const SRC = join(process.cwd(), 'src');

// ── Dev-only guard ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  console.error('routes:list is disabled in production.');
  process.exit(1);
}

const METHOD_STYLES: Record<string, (s: string) => string> = {
  Get:     chalk.bgGreen.black,
  Post:    chalk.bgCyan.black,
  Put:     chalk.bgYellow.black,
  Patch:   chalk.bgMagenta.white,
  Delete:  chalk.bgRed.white,
  Options: chalk.bgBlue.white,
  Head:    chalk.bgBlue.white,
  All:     chalk.bgGray.white,
};

function styledMethod(method: string): string {
  const fn = METHOD_STYLES[method] ?? chalk.white;
  return fn(` ${method.toUpperCase().padEnd(6)} `);
}

function findControllers(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...findControllers(full));
    else if (entry.endsWith('.controller.ts') && !entry.endsWith('.spec.ts')) results.push(full);
  }
  return results;
}

interface Route { method: string; path: string; handler: string; file: string }

function parseController(filePath: string): Route[] {
  const src = readFileSync(filePath, 'utf8');
  const ctrlMatch = src.match(/@Controller\((?:'([^']*)'|"([^"]*)")?/);
  const ctrlPrefix = ctrlMatch ? (ctrlMatch[1] ?? ctrlMatch[2] ?? '') : '';
  const hasVersioning = /@Version\(/.test(src);

  const methodRegex = /@(Get|Post|Put|Patch|Delete|Options|Head|All)\((?:'([^']*)'|"([^"]*)")?\)/g;
  const routes: Route[] = [];
  let match: RegExpExecArray | null;

  while ((match = methodRegex.exec(src)) !== null) {
    const httpMethod = match[1]!;
    const routePath  = match[2] ?? match[3] ?? '';
    const after = src.slice(match.index + match[0].length);
    const hMatch = after.match(/\n[ \t]+(?:async[ \t]+)?([a-zA-Z_]\w+)[ \t]*\(/);
    const handler = hMatch ? `${hMatch[1]}()` : '?()';
    const fullPath = `/api/${hasVersioning ? 'v1/' : ''}${ctrlPrefix ? ctrlPrefix + '/' : ''}${routePath}`
      .replace(/\/+/g, '/').replace(/\/$/, '') || '/api';
    routes.push({ method: httpMethod, path: fullPath, handler, file: filePath });
  }
  return routes;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const controllers = findControllers(SRC);
const nestRoutes: Route[] = [];
for (const c of controllers) nestRoutes.push(...parseController(c));

const authRoutes: Route[] = [
  { method: 'Post',   path: '/api/v1/auth/sign-up/email',    handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Post',   path: '/api/v1/auth/sign-in/email',    handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Post',   path: '/api/v1/auth/sign-in/social',   handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Post',   path: '/api/v1/auth/sign-out',         handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Get',    path: '/api/v1/auth/session',          handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Get',    path: '/api/v1/auth/callback/:provider', handler: 'betterAuth()', file: 'better-auth' },
];

const allRoutes = [...authRoutes, ...nestRoutes];

// ── Header ────────────────────────────────────────────────────────────────
console.log('\n' + gradient(['#6366f1', '#a78bfa'])('  ══════════════════════════════════════'));
console.log(gradient(['#6366f1', '#a78bfa'])(`  ◈  WORKO API — Route Explorer`));
console.log(gradient(['#6366f1', '#a78bfa'])('  ══════════════════════════════════════') + '\n');

// ── Table ─────────────────────────────────────────────────────────────────
const table = new Table({
  head: [
    chalk.bold.white('Method'),
    chalk.bold.white('Path'),
    chalk.bold.white('Handler'),
    chalk.bold.white('Source'),
  ],
  style: { head: [], border: ['dim'] },
  colWidths: [12, 45, 20, 40],
  wordWrap: true,
});

for (const r of allRoutes) {
  const src = r.file === 'better-auth'
    ? chalk.dim('better-auth (Express)')
    : chalk.dim(relative(SRC, r.file).replace(/\\/g, '/'));
  table.push([styledMethod(r.method), chalk.cyan(r.path), chalk.yellow(r.handler), src]);
}

console.log(table.toString());

// ── Summary ───────────────────────────────────────────────────────────────
console.log(
  `\n  ${logSymbols.success} ${chalk.bold(String(allRoutes.length))} routes total` +
  `  ${chalk.dim('·')}  ${chalk.dim(`${authRoutes.length} auth  ·  ${nestRoutes.length} nestjs`)}` +
  `  ${chalk.dim('·')}  ${chalk.dim(`${controllers.length} controller file(s)`)}\n`
);
