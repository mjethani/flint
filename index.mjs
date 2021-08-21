import { readFile } from 'fs/promises';
import { createRequire } from 'module';

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

        console.log(`${filename}:${lineNumber}: ${type === 'warning' ? 'WARNING' : 'ERROR'}: ${message}`);
        console.log();
        console.log(line);
        console.log();
      }
    }

    lineNumber++;
  }

  return returnCode;
}

export async function main() {
  let exitCode = 0;

  for (let filename of process.argv.slice(2))
    exitCode |= await flint(filename);

  process.exit(exitCode);
}
