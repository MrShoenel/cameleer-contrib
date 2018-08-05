const { chai, assert } = require('mocha')
, { ClassLoader } = require('../lib/ClassLoader')
, path = require('path');


describe('TaskClassLoader', function() {
  it('should load all classes in a directory', async() => {
    class BaseTask {};

    const directory = path.resolve(path.join(path.dirname(__filename), '../lib/tasks'));
    const cl = new ClassLoader(BaseTask, directory);

    const classes = await cl.loadAllAsync();

    classes.forEach(clazz => {
      assert.isTrue(clazz.prototype instanceof BaseTask);
    });
  });
});