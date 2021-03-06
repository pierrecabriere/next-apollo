'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _flexibleCookies = require('flexible-cookies');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _const = require('./const');

var _apollo = require('../apollo');

var _apollo2 = _interopRequireDefault(_apollo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (opts) {
  _config2.default.addAuth({ logout: opts });
  opts = _config2.default.getAuth().logout;

  _flexibleCookies.Cookies.delete(_const.CONST_AUTHTOKEN_COOKIE, { source: opts.cookieSource });

  await opts.update(_apollo2.default.getClient(), null, opts.updateStore);

  opts.next && opts.next(null);

  return true;
};