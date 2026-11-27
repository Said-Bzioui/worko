import Table from 'cli-table3';
import chalk from 'chalk';

export function makeTable(head: string[], colWidths?: number[]): Table.Table {
  return new Table({
    head: head.map(h => chalk.bold.white(h)),
    style: { head: [], border: ['dim'] },
    ...(colWidths ? { colWidths } : {}),
    wordWrap: true,
  });
}

export const METHOD_STYLES: Record<string, (s: string) => string> = {
  Get:     chalk.bgGreen.black,
  Post:    chalk.bgCyan.black,
  Put:     chalk.bgYellow.black,
  Patch:   chalk.bgMagenta.white,
  Delete:  chalk.bgRed.white,
  Options: chalk.bgBlue.white,
  Head:    chalk.bgBlue.white,
  All:     (s: string) => chalk.bgGray(chalk.white(s)),
};

export function styledMethod(method: string): string {
  const fn = METHOD_STYLES[method] ?? chalk.white;
  return fn(` ${method.toUpperCase().padEnd(6)} `);
}
