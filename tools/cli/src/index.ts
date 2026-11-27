#!/usr/bin/env node
import { Command } from 'commander';
import { printCliHeader } from './ui/banner.js';
import { registerRoutesCommand }   from './commands/routes.js';
import { registerDatabaseCommand } from './commands/database.js';
import { registerHealthCommand }   from './commands/health.js';

const program = new Command();

program
  .name('worko')
  .description('WORKO monorepo CLI')
  .version('0.0.1')
  .hook('preAction', (thisCommand) => {
    // Print header for every command except --help / --version
    if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
      // Header is printed per-command to keep output clean
    }
  });

registerRoutesCommand(program);
registerDatabaseCommand(program);
registerHealthCommand(program);

// Default: show help with banner
if (process.argv.length <= 2) {
  printCliHeader('Monorepo CLI');
  program.help();
}

program.parse(process.argv);
