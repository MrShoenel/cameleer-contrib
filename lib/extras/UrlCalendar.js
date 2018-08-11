const { Calendar } = require('cameleer')
, reqProm = require('request-promise');


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class UrlCalendar extends Calendar {
  /**
   * @param {string} nameOrId
   * @param {string} url
   * @param {Object} [requestOptions] Optional. Defaults to { method: 'get' }. Object with options to be passed to request-promise.
   * @param {number} [updateIntervalMsecs] Optional. Defaults to 60000 (one minute).
   * @param {boolean} [enabled] Optional. Defaults to true
   */
  constructor(nameOrId, url, requestOptions = { method: 'get' }, updateIntervalMsecs = 60e3, enabled = true) {
    super(nameOrId, () => UrlCalendar._loadIcsFromUrl(url, requestOptions),
      updateIntervalMsecs, !!enabled);
  };

  /**
   * @param {string} url
   * @param {Object} [requestOptions] Optional. Defaults to { method: 'get' }. Object with options to be passed to request-promise.
   * @returns {Promise.<string>} The calendar's ICS data.
   */
  static _loadIcsFromUrl(url, requestOptions = { method: 'get' }) {
    return new Promise((resolve, reject) => {
      reqProm(url, requestOptions).then(resolve).catch(reject);
    });
  };
};


module.exports = Object.freeze({
  UrlCalendar
});
