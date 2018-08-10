/*
 * This file holds stuff that we use on the client- and server-side.
 */


/**
 * @typedef WsMessage
 * @type {Object}
 * @property {number} typeId
 * @property {any} [payload] Anything that can be JSON.serialized().
 */

/**
 * @typedef LogMessage
 * @type {Object}
 * @property {string} type
 * @property {string} date
 * @property {string} time
 * @property {string} msg
 * @property {number} level
 * @property {string} asString
 */
