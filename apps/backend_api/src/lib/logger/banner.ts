import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import chalk from 'chalk';
import logSymbols from 'log-symbols';

const WORKO_GRADIENT = gradient(['#6366f1', '#8b5cf6', '#a78bfa']);

/** Full coloured banner — development only */
function printDevBanner(port: number | string, env: string): void {
  const ascii = figlet.textSync('WORKO', { font: 'Big' });
  console.log('\n' + WORKO_GRADIENT(ascii));

  const rows = [
    `${chalk.dim('Environment')}   ${envBadge(env)}`,
    `${chalk.dim('Port')}          ${chalk.bold.cyan(String(port))}`,
    `${chalk.dim('API')}           ${chalk.underline.cyan(`http://localhost:${port}/api/v1`)}`,
    `${chalk.dim('Docs')}          ${chalk.underline.cyan(`http://localhost:${port}/docs`)}`,
    `${chalk.dim('Auth')}          ${chalk.underline.cyan(`http://localhost:${port}/api/v1/auth`)}`,
  ].join('\n');

  console.log(
    boxen(rows, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin:  { top: 0, bottom: 1, left: 1, right: 0 },
      borderStyle: 'round',
      borderColor: 'magenta',
      title: chalk.bold.magenta(' Worko API '),
      titleAlignment: 'center',
    }),
  );

  console.log(`  ${logSymbols.success} ${chalk.green.bold('Server is running')}  ${chalk.dim('Press Ctrl+C to stop')}\n`);
}

/** Minimal plain-text banner — production safe (no ANSI, no secrets) */
function printProdBanner(port: number | string): void {
  console.log(`{"event":"server_started","port":${port},"ts":"${new Date().toISOString()}"}`);
}

/** Entry point — auto-selects dev vs prod */
export function printBanner(port: number | string, env: string): void {
  if (env === 'production') {
    printProdBanner(port);
  } else {
    printDevBanner(port, env);
  }
}

function envBadge(env: string): string {
  if (env === 'production') return chalk.bgRed.white.bold(` ${env.toUpperCase()} `);
  if (env === 'test')       return chalk.bgYellow.black.bold(` ${env.toUpperCase()} `);
  return chalk.bgGreen.black.bold(` ${env.toUpperCase()} `);
}
