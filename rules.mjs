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

function parseCosmeticFilterDomains(line) {
  line = line.trim();

  if (line[0] === '!')
    return null;

  let [ , domains ] = /^([^/|@"!]*?)#[@?$]?#.+/.exec(line) || [];
  if (typeof domains === 'undefined' || domains === '')
    return null;

  return domains.split(',');
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
    pattern: /^\s*\*/,
    type: 'warning',
    message: 'Leading asterisk'
  },
  {
    pattern: /^\s*[^!\s]\s*$/,
    type: 'error',
    message: 'Single-character filter'
  },
  {
    // If it looks like a host, it should be surrounded by anchors; otherwise,
    // the interpretation is ambiguous.
    pattern: /^\s*([a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d+)?)\s*$/i,
    type: 'error',
    message: '{1} looks like a host'
  },
  {
    pattern: {
      exec(line) {
        let domains = parseCosmeticFilterDomains(line) || [];
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
        let domains = parseCosmeticFilterDomains(line) || [];
        let domain = domains.find(domain => /\s/.test(domain));
        if (typeof domain !== 'undefined')
          return [ line, domain ];

        return null;
      }
    },
    type: 'error',
    message: 'Domain {1} contains whitespace'
  },
  {
    // Domain names must be IDNA-encoded.
    // https://en.wikipedia.org/wiki/Punycode
    pattern: {
      exec(line) {
        let domains = parseCosmeticFilterDomains(line) || [];
        for (let domain of domains) {
          let actualDomain = domain.trim().replace(/^~/, '');
          let [ , character ] = /([^a-z0-9.\s-])/iu.exec(actualDomain) || [];
          if (typeof character !== 'undefined')
            return [ line, domain, character ];
        }

        return null;
      }
    },
    type: 'error',
    message: 'Domain {1} contains non-hostname character {2}'
  },
];
