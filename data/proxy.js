import cond from 'lodash/cond';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import matches from 'lodash/matches';
import constant from 'lodash/constant';
import stubTrue from 'lodash/stubTrue';
import mergeWith from 'lodash/mergeWith';

const DOUBLE_SLASH = /\/\//g;
const LEADING_SLASHES = /^\/+/;

const merge = (lhs, rhs) => mergeWith(lhs, rhs, arrayConcat);

function arrayConcat(lhs, rhs) {
    if (isArray(lhs)) {
        return lhs.concat(rhs);
    }
}

/**
 * @ignore
 * @this {ProxyRule}
 */
function patternMatches([key, pattern]) {
    return new RegExp(pattern, 'i').test(this[key]);
}

/**
 * @ignore
 * @this {ProxyRule}
 */
function ruleMatches(rule) {
    const { match = {} } = rule;
    return Object.entries(match).every(patternMatches, this);
}

function withoutMatchObject(rule) {
    return omit(rule, 'match');
}

const equals = rhs => lhs => lhs === rhs;
const suffix = after => value => `${value}${after}`;
const prefix = before => value => `${before}${value}`;

const format = {
    protocol: cond([
        [matches('file'), constant('file:///')],
        [isEmpty, constant('//')],
        [stubTrue, suffix('://')]
    ]),
    port: cond([
        [equals(80), constant('')],
        [isNumber, prefix(':')],
        [stubTrue, constant('')]
    ]),
    path: cond([
        [isEmpty, constant('')],
        [stubTrue, prefix('/')]
    ])
};

/**
 * Represents a single rule in a proxy instance. A Proxy rule looks like a normal Request
 * object with an additional property `match` that specifies the property values on a Request
 * instance that must match in order for the rule to be applied.
 *
 * @global
 * @typedef {{}} ProxyRule
 * @alias ProxyRule
 * @mixes Request
 * @property {string} [protocol] 'http', 'https', 'file', etc.
 * @property {string} [host] 'myapps.myserver.com', 'localhost', etc.
 * @property {number} [port] 80, 8080, etc.
 * @property {Object.<string, string>} match One or more keys in a request object whose values must match
 * the given regular expression patterns. E.g.: `{base: 'cdn'}` or `{base: 'myapp', path: 'load.+'}`
 */

/**
 * The Proxy provides an intercept layer based on build- and run-time configurations to enable
 * easier local development, impersonation, dynamic endpoints, static data redirects, and user-
 * and environment-specific versioning.
 *
 * @interface Proxy
 */

/**
* Creates a new proxy instance.
*
* @function module:data.createProxy
* @returns {Proxy} A Proxy instance.
* @example
* import {createProxy} from '@paychex/data'
* import rules from '~/config/proxy'
* export const proxy = createProxy();
* proxy.use(rules);
*/
export function createProxy() {

    const config = [];

    return /** @lends Proxy.prototype */ {

        /**
         * Uses the current proxy rules to construct a URL based on the given arguments.
         *
         * @param {string} base A base value, e.g. 'cdn' or 'myapp'.
         * @param {...string} paths One or more URL paths to combine into the final URL.
         * @returns {string} A URL with the appropriate protocol, host, port, and paths
         * given the currently configured proxy rules.
         * @example
         * import { proxy } from '~/path/to/data';
         * import { tokenize } from '@paychex/core/data';
         *
         * proxy.use({
         *   port: 8118,
         *   protocol: 'https',
         *   host: 'images.myserver.com',
         *   match: {
         *     base: 'images'
         *   }
         * });
         *
         * ```html
         *   <img src="{{ getImageURL('avatars', 'e13d429a') }}" alt="" />
         *   <!-- https://images.myserver.com:8118/avatars/e13d429a -->
         * ```
         * export function getImageURL(bucket, id) {
         *   return proxy.url('images', bucket, id);
         * }
         */
        url(base, ...paths) {
            const path = Array.prototype.concat.apply([], paths)
                .join('/')
                .replace(DOUBLE_SLASH, '/')
                .replace(LEADING_SLASHES, '');
            const { protocol = '', host = base, port = 80 } = config
                .filter(ruleMatches, { base, path })
                .reduce(merge, {});
            return [
                host ? format.protocol(protocol) : '',
                host,
                format.port(port),
                format.path(path)
            ].join('');
        },

        /**
         * Modifies the input Request object according to any matching Proxy rules.
         * Rules are applied in the order they were added to the Proxy, so later rules will
         * always override earlier rules.
         *
         * **NOTE:** You will not typically call this method directly. Instead, the
         * DataLayer.createRequest method will invoke this function on your behalf. See
         * that method for details.
         *
         * @param {Request} request The request object whose key/value pairs will be used
         * to determine which proxy rules should be used to determine the version.
         * @returns {Request} The input Request object, with properties modified according
         * to the matching Proxy rules.
         * @see {@link DataLayer#createRequest createRequest} &mdash; invokes the apply
         * method for you
         * @example
         * import { rethrow, fatal } from '@paychex/core/errors';
         * import { proxy, createRequest, fetch } from '~/path/to/data';
         * import switches from '../config/features.json';
         *
         * if (switches.useV2endpoint) {
         *   // switch from Remote to REST endpoint
         *   proxy.use({
         *     path: '/v2/endpoint',
         *     match: {
         *       base: 'my-project',
         *       path: '/endpoint',
         *     }
         *   });
         * }
         *
         * export async function getEndpointData() {
         *   // createRequest modifies the Request
         *   // object generated by the DDO using
         *   // Proxy rules, including the one above
         *   const request = createRequest({
         *     base: 'my-project',
         *     path: '/endpoint',
         *   });
         *   const response = await fetch(request)
         *     .catch(rethrow(fatal()));
         *   return response.data;
         * }
         */
        apply(request) {
            return config
                .filter(ruleMatches, request)
                .map(withoutMatchObject)
                .reduce(merge, request);
        },

        /**
         * Add rules to the proxy instance. The order rules are added determines
         * the order they are applied.
         * @param {...ProxyRule} rules The rules to use to configure this proxy instance.
         * @example
         * import { proxy } from '~/path/to/data';
         *
         * // any {@link Request Requests} with base == 'files'
         * // will be routed to https://files.myserver.com:8118
         * proxy.use({
         *   port: 8118,
         *   protocol: 'https',
         *   host: 'files.myserver.com',
         *   match: {
         *     base: 'files'
         *   }
         * });
         */
        use(...rules) {
            config.push(...Array.prototype.concat.apply([], rules));
        },

    };

}
