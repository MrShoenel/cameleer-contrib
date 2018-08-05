const { assert } = require('chai')
, { ClassLoader } = require('../lib/tools/ClassLoader')
, path = require('path')
, cameleerNs = require('cameleer');


describe('TaskClassLoader', function() {
  it('should load all classes in a directory', async() => {
    const directory = path.resolve(path.join(path.dirname(__filename), '../lib/tasks'));
    const cl = new ClassLoader(directory, cameleerNs);

    const classMap = cl.loadAll();

    [...classMap.values()].forEach(F => {
      assert.isTrue(F instanceof Function);
    });
  });
});