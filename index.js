const { ClassLoader } = require('./lib/tools/ClassLoader')
, path = require('path')
, taskDirectory = path.resolve(path.join(path.dirname(__filename), './lib/tasks'))
, managerDirectory = path.resolve(path.join(path.dirname(__filename), './lib/managers'))
, controllerDirectory = path.resolve(path.join(path.dirname(__filename), './lib/controllers'))
, getTaskLoader = cameleerNs => {
  return new ClassLoader(taskDirectory, cameleerNs);
}
, getManagerLoader = cameleerNs => {
  return new ClassLoader(managerDirectory, cameleerNs);
}
, getControllerLoader = cameleerNs => {
  return new ClassLoader(controllerDirectory, cameleerNs);
}
, { macRegex, wakeAsync} = require('./lib/tools/WakeOnLan');


module.exports = Object.freeze({
  ClassLoader,
  getTaskLoader,
  getManagerLoader,
  getControllerLoader,

  macRegex, wakeAsync
});
