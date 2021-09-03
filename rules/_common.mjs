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

export function extractPattern(line) {
  line = line.trim();

  if (line === '' || line[0] === '!')
    return null;

  if (/^[^/|@"!]*?#[@?$]?#.+/.test(line))
    return null;

  if (line.startsWith('@@'))
    line = line.substring(2);

  let [ options ] = /\$\s*~?[\s\w-]+(?:=[^,]*)?(?:\s*,\s*~?[\s\w-]+(?:=[^,]*)?)*$/.exec(line) || [];
  if (typeof options !== 'undefined')
    return line.slice(0, -options.length).trim();

  return line;
}

export function extractOptions(line) {
  line = line.trim();

  if (line[0] === '!')
    return null;

  if (/^[^/|@"!]*?#[@?$]?#.+/.test(line))
    return null;

  let [ options ] = /\$\s*~?[\s\w-]+(?:=[^,]*)?(?:\s*,\s*~?[\s\w-]+(?:=[^,]*)?)*$/.exec(line) || [];
  if (typeof options === 'undefined')
    return null;

  let entries = [];

  for (let option of options.substring(1).split(',')) {
    let [ , name, value ] = /^\s*(~?[\s\w-]+)(?:=([^,]*))?/.exec(option);
    entries.push([ name, value ]);
  }

  return entries;
}

export function extractDomains(line) {
  line = line.trim();

  if (line[0] === '!')
    return null;

  // Cosmetic filter domains.
  let [ , domains ] = /^([^/|@"!]*?)#[@?$]?#.+/.exec(line) || [];
  if (typeof domains !== 'undefined')
    return domains !== '' ? domains.split(',') : null;

  // Network filter domains.
  let [ options ] = /\$\s*~?[\s\w-]+(?:=[^,]*)?(?:\s*,\s*~?[\s\w-]+(?:=[^,]*)?)*$/.exec(line) || [];
  if (typeof options !== 'undefined') {
    for (let option of options.substring(1).split(',')) {
      let [ , name, value ] = /^\s*(~?[\s\w-]+)(?:=([^,]*))?/.exec(option);
      if (name.replace(/\s/g, '') === 'domain' && typeof value !== 'undefined')
        return value.split('|');
    }
  }

  return null;
}

export default [
  {
    pattern: /^\s+/,
    type: 'warning',
    message: 'Leading whitespace'
  },
  {
    // Trailing whitespace is OK in comments.
    pattern: /^\s*[^!].*\s+$/,
    type: 'warning',
    message: 'Trailing whitespace'
  },
  {
    pattern: /^\s*[^!\s]\s*$/,
    type: 'error',
    message: 'Single-character filter'
  },
  {
    pattern: /^\s*\*\s*\$/,
    type: 'warning',
    message: 'Redundant sole wildcard'
  },
  {
    pattern: /^\s*\|\s*\$/,
    type: 'warning',
    message: 'Redundant sole anchor'
  },
  {
    // If it looks like a host, it should be surrounded by anchors; otherwise,
    // the interpretation is ambiguous.
    pattern: {
      exec(line) {
        let re = /^\s*([a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d+)?)\s*$/i;
        let urlPattern = extractPattern(line);
        if (urlPattern !== null && re.test(urlPattern))
          return [ line, urlPattern ];

        return null;
      }
    },
    type: 'warning',
    message: 'URL pattern {1} looks like a host'
  },
  {
    pattern: {
      exec(line) {
        let domains = extractDomains(line) || [];
        if (domains.some(domain => /^\s*~?\s*$/.test(domain)))
          return [ line ];

        return null;
      }
    },
    type: 'error',
    message: 'Blank domain'
  },
  {
    pattern: {
      exec(line) {
        let domains = extractDomains(line) || [];
        let domain = domains.find(domain => /\s/.test(domain));
        if (typeof domain !== 'undefined')
          return [ line, domain ];

        return null;
      }
    },
    type: 'error',
    message: 'Domain {1} contains whitespace'
  },
];
