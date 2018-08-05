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
        Joi.string().regex(/^zip$/),
        Joi.string().regex(/^copy$/)
      ).default('zip').required(),
      sevenZip: Joi.string().min(1).required(),
      
      src: Joi.string().min(1).required(),
      dstFolder: Joi.string().min(1).required(),
      dstFile: Joi.string().min(1).default(null).optional(),

      mkdirpDstFolder: Joi.boolean().default(true).optional(),
      emptyDstBefore: Joi.boolean().default(false).optional(),

      password: Joi.string().min(1).default(null).optional(),
      sevenZipArgs: Joi.array().items(
        Joi.string().min(1).required()
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
        

        // Let's check if we should create the folders:
        if (this.mkdirpDstFolder) {
          /** @type {FunctionalTaskConfig} */
          const taskMkdirP = {
            name: 'mkdirp target directory',
            func: async() => {
              await fsx.mkdirp(rConfig.dstFolder)
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
            }
          };

          rConfig.tasks.push(taskEmpty);
        }

        // Now it's time to create the backup-tasks:
        if (rConfig.backupMode === 'copy') {
          /** @type {FunctionalTaskConfig} */
          const taskCopy = {
            name: 'Recursive copy',
            func: async() => {
              job.task.logger.logInfo(`Recursively copying from ${rConfig.src} to ${rConfig.dstFolder}`);
              await copy(rConfig.src, rConfig.dstFolder, {
                overwrite: true,
                expand: true,
                dot: true,
                junk: true
              });
            }
          };

          rConfig.tasks.push(taskCopy);
        } else if (rConfig.backupMode === 'zip') {
          /** @type {FunctionalTaskConfig} */
          const taskZip = {
            name: 'Zipping to file',
            func: async() => {
              const passwordArg = rConfig.password === null ? [] : [`-p${rConfig.password}`]
              , dstAbsPath = path.resolve(path.join(rConfig.dstFolder, rConfig.dstFile))
              , pw = new ProcessWrapper(rConfig.sevenZip,  ['a']
                .concat(rConfig.sevenZipArgs)
                .concat(passwordArg)
                .concat([ dstAbsPath, rConfig.src ]));

              try {
                job.task.logger.logInfo(`Attempting zipping to file: ${dstAbsPath}`);
                await pw.spawnAsync();
              } finally {
                // Let's try to clean up unfinished results
                try {
                  if (await fsx.exists(dstAbsPath)) {
                    fsx.unlink(dstAbsPath);
                  }
                } catch (e) { }
              }
            }
          };

          rConfig.tasks.push(taskZip);
        }


        return rConfig;
      };
    };
  }

  return taskClass;
};


module.exports = Object.freeze({
  getClass
});
