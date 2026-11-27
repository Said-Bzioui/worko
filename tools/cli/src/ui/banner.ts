import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import chalk from 'chalk';

const G = gradient(['#6366f1', '#8b5cf6', '#a78bfa']);

export function printCliHeader(subtitle = 'Monorepo CLI') {
  const ascii = figlet.textSync('WORKO', { font: 'Small' });
  console.log('\n' + G(ascii));
  console.log(chalk.dim(`  ${subtitle}\n`));
}

export function printBox(content: string, title = '') {
  console.log(
    boxen(content, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 1, left: 1, right: 0 },
      borderStyle: 'round',
      borderColor: 'magenta',
      ...(title ? { title: chalk.bold.magenta(` ${title} `), titleAlignment: 'center' } : {}),
    }),
  );
}
