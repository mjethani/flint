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

let lists = {
  adblockplus: require('adblockpluscore/data/subscriptions.json').map(({ url }) => url),
  ublockorigin: [
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters-2020.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters-2021.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/legacy.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt',
  ],
};

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

async function downloadLists(profile, directory) {
  let urls = lists[profile];

  fs.mkdirSync(new URL(profile, `${directory}/`), { recursive: true });

  let filenames = process.argv.slice(2).filter(arg => !arg.startsWith('--'));

  for (let url of urls) {
    let filename = url.replace(/.*\/([^/]+)$/, '$1');

    if (filenames.length > 0 && !filenames.includes(filename))
      continue;

    console.log(`Downloading ${url}`);

    try {
      fs.writeFileSync(new URL(`${filename}`, `${directory}/${profile}/`),
                       await download(url));
    } catch (error) {
      console.error(error);
    }
  }
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

  await downloadLists('adblockplus', directory);
  await downloadLists('ublockorigin', directory);
})();
