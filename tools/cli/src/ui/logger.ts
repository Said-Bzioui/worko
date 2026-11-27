import chalk from 'chalk';
import logSymbols from 'log-symbols';

const isDev = process.env.NODE_ENV !== 'production';

type Level = 'info' | 'success' | 'warn' | 'error' | 'debug';

const CFG: Record<Level, { sym: string; color: (s: string) => string }> = {
  info:    { sym: logSymbols.info,    color: chalk.cyan },
  success: { sym: logSymbols.success, color: chalk.green },
  warn:    { sym: logSymbols.warning, color: chalk.yellow },
  error:   { sym: logSymbols.error,   color: chalk.red },
  debug:   { sym: '◆',               color: chalk.magenta },
};

function print(level: Level, msg: string) {
  const { sym, color } = CFG[level];
  console.log(`${sym} ${color(msg)}`);
}

export const cliLogger = {
  info:    (msg: string) => print('info', msg),
  success: (msg: string) => print('success', msg),
  warn:    (msg: string) => print('warn', msg),
  error:   (msg: string) => print('error', msg),
  debug:   (msg: string) => { if (isDev) print('debug', msg); },
  blank:   ()            => console.log(),
  dim:     (msg: string) => console.log(chalk.dim(msg)),
  separator: (label = '') => {
    const line = chalk.dim('─'.repeat(44));
    console.log(label ? `\n${line} ${chalk.bold(label)} ${line}\n` : line);
  },
};
