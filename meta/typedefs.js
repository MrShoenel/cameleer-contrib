/**
 * @typedef ClassGetter
 * @type {Function}
 * @param {Task|Function} BaseTask
 * @returns {Function}
 */

/**
 * @typedef SevenZipTaskBackupMode
 * @type {'zip'|'copy'}
 */

/**
 * @typedef SevenZipTaskConfigBase
 * @type {Object}
 * @property {SevenZipTaskBackupMode|(() => SevenZipTaskBackupMode|Promise.<SevenZipTaskBackupMode>)} [backupMode] Optional. Defaults to 'zip'.
 * @property {string|(() => string|Promise.<string>)} sevenZip The absolute path to the 7z executable.
 * @property {string|(() => string|Promise.<string>)} src
 * @property {string|(() => string|Promise.<string>)} dstFolder Also supports substitutions.
 * @property {string|(() => string|Promise.<string>)} [dstFile] Optional. Defaults to null. May only be null if backup-mode is 'copy'. Supports substitutions.
 * @property {boolean|(() => boolean|Promise.<boolean>)} [mkdirpDstFolder] Optional. Defaults to true. Whether or not to try to recursively create the destination directory before running the backup.
 * @property {boolean|(() => boolean|Promise.<boolean>)} [emptyDstBefore] Optional. Defaults to false. Whether or not to empty the destination folder before running the backup.
 * @property {string|(() => string|Promise.<string>)} [password] Optional. Defaults to null.
 * @property {Array.<string>|(() => Array.<string>|Promise.<Array.<string>>)} [sevenZipArgs] Optional. Defaults to [].
 */

/**
 * @typedef SevenZipTaskConfig
 * @type {TaskConfig|SevenZipTaskBase}
 */