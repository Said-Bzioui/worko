import { Injectable, LoggerService } from '@nestjs/common';
import chalk from 'chalk';
import logSymbols from 'log-symbols';

type WorkoLogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';

interface LevelConfig {
  label: string;
  /** Color fn used only in dev */
  color: (s: string) => string;
  symbol: string;
  /** Plain label for production JSON lines */
  plain: string;
}

const LEVEL_CONFIG: Record<WorkoLogLevel, LevelConfig> = {
  log:     { label: 'INFO ', plain: 'INFO',    color: chalk.cyan,          symbol: logSymbols.info },
  verbose: { label: 'VERB ', plain: 'VERBOSE', color: chalk.blue,          symbol: '○' },
  debug:   { label: 'DEBUG', plain: 'DEBUG',   color: chalk.magenta,       symbol: '◆' },
  warn:    { label: 'WARN ', plain: 'WARN',    color: chalk.yellow,        symbol: logSymbols.warning },
  error:   { label: 'ERROR', plain: 'ERROR',   color: chalk.red,           symbol: logSymbols.error },
  fatal:   { label: 'FATAL', plain: 'FATAL',   color: (s) => chalk.bgRed.white(s), symbol: '✖' },
};

@Injectable()
export class WorkoLoggerService implements LoggerService {
  readonly isDev: boolean = process.env.NODE_ENV !== 'production';

  // ── Dev formatter (coloured) ──────────────────────────────────────────────
  private devFormat(level: WorkoLogLevel, message: unknown, context?: string): string {
    const cfg  = LEVEL_CONFIG[level];
    const time = chalk.dim(new Date().toLocaleTimeString('en-GB'));
    const lvl  = cfg.color(`[${cfg.label}]`);
    const ctx  = context ? chalk.dim(` [${context}]`) : '';
    const msg  = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    return `${time} ${cfg.symbol} ${lvl}${ctx} ${msg}`;
  }

  // ── Production formatter (plain JSON — pipe-friendly) ─────────────────────
  private prodFormat(level: WorkoLogLevel, message: unknown, context?: string): string {
    return JSON.stringify({
      ts:      new Date().toISOString(),
      level:   LEVEL_CONFIG[level].plain,
      context: context ?? 'App',
      message: typeof message === 'string' ? message : message,
    });
  }

  private write(
    level: WorkoLogLevel,
    output: 'log' | 'error' | 'warn' | 'debug',
    message: unknown,
    context?: string,
  ) {
    const line = this.isDev
      ? this.devFormat(level, message, context)
      : this.prodFormat(level, message, context);
    console[output](line);
  }

  // ── LoggerService interface ───────────────────────────────────────────────

  log(message: unknown, context?: string): void {
    this.write('log', 'log', message, context);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', 'warn', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', 'error', message, context);

    if (trace) {
      // Always log stack trace — redact nothing, but keep it dim in dev
      this.isDev
        ? console.error(chalk.dim(trace))
        : console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'ERROR', trace }));
    }
  }

  debug(message: unknown, context?: string): void {
    // Skip debug in production
    if (!this.isDev) return;
    this.write('debug', 'debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    // Skip verbose in production
    if (!this.isDev) return;
    this.write('verbose', 'log', message, context);
  }

  fatal(message: unknown, context?: string): void {
    this.write('fatal', 'error', message, context);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /** Print a visual separator (dev only) */
  separator(label = ''): void {
    if (!this.isDev) return;
    const line = chalk.dim('─'.repeat(48));
    console.log(label ? `${line} ${chalk.bold(label)} ${line}` : line);
  }
}
