#!/usr/bin/env node

import { Command } from 'commander';
import { infoCommand } from './commands/info.js';
import { restCommand } from './commands/rest.js';

const program = new Command();

program
  .name('yasumu')
  .description('Command Line Interface for Yasumu')
  .version('0.0.0');

program.addCommand(infoCommand);
program.addCommand(restCommand);

program.parse();
