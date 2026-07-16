#!/usr/bin/env node

import { runCli } from './cli.js';

void runCli().then((exitCode) => {
  process.exitCode = exitCode;
});
