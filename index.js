const { CameleerQueueObserver } = require('./lib/extras/CameleerQueueObserver')
, { CronSchedule } = require('./lib/extras/CronSchedule')
, { UrlCalendar } = require('./lib/extras/UrlCalendar')
, { AngularSimpleWebManager, AngularSimpleWebManagerSchema
  } = require('./lib/managers/angular-simple-web')
, { TrayNotifierManager, TrayNotifierManagerSchema
  } = require('./lib/managers/tray-notifier/index')
, { SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema
  } = require('./lib/tasks/7ZipTask')
, { macRegex, wakeAsync} = require('./lib/tools/WakeOnLan');



module.exports = Object.freeze({
  CameleerQueueObserver,
  CronSchedule,
  UrlCalendar,
  AngularSimpleWebManager, AngularSimpleWebManagerSchema,
  TrayNotifierManager, TrayNotifierManagerSchema,
  SevenZipTaskResolvedConfig, SevenZipTask, SevenZipTaskConfigSchema,
  macRegex, wakeAsync
});
