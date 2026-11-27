import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { Command } from 'commander';
import ora from 'ora';
import { cliLogger } from '../ui/logger.js';

const ROOT    = join(import.meta.dirname, '..', '..', '..', '..');
const DB_DIR  = join(ROOT, 'packages', 'database');
const PNPM    = process.platform === 'win32'
  ? join(process.env['APPDATA'] ?? '', 'npm', 'pnpm.cmd')
  : 'pnpm';

function runPrisma(args: string[], cwd = DB_DIR): boolean {
  const result = spawnSync(PNPM, ['exec', 'prisma', ...args], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  return result.status === 0;
}

export function registerDatabaseCommand(program: Command) {
  const db = program
    .command('db')
    .description('Database management commands (Prisma)');

  db.command('migrate [name]')
    .description('Run prisma migrate dev')
    .action((name?: string) => {
      const args = ['migrate', 'dev', '--name', name ?? 'migration'];
      const spinner = ora('Running Prisma migration…').start();
      const ok = runPrisma(args);
      if (ok) {
        spinner.succeed('Migration applied successfully');
      } else {
        spinner.fail('Migration failed');
        process.exit(1);
      }
    });

  db.command('deploy')
    .description('Apply pending migrations (production)')
    .action(() => {
      const spinner = ora('Deploying migrations…').start();
      const ok = runPrisma(['migrate', 'deploy']);
      ok ? spinner.succeed('Migrations deployed') : (spinner.fail('Deploy failed'), process.exit(1));
    });

  db.command('push')
    .description('Push schema changes without migration file (prisma db push)')
    .action(() => {
      const spinner = ora('Pushing schema…').start();
      const ok = runPrisma(['db', 'push']);
      ok ? spinner.succeed('Schema pushed') : (spinner.fail('Push failed'), process.exit(1));
    });

  db.command('seed')
    .description('Run prisma seed (packages/database/prisma/seed.ts)')
    .action(() => {
      cliLogger.info('Running seed…');
      const ok = runPrisma(['db', 'seed']);
      ok ? cliLogger.success('Seed completed') : (cliLogger.error('Seed failed'), process.exit(1));
    });

  db.command('studio')
    .description('Open Prisma Studio')
    .action(() => {
      cliLogger.info('Opening Prisma Studio…');
      runPrisma(['studio']);
    });

  db.command('generate')
    .description('Regenerate Prisma client')
    .action(() => {
      const spinner = ora('Generating Prisma client…').start();
      const ok = runPrisma(['generate']);
      ok ? spinner.succeed('Client generated') : (spinner.fail('Generate failed'), process.exit(1));
    });
}
