require('../meta/typedefs');


const path = require('path')
, fs = require('fs');


class ClassLoader {
  constructor(BaseTask, directory) {
    if (!(BaseTask instanceof Function)) {
      throw new Error(`The given BaseClass is not a class: ${JSON.stringify(BaseTask)}`);
    }
    if (typeof directory !== 'string' || !fs.existsSync(directory)) {
      throw new Error(`The given directory is not a string or does not exist: ${directory}`);
    }

    this.BaseTask = BaseTask;
    this.directory = directory;
  };
  
  /**
   * @returns {Promise.<Array.<Function>>} Resolves to an Array of Classes that extend
   * the BaseTask.
   */
  loadAllAsync() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.directory, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        const isJsFileRegex = /\.js$/i;
        const classes = files.filter(f => isJsFileRegex.test(f)).map(file => {
          try {
            /**
             * @type {ClassGetter}
             * @returns {Function}
             */
            const getClass = require(path.join(this.directory, file)).getClass;
            return getClass(this.BaseTask);
          } catch (e) {
            return null;
          }
        }).filter(clazz => clazz instanceof Function && clazz.prototype instanceof this.BaseTask);

        resolve(classes);
      });
    });
  }
};


module.exports = Object.freeze({
  ClassLoader
});
