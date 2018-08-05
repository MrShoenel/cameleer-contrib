require('../../meta/typedefs');

const { resolve } = require('path')
, { Resolve, ProgressNumeric } = require('sh.orchestration-tools');

var rcClass = null;

const getClass = (cameleerNs = require('cameleer')) => {
  if (rcClass === null) {
    rcClass = class SevenZipTaskResolvedConfig extends cameleerNs.ResolvedConfig {
      /**
       * @param {SevenZipTaskConfig} config
       * @param {FunctionalTaskErrorConfig} errConfig
       */
      constructor(config, errConfig) {
        super(config, errConfig);

        /** @type {SevenZipTaskBackupMode} */
        this.backupMode = null;
        /** @type {string} */
        this.sevenZipArgs = null;
        /** @type {string} */
        this.src = null;
        /** @type {string} */
        this.dstFolder = null;
        /** @type {string} */
        this.dstFile = null;
        /** @type {boolean} */
        this.mkdirpDstFolder = null;
        /** @type {boolean} */
        this.emptyDstBefore = null;
        /** @type {string} */
        this.password = null;
        /** @type {Array.<string>} */
        this.sevenZipArgs = null;
      };

      /**
       * @returns {this}
       */
      async resolveAll() {
        [
          this.backupMode,
          this.sevenZip,

          this.src,
          this.dstFolder,
          this.dstFile,

          this.mkdirpDstFolder,
          this.emptyDstBefore,

          this.password,
          this.sevenZipArgs
        ] = await Promise.all([
          Resolve.optionalToValue('zip', this._configOrg.backupMode, String),
          Resolve.toValue(this._configOrg.sevenZip, String),

          Resolve.toValue(this._configOrg.src, String),
          Resolve.toValue(this._configOrg.dstFolder, String),
          Resolve.optionalToValue(null, this._configOrg.dstFile, String),

          Resolve.optionalToValue(true, this._configOrg.mkdirpDstFolder, Boolean),
          Resolve.optionalToValue(false, this._configOrg.emptyDstBefore, Boolean),

          Resolve.optionalToValue(null, this._configOrg.password, String),
          Resolve.optionalToValue([], this._configOrg.sevenZipArgs, [])
        ]);

        if (this.backupMode === 'zip' && this.dstFile === null) {
          throw new Error(`When zipping, a destination file is required.`);
        }

        // Now do the substitutions for the destination names:
        this.src = resolve(this.src);
        this.dstFile = this.substituteDstNames(this.dstFile);
        this.dstFolder = this.substituteDstNames(this.dstFolder);

        await super.resolveAll();

        this.progress = new ProgressNumeric(0, 1);

        return this;
      };

      /**
       * @param {string} dstName
       * @returns {string}
       */
      substituteDstNames(dstName) {
        const pad = num => `${num < 10 ? '0' : ''}${num}`, now = new Date;

        return resolve(dstName
          .replace('%jobname%', this.name)
          .replace('%timestamp%', `${((+now) / 1e3).toFixed(0)}`))
          .replace('%date%', `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
          .replace('%time%', `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`);
      };
    };
  }

  return rcClass;
};


module.exports = Object.freeze({
  getClass
});
