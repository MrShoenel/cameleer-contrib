require('../../meta/typedefs');

const Cameleer = require('cameleer')
, taskConfigSchema = Cameleer.TaskConfigSchema;

var taskClass = null;


/**
 * @param {Function} Task The base Task class from Cameleer.
 * @returns {Task}
 */
const getClass = Task => {
  if (taskClass === null) {
    taskClass = class SevenZipTask extends Task {
      /**
       * @param {TaskConfig} config The configuration for the task.
       * @param {CameleerDefaults} defaults The defaults for functional tasks.
       */
      constructor(config, defaults) {
        super(config, defaults);
      };
    };
  }

  return taskClass;
};


module.exports = Object.freeze({
  getClass
});
