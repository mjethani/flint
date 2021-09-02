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

import { extractDomains, extractOptions, extractPattern } from './_common.mjs';

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
    // If it looks like a host, it should be surrounded by anchors; otherwise,
    // the interpretation is ambiguous.
    pattern: /^\s*([a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d+)?)\s*$/i,
    type: 'warning',
    message: '{1} looks like a host'
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
  {
    pattern: {
      exec(line) {
        let validOptions = [
          'other', '~other',
          'script', '~script',
          'image', '~image',
          'stylesheet', '~stylesheet',
          'object', '~object',
          'subdocument', '~subdocument',
          'websocket', '~websocket',
          'webrtc', '~webrtc',
          'ping', '~ping',
          'xmlhttprequest', '~xmlhttprequest',
          'media', '~media',
          'font', '~font',

          'popup',
          'popunder',
          'cname',
          'document',
          'inline-script',
          'inline-font',

          'all',

          'csp',
          'empty',
          'mp4',
          'redirect',
          'redirect-rule',
          'removeparam',

          'elemhide',
          'generichide',
          'specifichide',

          'domain',
          'third-party', '~third-party',
          'match-case', '~match-case',

          'strict3p', '~strict3p',
          'strict1p', '~strict1p',

          'denyallow',

          'badfilter',
          'important',

          // Experimental
          'header',

          // Aliases
          'css', '~css',
          'frame', '~frame',
          'xhr', '~xhr',
          'doc',
          'ehide',
          'ghide',
          'shide',

          '3p', '~3p',
          '1p', '~1p',

          'first-party', '~first-party',
        ];

        let options = extractOptions(line);
        if (options !== null) {
          for (let [ name ] of options) {
            if (!validOptions.includes(name.replace(/\s/g, '').toLowerCase()))
              return [ line, name ];
          }
        }

        return null;
      }
    },
    type: 'error',
    message: 'Invalid option {1}'
  },
  {
    pattern: {
      exec(line) {
        let experimentalOptions = [
          'header',
        ];

        let options = extractOptions(line);
        if (options !== null) {
          for (let [ name ] of options) {
            if (experimentalOptions.includes(name.replace(/\s/g, '').toLowerCase()))
              return [ line, name ];
          }
        }

        return null;
      }
    },
    type: 'warning',
    message: 'Option {1} is experimental'
  },
  {
    pattern: {
      exec(line) {
        let options = extractOptions(line);
        if (options !== null) {
          for (let [ name ] of options) {
            name = name.replace(/\s/g, '');
            if (name !== name.toLowerCase())
              return [ line, name ];
          }
        }

        return null;
      }
    },
    type: 'warning',
    message: 'Mixed-case option {1}'
  },
  {
    pattern: {
      exec(line) {
        let options = extractOptions(line);
        if (options !== null) {
          for (let [ name ] of options) {
            if (/\s/.test(name))
              return [ line, name ];
          }
        }

        return null;
      }
    },
    type: 'error',
    message: 'Option {1} contains whitespace'
  },
  {
    pattern: {
      exec(line) {
        let urlPattern = extractPattern(line);
        if (urlPattern !== null && /\s/.test(urlPattern))
          return [ line, urlPattern ];

        return null;
      }
    },
    type: 'error',
    message: 'URL pattern {1} contains whitespace'
  },
];
