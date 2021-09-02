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
import rules from './_common.mjs';

export default rules.concat([
  {
    // Domain names must be IDNA-encoded.
    // https://en.wikipedia.org/wiki/Punycode
    pattern: {
      exec(line) {
        let domains = extractDomains(line) || [];
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
          'csp',
          'rewrite',

          'document',
          'genericblock',
          'elemhide',
          'generichide',

          'domain',
          'third-party', '~third-party',
          'match-case', '~match-case',

          // Experimental
          'header',

          // Aliases
          'css', '~css',
          'frame', '~frame',
          'xhr', '~xhr',
          'doc',
          'ehide',
          'ghide',

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
        let aliases = [
          'css', '~css',
          'frame', '~frame',
          'xhr', '~xhr',
          'doc',
          'ehide',
          'ghide',

          '3p', '~3p',
          '1p', '~1p',

          'first-party', '~first-party',
        ];

        let options = extractOptions(line);
        if (options !== null) {
          for (let [ name ] of options) {
            if (aliases.includes(name.replace(/\s/g, '').toLowerCase()))
              return [ line, name ];
          }
        }

        return null;
      }
    },
    type: 'error',
    message: 'Non-standard alias {1}'
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
]);
