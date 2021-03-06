'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _apolloClient = require('apollo-client');

var _apolloLinkHttp = require('apollo-link-http');

var _apolloLink = require('apollo-link');

var _apolloCacheInmemory = require('apollo-cache-inmemory');

var _isomorphicUnfetch = require('isomorphic-unfetch');

var _isomorphicUnfetch2 = _interopRequireDefault(_isomorphicUnfetch);

var _flexibleCookies = require('flexible-cookies');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _const = require('./lib/const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = _isomorphicUnfetch2.default;
}

function createApolloClient(initialState) {
  const { endpoint, link } = _config2.default.get();
  let httpLink;

  if ('object' === typeof link && !link.request) {
    const linkOpts = Object.assign({
      uri: endpoint // Server URL (must be absolute)
    }, link);
    httpLink = new _apolloLinkHttp.HttpLink(linkOpts);
  } else {
    httpLink = link;
  }

  const authMiddleware = new _apolloLink.ApolloLink((operation, forward) => {
    const headers = {};
    const authorization = getAuthorization();
    if (authorization) headers.authorization = authorization;

    // add the authorization to the headers
    operation.setContext({
      headers
    });

    return forward(operation);
  });

  httpLink = authMiddleware.concat(httpLink);

  return new _apolloClient.ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link: httpLink,
    cache: new _apolloCacheInmemory.InMemoryCache().restore(initialState || {})
  });
}

function getAuthorization() {
  const { cookieSource } = _config2.default.get();
  const { tokenType, defaultToken } = _config2.default.getAuth();

  const cookieToken = _flexibleCookies.Cookies.get(_const.CONST_AUTHTOKEN_COOKIE, { source: cookieSource }) || defaultToken;
  if (!cookieToken) return null;

  if (cookieToken.match(`^${tokenType}`, 'i')) return cookieToken;

  return `${tokenType} ${cookieToken}`;
}

class Apollo {
  constructor() {
    this.client = null;
  }

  getClient(initialState) {
    // Make sure to create a new client for every server-side request so that data
    // isn't shared between connections (which would be bad)
    let newApolloClient;

    if (!process.browser || !this.client) newApolloClient = createApolloClient(initialState);

    if (!process.browser) return newApolloClient;

    // Reuse client on the client-side
    if (!this.client) this.client = newApolloClient;

    return this.client;
  }

  forceCreate(initialState) {
    this.client = createApolloClient(initialState);

    return this.client;
  }
}

exports.default = new Apollo();