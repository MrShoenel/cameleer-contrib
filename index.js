const { SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema } = require('./lib/tasks/7ZipTask')
, { AngularSimpleWebManager, AngularSimpleWebManagerSchema } = require('./lib/managers/angular-simple-web')
, { macRegex, wakeAsync} = require('./lib/tools/WakeOnLan');


module.exports = Object.freeze({
  SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema,
  AngularSimpleWebManager, AngularSimpleWebManagerSchema,

  macRegex, wakeAsync
});
