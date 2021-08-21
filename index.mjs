/*
 * Copyright (C) 2021 Manish Jethani
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { readFile } from 'fs/promises';
import { createRequire } from 'module';

import chalk from 'chalk';

import rules from './rules.mjs';

async function flint(filename) {
  let returnCode = 0;

  let content = await readFile(filename, 'utf8');

  let lineNumber = 1;

  for (let line of content.split('\n')) {
    for (let { pattern, type, message } of rules) {
      let re = new RegExp(pattern);
      let match = re.exec(line);
      if (match !== null) {
        if (type === 'error')
          returnCode = 1;

        console.log(`${chalk.grey(filename)}:${lineNumber}: ${type === 'warning' ? chalk.yellow('WARNING') : chalk.red('ERROR')}: ${chalk.bold(message)}`);
        console.log();
        console.log(line);
        console.log();
      }
    }

    lineNumber++;
  }

  return returnCode;
}

function printVersion() {
  let { version } = createRequire(import.meta.url)('./package.json');

  console.log(`v${version}`);
}

export async function main() {
  if (process.argv[2] === '--version')
    return printVersion();

  let exitCode = 0;

  for (let filename of process.argv.slice(2))
    exitCode |= await flint(filename);

  process.exit(exitCode);
}
