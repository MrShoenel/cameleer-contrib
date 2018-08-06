require('../../meta/typedefs');

const Joi = require('joi')
, fsx = require('fs-extra')
, copy = require('recursive-copy')
, path = require('path')
, { ClassLoader } = require('../tools/ClassLoader')
, { ProcessWrapper } = require('sh.orchestration-tools');

var taskClass = null;
/** @type {ObjectSchema} */
var extendedSchema = null;


const getClass = (cameleerNs = require('cameleer')) => {
  if (taskClass === null) {
    const cl = new ClassLoader(__dirname, cameleerNs);
    const SevenZipTaskResolvedConfig = cl.load(path.resolve(path.join(__dirname, '7ZipTaskResolvedConfig.js')));

    extendedSchema = Joi.concat(Joi.object().keys({
      backupMode: Joi.alternatives(
        Joi.alternatives(
          Joi.string().regex(/^zip$/),
          Joi.string().regex(/^copy$/)),
        Joi.func()
      ).default('zip').required(),
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
      sevenZipArgs: Joi.alternatives(
        Joi.array().items(
          Joi.string().min(1).required()
        ),
        Joi.func()
      ).default([]).optional()
    })).concat(cameleerNs.TaskConfigSchema);

    taskClass = class SevenZipTask extends cameleerNs.Task {
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
        return extendedSchema;
      };

      /**
       * @returns {SevenZipTaskResolvedConfig}
       */
      async resolveConfig() {
        /** @type {ResolvedConfig|SevenZipTaskResolvedConfig} */
        const rConfig = await (new SevenZipTaskResolvedConfig(this.config, this.defaults.tasks)).resolveAll();

        const numTasksBefore = rConfig.tasks.length;
        

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

          rConfig.tasks.push(taskMkdirP);
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

          rConfig.tasks.push(taskEmpty);
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

          rConfig.tasks.push(taskCopy);
        } else if (rConfig.backupMode === 'zip') {
          /** @type {FunctionalTaskConfig} */
          const taskZip = {
            name: 'Zipping to file',
            func: async(job) => {
              const passwordArg = rConfig.password === null ? [] : [`-p${rConfig.password}`]
              , dstAbsPath = path.resolve(path.join(rConfig.dstFolder, rConfig.dstFile))
              , pw = new ProcessWrapper(rConfig.sevenZip,  ['a']
                .concat(rConfig.sevenZipArgs)
                .concat(passwordArg)
                .concat([ dstAbsPath, rConfig.src ]));

              try {
                job.task.logger.logInfo(`Attempting zipping to file: ${dstAbsPath}`);
                await pw.spawnAsync();
                job.task.logger.logInfo(`Zipping to file finished.`);
              } catch (e) {
                // Let's try to clean up unfinished results
                try {
                  if (await fsx.exists(dstAbsPath)) {
                    fsx.unlink(dstAbsPath);
                  }
                } catch (_) { }

                throw e;
              }
            }
          };

          rConfig.tasks.push(taskZip);
        }

        this.logger.logInfo(`Created ${rConfig.tasks.length - numTasksBefore} functional tasks (${rConfig.tasks.slice(numTasksBefore).map(t => t.name).join(', ')})`);


        return rConfig;
      };
    };
  }

  return taskClass;
};


module.exports = Object.freeze({
  getClass
});
