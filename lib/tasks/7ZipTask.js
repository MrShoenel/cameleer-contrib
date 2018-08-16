require('cameleer/meta/typedefs');
require('../../meta/typedefs');


const Joi = require('joi')
, fsx = require('fs-extra')
, copy = require('recursive-copy')
, path = require('path')
, resolve = path.resolve
, { ResolvedConfig, SubClassRegister, Task, TaskConfigSchema, SimpleTaskConfigSchema, FunctionalTaskConfigSchema } = require('cameleer')
, { ProcessWrapper, ProgressNumeric, Resolve, ProcessExit } = require('sh.orchestration-tools');


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
const SevenZipTaskConfigSchema = Joi.concat(Joi.object().keys({
  backupMode: Joi.alternatives(
    Joi.alternatives(
      Joi.string().regex(/^zip$/),
      Joi.string().regex(/^copy$/)),
    Joi.func()
  ).default('zip').optional(),
  sevenZip: Joi.alternatives(
    Joi.string().min(1),
    Joi.func()
  ).required(),
  
  src: Joi.alternatives(
    Joi.string().min(1),
    Joi.func()
  ).required(),
  dstFolder:Joi.alternatives(
    Joi.string().min(1),
    Joi.func()
  ).required(),
  dstFile: Joi.string().min(1).default(null).optional(),

  mkdirpDstFolder: Joi.alternatives(
    Joi.boolean(),
    Joi.func()
  ).default(true).optional(),
  emptyDstBefore: Joi.alternatives(
    Joi.boolean(),
    Joi.func()
  ).default(false).optional(),

  password: Joi.alternatives(
    Joi.string().min(1),
    Joi.func()
  ).default(null).optional(),
  tolerateWarnings: Joi.alternatives(
    Joi.boolean(),
    Joi.func()
  ).default(true).optional(),
  sevenZipArgs: Joi.alternatives(
    Joi.array().items(
      Joi.string().min(1).required()
    ),
    Joi.func()
  ).default([]).optional(),
  tasksAfter: Joi.alternatives(
    SimpleTaskConfigSchema,
    Joi.array().items(
      FunctionalTaskConfigSchema,
      Joi.func()
    )
  ).default([]).optional()
})).concat(TaskConfigSchema);




/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class SevenZipTaskResolvedConfig extends ResolvedConfig {
  /**
   * @param {SevenZipTaskConfig} config
   * @param {FunctionalTaskErrorConfig} errConfig
   * @param {SevenZipTask} task
   */
  constructor(config, errConfig, task) {
    super(config, errConfig, task);

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
    /** @type {boolean} */
    this.tolerateWarnings = null;
    /** @type {Array.<string>} */
    this.sevenZipArgs = null;
    /** @type {Array.<FunctionalTaskConfig>} */
    this.tasksAfter = null;
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
      this.tolerateWarnings,
      this.sevenZipArgs,

      this.tasksAfter
    ] = await Promise.all([
      Resolve.optionalToValue(
        'zip', this._resolveWrap(this._configOrg.backupMode), String),
      Resolve.toValue(
        this._resolveWrap(this._configOrg.sevenZip), String),

      Resolve.toValue(
        this._resolveWrap(this._configOrg.src), String),
      Resolve.toValue(
        this._resolveWrap(this._configOrg.dstFolder), String),
      Resolve.optionalToValue(
        null, this._resolveWrap(this._configOrg.dstFile), String),

      Resolve.optionalToValue(
        true, this._resolveWrap(this._configOrg.mkdirpDstFolder), Boolean),
      Resolve.optionalToValue(
        false, this._resolveWrap(this._configOrg.emptyDstBefore), Boolean),

      Resolve.optionalToValue(
        null, this._resolveWrap(this._configOrg.password), String),
      Resolve.optionalToValue(
        null, this._resolveWrap(this._configOrg.tolerateWarnings), Boolean),
      Resolve.optionalToValue(
        [], this._resolveWrap(this._configOrg.sevenZipArgs), []),

      Resolve.optionalToValue(
        [], this._resolveWrap(this._configOrg.tasksAfter), [])
    ]);

    if (this.backupMode === 'zip' && this.dstFile === null) {
      throw new Error(`When zipping, a destination file is required.`);
    }

    // Now resolve the tasks that are supposed to be run afterwards.
    this.tasksAfter = await Promise.all(
      this.tasksAfter.map(raw => this._resolveTask(raw)));

    // Now do the substitutions for the destination names:
    this.dstFile = this.substituteDstNames(this.dstFile);
    this.dstFolder = this.substituteDstNames(resolve(this.dstFolder));

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

    return dstName
      .replace('%jobname%', this.name)
      .replace('%timestamp%', `${((+now) / 1e3).toFixed(0)}`)
      .replace('%date%', `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
      .replace('%time%', `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`);
  };
};


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class SevenZipTask extends Task {
  /**
   * @param {TaskConfig} config The configuration for the task.
   * @param {CameleerDefaults} defaults The defaults for functional tasks.
   */
  constructor(config, defaults) {
    super(config, defaults);
  };

  /**
   * @returns {ObjectSchema}
   */
  get schemaConf() {
    return SevenZipTaskConfigSchema;
  };

  /**
   * @returns {SevenZipTaskResolvedConfig}
   */
  async resolveConfig() {
    /** @type {SevenZipTaskResolvedConfig} */
    const rConfig = await (new SevenZipTaskResolvedConfig(this.config, this.defaults.tasks, this)).resolveAll();

    /** @type {ProgressNumeric} */
    const progress = rConfig.progress
    , numTasksBefore = rConfig.tasks.length;
    

    // Let's check if we should create the folders:
    if (rConfig.mkdirpDstFolder) {
      /** @type {FunctionalTaskConfig} */
      const taskMkdirP = {
        name: 'mkdirp target directory',
        func: async(job) => {
          await fsx.mkdirp(rConfig.dstFolder);
          job.task.logger.logInfo('Recursively created target directory.');
        }
      };

      rConfig.tasks.push(await rConfig._resolveTask(taskMkdirP));
    }

    // Check if we should empty the target:
    if (rConfig.emptyDstBefore) {
      /** @type {FunctionalTaskConfig} */
      const taskEmpty = {
        name: 'Empty target directory',
        func: async(job) => {
          job.task.logger.logInfo(`Emptying target directory: ${rConfig.dstFolder}`);
          await fsx.emptyDir(rConfig.dstFolder);
          job.task.logger.logInfo(`Emptied target directory.`);
        }
      };

      rConfig.tasks.push(await rConfig._resolveTask(taskEmpty));
    }

    // Now it's time to create the backup-tasks:
    if (rConfig.backupMode === 'copy') {
      /** @type {FunctionalTaskConfig} */
      const taskCopy = {
        name: 'Recursive copy',
        func: async(job) => {
          job.task.logger.logInfo(`Recursively copying from ${rConfig.src} to ${rConfig.dstFolder}`);
          await copy(rConfig.src, rConfig.dstFolder, {
            overwrite: true,
            expand: true,
            dot: true,
            junk: true
          });
          job.task.logger.logInfo(`Recursively copying finished.`);
        }
      };

      rConfig.tasks.push(await rConfig._resolveTask(taskCopy));
    } else if (rConfig.backupMode === 'zip') {
      /** @type {FunctionalTaskConfig} */
      const taskZip = {
        name: 'Zipping to file',
        func: async(job) => {
          const passwordArg = rConfig.password === null ? [] : [`-p${rConfig.password}`]
          , dstAbsPath = path.resolve(path.join(rConfig.dstFolder, rConfig.dstFile))
          , pw = new ProcessWrapper(rConfig.sevenZip,  ['a', '-bb0', '-bsp1'] // 'bsp' means progress to stdout
            .concat(rConfig.sevenZipArgs)
            .concat(passwordArg)
            .concat([ dstAbsPath, rConfig.src ]));

          const subs = pw.observable.subscribe(procOut => {
            if (procOut.isStdOut) {
              const line = procOut.asString.trim()
              , percent = /^([0-9]+)%/i.exec(line)
              , everythingOk = /Everything\sis\sOk/i.exec(line);

              if (Array.isArray(percent)) {
                progress.reportProgress(parseFloat(percent[1]) / 1e2);
              } else if (Array.isArray(everythingOk)) {
                progress.reportProgress(1);
              }
            }
          });

          try {
            job.task.logger.logInfo(`Attempting zipping to file: ${dstAbsPath}`);
            let withWarnings = false;
            try {
              await pw.spawnAsync();
            } catch (e) {
              if (rConfig.tolerateWarnings
                  && e instanceof ProcessExit && e.code === 1) {
                withWarnings = true;
              } else {
                throw e;
              }
            }
            job.task.logger.logInfo(`Zipping to file finished${withWarnings ? ' WITH warnings' : ''}.`);
          } catch (e) {
            // Let's try to clean up unfinished results
            try {
              if (await fsx.exists(dstAbsPath)) {
                fsx.unlink(dstAbsPath);
              }
            } catch (_) { }

            throw e;
          } finally {
            subs.unsubscribe();
          }
        }
      };

      rConfig.tasks.push(await rConfig._resolveTask(taskZip));
    }

    this.logger.logInfo(`Created ${rConfig.tasks.length - numTasksBefore} functional tasks (${rConfig.tasks.slice(numTasksBefore).map(t => t.name).join(', ')})`);

    if (rConfig.tasksAfter.length > 0) {
      rConfig.tasks.push(...rConfig.tasksAfter);
      this.logger.logInfo(`Appended ${rConfig.tasksAfter.length} tasks to run afterwards.`);
    }


    return rConfig;
  };
};


SubClassRegister.registerSubclass(SevenZipTask);
SubClassRegister.registerSubclass(SevenZipTaskResolvedConfig);


module.exports = Object.freeze({
  SevenZipTaskResolvedConfig,
  SevenZipTaskConfigSchema,
  SevenZipTask
});
