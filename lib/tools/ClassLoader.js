require('../../meta/typedefs');


const path = require('path')
, fs = require('fs');



/**
 * Class that loads all .js-files in a directory using require() and calls the function
 * getClass() in it by passing it the whole Cameleer namespace. The getClass() function
 * is required to return a class that sub-classes one of Cameleer's classes.
 */
class ClassLoader {
  constructor(directory, cameleerNs = {}) {
    if (typeof directory !== 'string' || !fs.existsSync(directory)) {
      throw new Error(`The given directory is not a string or does not exist: ${directory}`);
    }

    this.directory = path.resolve(directory);
    this.cameleerNs = cameleerNs;
  };

  /**
   * @param {string} clazzFile Absolute path to file containing the class
   * @returns {Function} The Class
   */
  load(clazzFile) {
    const isJsFileRegex = /\.js$/i;
    if (isJsFileRegex.test(clazzFile)) {
      const getClass = require(clazzFile).getClass
      , clazz = getClass(this.cameleerNs);
      if (clazz instanceof Function) {
        return clazz;
      }
    }
    
    throw new Error(`Cannot load class: ${clazzFile}`);
  };

  /**
   * @returns {Map.<string, Function>}
   */
  loadAll() {
    /** @type {Map.<string, Function>} */
    let map = new Map();

    fs.readdirSync(this.directory).forEach(file => {
      const clazz = this.load(path.join(this.directory, file));
      map.set(clazz.name, clazz);
    });

    return map;
  };
};


module.exports = Object.freeze({
  ClassLoader
});
