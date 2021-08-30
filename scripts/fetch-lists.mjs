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

import fs from 'fs';
import http from 'http';
import https from 'https';

import { createRequire } from 'module';

let require = createRequire(import.meta.url);
let subscriptions = require('adblockpluscore/data/subscriptions.json');

function read(message) {
  return new Promise(resolve => {
    let content = '';

    message.setEncoding('utf8');

    message.on('data', chunk => {
      content += chunk;
    });

    message.on('end', () => {
      resolve(content);
    });
  });
}

function download(url) {
  return new Promise((resolve, reject) => {
    let { get } = url.startsWith('https://') ? https : http;
    get(url, message => {
      if (message.statusCode !== 200)
        reject(new Error(`Download failed for ${url} with HTTP status code ${message.statusCode}.`));
      else
        resolve(read(message));
    })
    .on('error', reject);
  });
}

(async function () {
  let directory = new URL('../lists', import.meta.url);

  if (fs.existsSync(directory)) {
    if (process.argv[2] !== '--force') {
      console.log('Already fetched. Use --force to fetch again.');
      return;
    }

    fs.rmdirSync(directory, { recursive: true, force: true });
  }

  fs.mkdirSync(directory, { recursive: true });

  for (let { url } of subscriptions) {
    console.log(`Downloading ${url}`);

    try {
      fs.writeFileSync(new URL(`${url.replace(/.*\/([^/]+)$/, '$1')}`, `${directory}/`),
                       await download(url));
    } catch (error) {
      console.error(error);
    }
  }
})();
