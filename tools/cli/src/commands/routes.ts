import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Command } from 'commander';
import logSymbols from 'log-symbols';
import chalk from 'chalk';
import { makeTable, styledMethod } from '../ui/table.js';
import { printCliHeader } from '../ui/banner.js';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..'); // → worko/
const API_SRC = join(ROOT, 'apps', 'backend_api', 'src');

interface Route { method: string; path: string; handler: string; file: string }

function findControllers(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...findControllers(full));
    else if (entry.endsWith('.controller.ts') && !entry.endsWith('.spec.ts')) results.push(full);
  }
  return results;
}

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
    const after      = src.slice(match.index + match[0].length);
    const hMatch     = after.match(/\n[ \t]+(?:async[ \t]+)?([a-zA-Z_]\w+)[ \t]*\(/);
    const handler    = hMatch ? `${hMatch[1]}()` : '?()';
    const fullPath   = `/api/${hasVersioning ? 'v1/' : ''}${ctrlPrefix ? ctrlPrefix + '/' : ''}${routePath}`
      .replace(/\/+/g, '/').replace(/\/$/, '') || '/api';
    routes.push({ method: httpMethod, path: fullPath, handler, file: filePath });
  }
  return routes;
}

const AUTH_ROUTES: Route[] = [
  { method: 'Post',   path: '/api/v1/auth/sign-up/email',      handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Post',   path: '/api/v1/auth/sign-in/email',      handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Post',   path: '/api/v1/auth/sign-in/social',     handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Post',   path: '/api/v1/auth/sign-out',           handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Get',    path: '/api/v1/auth/session',            handler: 'betterAuth()', file: 'better-auth' },
  { method: 'Get',    path: '/api/v1/auth/callback/:provider', handler: 'betterAuth()', file: 'better-auth' },
];

export function registerRoutesCommand(program: Command) {
  program
    .command('routes')
    .description('List all API routes registered in backend_api')
    .action(() => {
      printCliHeader('Route Explorer');

      const controllers = findControllers(API_SRC);
      const nestRoutes: Route[] = [];
      for (const c of controllers) nestRoutes.push(...parseController(c));

      const all = [...AUTH_ROUTES, ...nestRoutes];

      const table = makeTable(['Method', 'Path', 'Handler', 'Source'], [12, 42, 22, 38]);

      for (const r of all) {
        const src = r.file === 'better-auth'
          ? chalk.dim('Better Auth (Express)')
          : chalk.dim(relative(API_SRC, r.file).replace(/\\/g, '/'));
        table.push([styledMethod(r.method), chalk.cyan(r.path), chalk.yellow(r.handler), src]);
      }

      console.log(table.toString());
      console.log(
        `\n  ${logSymbols.success} ${chalk.bold(String(all.length))} routes total` +
        `  ${chalk.dim('·')}  ${chalk.dim(`${AUTH_ROUTES.length} auth  ·  ${nestRoutes.length} nestjs`)}` +
        `  ${chalk.dim('·')}  ${chalk.dim(`${controllers.length} controller file(s)`)}\n`,
      );
    });
}
