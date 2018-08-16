const { assert } = require('chai')
, { SevenZipTask, SevenZipTaskConfigSchema, SevenZipTaskResolvedConfig } = require('../lib/tasks/7ZipTask')
, { Task, createDefaultCameleerConfig } = require('cameleer')
, { ManualSchedule } = require('sh.orchestration-tools')
, { DevNullLogger } = require('sh.log-client');


describe('7ZipTask', function() {
  it('should resolve its config properly', async() => {
    const defaults = createDefaultCameleerConfig().defaults;
    const task = Task.fromConfiguration({
      enabled: true,
      type: SevenZipTask,
      schedule: new ManualSchedule(),
      name: 'Foo',
      sevenZip: 'a',
      src: 'a',
      dstFolder: 'a',
      dstFile: 'a'
    }, defaults);

    task.logger = new DevNullLogger('Foo');

    /** @type {SevenZipTaskResolvedConfig} */
    const conf = await task.resolveConfig();

    assert.strictEqual(conf.backupMode, 'zip');
  });

  it('should allow appending tasks (tasksAfter)', async() => {
    const defaults = createDefaultCameleerConfig().defaults;
    const task = Task.fromConfiguration({
      enabled: true,
      type: SevenZipTask,
      schedule: new ManualSchedule(),
      name: 'Foo',
      sevenZip: 'a',
      src: 'a',
      dstFolder: 'a',
      dstFile: 'a',
      tasksAfter: [
        () => 42,
        {
          name: 'fTask',
          func: async() => 43
        }
      ]
    }, defaults);

    task.logger = new DevNullLogger('Foo');

    /** @type {SevenZipTaskResolvedConfig} */
    const conf = await task.resolveConfig();

    assert.strictEqual(conf.tasksAfter.length, 2);
    const last2Tasks = conf.tasks.slice(-2);

    assert.strictEqual(last2Tasks[0].func(), 42);
    assert.strictEqual(await last2Tasks[1].func(), 43);
  });
});