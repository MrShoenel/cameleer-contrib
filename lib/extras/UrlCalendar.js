const { Calendar } = require('cameleer')
, reqProm = require('request-promise')
, ical = require('ical.js');


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
   * Called by the CalendarScheduler to query this Calendar's underlying
   * ICS-provider. This method is useful if the ICS-provider e.g. points
   * to web-based calendar.
   * 
   * @returns {Promise.<this>}
   */
  async refresh() {
    let providerResult = this.icsProvider();

    if (providerResult instanceof Promise) {
      providerResult = await providerResult;
    }

    if (typeof providerResult !== 'string') {
      throw new Error(`The icsProvider did not return valid iCal-data.`);
    }
    
    const jCalData = ical.parse(providerResult);
    const comp = new ical.Component(jCalData);

    /** @type {Array.<ical.Component>} */
    let veventComps = [];
    try {
      veventComps = comp.getAllSubcomponents('vevent');
    } catch (e) {
      if (e.message.indexOf(`Cannot read property 'length' of undefined`) === -1) {
        // We only catch this due to improper init in ical.js
        throw e;
      }
    }

    this._events = veventComps.map(v => {
      const temp = new Event(v);
      temp.component = v; // Hack, otherwise instance won't work
      return temp;
    });
    
    return this;
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
