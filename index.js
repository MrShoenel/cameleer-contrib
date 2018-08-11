const { CameleerQueueObserver } = require('./lib/extras/CameleerQueueObserver')
, { CronSchedule } = require('./lib/extras/CronSchedule')
, { UrlCalendar } = require('./lib/extras/UrlCalendar')
, { AngularSimpleWebManager, AngularSimpleWebManagerSchema
  } = require('./lib/managers/angular-simple-web')
, { SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema
  } = require('./lib/tasks/7ZipTask')
, { macRegex, wakeAsync} = require('./lib/tools/WakeOnLan');



module.exports = Object.freeze({
  CameleerQueueObserver,
  CronSchedule,
  UrlCalendar,
  AngularSimpleWebManager, AngularSimpleWebManagerSchema,
  SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema,
  macRegex, wakeAsync
});
