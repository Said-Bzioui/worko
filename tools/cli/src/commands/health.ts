import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import { makeTable } from '../ui/table.js';
import { printCliHeader } from '../ui/banner.js';

interface ServiceCheck {
  name: string;
  url: string;
  label: string;
}

const SERVICES: ServiceCheck[] = [
  { name: 'API',    url: 'http://localhost:3000/api/v1/health', label: 'NestJS API' },
  { name: 'Docs',  url: 'http://localhost:3000/docs-json',     label: 'Swagger Docs' },
];

async function checkHttp(url: string): Promise<{ ok: boolean; status?: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, status: res.status, ms: Date.now() - start };
  } catch {
    return { ok: false, ms: Date.now() - start };
  }
}

export function registerHealthCommand(program: Command) {
  program
    .command('health')
    .description('Check health of all WORKO services')
    .action(async () => {
      printCliHeader('Health Check');

      const spinner = ora('Checking services…').start();
      const results = await Promise.all(
        SERVICES.map(async (svc) => ({ ...svc, ...(await checkHttp(svc.url)) })),
      );
      spinner.stop();

      const table = makeTable(['Service', 'Status', 'HTTP', 'Latency'], [16, 12, 8, 12]);

      for (const r of results) {
        const status = r.ok
          ? `${logSymbols.success} ${chalk.green('UP')}`
          : `${logSymbols.error} ${chalk.red('DOWN')}`;
        const http = r.status ? String(r.status) : chalk.dim('—');
        const ms   = r.ok ? chalk.green(`${r.ms}ms`) : chalk.red(`${r.ms}ms`);
        table.push([chalk.white(r.label), status, http, ms]);
      }

      console.log(table.toString());

      const allUp = results.every(r => r.ok);
      console.log(
        allUp
          ? `\n  ${logSymbols.success} ${chalk.green.bold('All services are up')}\n`
          : `\n  ${logSymbols.warning} ${chalk.yellow.bold('Some services are down')}\n`,
      );

      if (!allUp) process.exit(1);
    });
}
