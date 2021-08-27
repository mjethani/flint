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

let quietMode = false;
let compactMode = false;

function formatMatch(match, filename, lineNumber, type, message) {
  filename = chalk.grey(filename);
  type = type === 'warning' ? chalk.yellow('WARNING') : chalk.red('ERROR');

  for (let i = 0; i < match.length; i++) {
    let replacement = match[i];
    if (typeof replacement !== 'undefined') {
      message = message.replace(`{${i}}`,
                                /^\s*$/.test(replacement) ?
                                  `'${replacement}'` :
                                  chalk.bold(replacement.trim()));
    }
  }

  return `${filename}:${lineNumber}: ${type}: ${message}`;
}

async function flint(filename) {
  let returnCode = 0;

  let content = await readFile(filename, 'utf8');

  let lineNumber = 1;

  for (let line of content.split('\n')) {
    for (let { pattern, type, message } of rules) {
      if (type === 'off')
        continue;

      let match = pattern.exec(line);
      if (match !== null) {
        if (type === 'error')
          returnCode = 1;

        if (!quietMode) {
          console.log(formatMatch(match, filename, lineNumber, type, message));

          if (!compactMode) {
            console.log();
            console.log(line);
            console.log();
          }
        }
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

function parseArgs(args) {
  let filenames = args.filter(arg => !arg.startsWith('--'));
  let options = args.filter(arg => arg.startsWith('--'));

  return { filenames, options };
}

export async function main() {
  let { filenames, options } = parseArgs(process.argv.slice(2));

  if (options.includes('--version'))
    return printVersion();

  if (options.includes('--no-color'))
    chalk.level = 0;

  if (options.includes('--quiet'))
    quietMode = true;

  if (options.includes('--compact'))
    compactMode = true;

  let exitCode = 0;

  for (let filename of filenames)
    exitCode |= await flint(filename);

  process.exit(exitCode);
}
