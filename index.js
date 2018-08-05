const { ClassLoader } = require('./lib/ClassLoader')
, path = require('path')
, taskDirectory = path.resolve(path.join(path.dirname(__filename), './lib/tasks'))
, managerDirectory = path.resolve(path.join(path.dirname(__filename), './lib/managers'))
, controllerDirectory = path.resolve(path.join(path.dirname(__filename), './lib/controllers'))
, getTaskLoader = BaseTask => {
  return new ClassLoader(BaseTask, taskDirectory);
}
, getManagerLoader = BaseManager => {
  return new ClassLoader(BaseManager, managerDirectory);
}
, getControllerLoader = BaseController => {
  return new ClassLoader(BaseController, controllerDirectory);
};


module.exports = Object.freeze({
  ClassLoader,
  getTaskLoader,
  getManagerLoader,
  getControllerLoader
});
