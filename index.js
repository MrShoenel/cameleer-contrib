const { SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema } = require('./lib/tasks/7ZipTask')
, { macRegex, wakeAsync} = require('./lib/tools/WakeOnLan');


module.exports = Object.freeze({
  SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema,

  macRegex, wakeAsync
});
