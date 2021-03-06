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

let green = chalk.green;
let blue = chalk.blue;
let yellow = chalk.yellow;
let red = chalk.red;
let grey = chalk.grey;
let bold = chalk.bold;

let quietMode = false;
let compactMode = false;
let errorsOnlyMode = false;

let rules = null;

function formatMatch(match, filename, lineNumber, type, message) {
  filename = grey(filename);
  type = type === 'warning' ? yellow('WARNING') : red('ERROR');

  for (let i = 0; i < match.length; i++) {
    let replacement = match[i];
    if (typeof replacement !== 'undefined') {
      message = message.replace(`{${i}}`,
                                /^\s*$/.test(replacement) ?
                                  `'${replacement}'` :
                                  bold(replacement.trim()));
    }
  }

  return `${filename}:${lineNumber}: ${type}: ${message}`;
}

async function flint(filename) {
  let returnCode = 0;

  let content = await readFile(filename, 'utf8');

  content = content.replace(/^\[Adblock Plus \d+\.\d+\]\r?\n/, '');

  let lineNumber = 1;

  let effectiveRules = rules.filter(({ type }) => type === 'only');
  if (effectiveRules.length === 0)
    effectiveRules = rules;

  for (let line of content.split(/\r?\n/g)) {
    for (let { pattern, type, message } of effectiveRules) {
      if (type === 'off' || (errorsOnlyMode && type !== 'error'))
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

function openHTML({ cliOptions = [] } = {}) {
  let { version } = createRequire(import.meta.url)('./package.json');

  let h = ([ b, a ], r) => `${b}${r.replace(/&/g, '&amp;').replace(/</g, '&lt;')}${a}`;

  green = s => h`<span style="color: green">${s}</span>`;
  blue = s => h`<span style="color: blue">${s}</span>`;
  yellow = s => h`<span style="color: yellow">${s}</span>`;
  red = s => h`<span style="color: red">${s}</span>`;
  grey = s => h`<span style="color: grey">${s}</span>`;
  bold = s => h`<b>${s}</b>`;

  let date = new Date();

  date.setMilliseconds(0);
  date.setSeconds(0);

  console.log('<!DOCTYPE html>');
  console.log('<html>');
  console.log(' <head>');
  console.log('  <meta charset="utf-8">');
  console.log('  <title>flint report</title>');
  console.log(`  <meta name="generator" content="flint v${version}">`);
  console.log('  <meta name="robots" content="noindex">');

  let canonicalURLOption = cliOptions.find(option => option.startsWith('--canonical-url='));
  if (typeof canonicalURLOption !== 'undefined') {
    let [ , canonicalURL ] = canonicalURLOption.split('=');

    console.log(`  <link rel="canonical" href="${canonicalURL}">`);
  }

  console.log(' </head>');
  console.log(' <body style="background: #232323; color: white; font-size: 150%; font-family: sans-serif; margin: 2em">');
  console.log(`  <time style="color: grey" datetime="${date.toISOString()}">${date.toUTCString()}</time>`);
  console.log('  <h1>flint report</h1>');
  console.log('  <pre>');
}

function closeHTML() {
  console.log('  </pre>');
  console.log(' </body>');
  console.log('</html>');
  console.log('<!-- All your base are belong to us. -->');
}

function printVersion() {
  let { version } = createRequire(import.meta.url)('./package.json');

  console.log(`v${version}`);
}

async function printHelp() {
  console.log(await readFile(new URL('help.txt', import.meta.url), 'utf8'));
}

function printRules() {
  for (let { pattern, type, message } of rules) {
    pattern = pattern instanceof RegExp ?
                green('expression') :
                blue('function');
    type = type === 'warning' ?
             yellow('warning') :
             type === 'off' ?
               grey('off') :
               red('error');

    console.log(`${pattern}\t${type}\t${message}`);
  }
}

async function loadRules(compat) {
  if (compat === null)
    compat = 'default';

  if (![ 'default', 'ublock' ].includes(compat)) {
    console.error(`Error: Unknown compatibility mode '${compat}'`);
    console.error();
    console.error('See --help');
    console.error();

    process.exit(1);
  }

  rules = (await import(`./rules/${compat}.mjs`)).default;
}

function getCompat(options) {
  let compatOption = options.find(option => option.startsWith('--compat='));
  if (typeof compatOption !== 'undefined') {
    let [ , value ] = compatOption.split('=');
    return value;
  }

  return null;
}

function parseArgs(args) {
  let filenames = args.filter(arg => !arg.startsWith('--'));
  let options = args.filter(arg => arg.startsWith('--'));

  return { filenames, options };
}

export async function main() {
  let { filenames, options } = parseArgs(process.argv.slice(2));

  if (options.includes('--no-color'))
    chalk.level = 0;

  if (options.includes('--quiet'))
    quietMode = true;

  if (options.includes('--compact'))
    compactMode = true;

  if (options.includes('--errors-only'))
    errorsOnlyMode = true;

  if (options.includes('--version'))
    return printVersion();

  if (options.includes('--help'))
    return printHelp();

  await loadRules(getCompat(options));

  if (options.includes('--list-rules'))
    return printRules();

  let exitCode = 0;

  if (options.includes('--html'))
    openHTML({ cliOptions: options });

  for (let filename of filenames)
    exitCode |= await flint(filename);

  if (options.includes('--html'))
    closeHTML();

  if (options.includes('--zero-errors'))
    exitCode = 0;

  process.exit(exitCode);
}
