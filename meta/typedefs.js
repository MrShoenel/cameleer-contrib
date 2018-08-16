/**
 * @typedef ClassGetter
 * @type {Function}
 * @param {Task|Function} BaseTask
 * @returns {Function}
 */

/**
 * @typedef SevenZipTaskBackupMode
 * @type {'zip'|'copy'}
 */

/**
 * @typedef SevenZipTaskConfigBase
 * @type {Object}
 * @property {SevenZipTaskBackupMode|((rro: ResolvedResolveObject, task: Task) => SevenZipTaskBackupMode|Promise.<SevenZipTaskBackupMode>)} [backupMode] Optional. Defaults to 'zip'.
 * @property {string|((rro: ResolvedResolveObject, task: Task) => string|Promise.<string>)} sevenZip The absolute path to the 7z executable.
 * @property {string|((rro: ResolvedResolveObject, task: Task) => string|Promise.<string>)} src
 * @property {string|((rro: ResolvedResolveObject, task: Task) => string|Promise.<string>)} dstFolder Also supports substitutions.
 * @property {string|((rro: ResolvedResolveObject, task: Task) => string|Promise.<string>)} [dstFile] Optional. Defaults to null. May only be null if backup-mode is 'copy'. Supports substitutions.
 * @property {boolean|((rro: ResolvedResolveObject, task: Task) => boolean|Promise.<boolean>)} [mkdirpDstFolder] Optional. Defaults to true. Whether or not to try to recursively create the destination directory before running the backup.
 * @property {boolean|((rro: ResolvedResolveObject, task: Task) => boolean|Promise.<boolean>)} [emptyDstBefore] Optional. Defaults to false. Whether or not to empty the destination folder before running the backup.
 * @property {string|((rro: ResolvedResolveObject, task: Task) => string|Promise.<string>)} [password] Optional. Defaults to null.
 * @property {Array.<string>|((rro: ResolvedResolveObject, task: Task) => Array.<string>|Promise.<Array.<string>>)} [sevenZipArgs] Optional. Defaults to [].
 * @property {SimpleTaskConfig|((rro: ResolvedResolveObject) => (SimpleTaskConfig|Promise.<SimpleTaskConfig>))} [tasksAfter] Optional. Defaults to an empty Array. The SevenZipTask creates all of its tasks automatically and prepends them to may existing tasks in the tasks-array. However, some tasks you may want to run afterwards. Those should be put in this array.
 */

/**
 * @typedef SevenZipTaskConfig
 * @type {TaskConfig|SevenZipTaskBase}
 */

/**
 * @typedef AngularSimpleWebConfigBase
 * @type {Object}
 * @property {number} port The HTTP-port to run the application on.
 * @property {boolean} [openBrowser] Optional. Defaults to false. Whether or not to open the browser once the manager is initialized.
 */

/**
 * @typedef AngularSimpleWebConfig
 * @type {ManagerConfig|AngularSimpleWebConfigBase}
 */

/**
 * @typedef TrayNotifierConfigBase
 * @type {Object}
 * @property {boolean} [playSounds] Optional. Defaults to false. If true, the operating system's sound for notifications will be played.
 * @property {boolean} [queueEvents] Optional. Defaults to false. Whether or not to show notifications for queue events.
 * @property {boolean} [notifyWork] Optional. Defaults to true. Whether or not to show notifications for when Cameleer is enqueueing, running, finishing or failing work.
 * @property {boolean} [notifyLog] Optional. Defaults to false. Whether or not to show notifications for every log entry.
 */

/**
 * @typedef TrayNotifierConfig
 * @type {ManagerConfig|TrayNotifierConfigBase}
 */

/**
 * @typedef JobNumericProgressInfo
 * @type {Object}
 * @property {number} min
 * @property {number} max
 * @property {number} last
 * @property {number} range
 */

/**
 * @typedef JobInfo
 * @type {Object}
 * @property {number} cost
 * @property {boolean} hasCost
 * @property {boolean} hasFailed
 * @property {boolean} isDone
 * @property {boolean} isRunning
 * @property {boolean} supportsProgress
 * @property {null|JobNumericProgressInfo} progressInfo
 */

/**
 * @typedef JobInfoAgg
 * @type {Object}
 * @property {number} qty Number of jobs aggregated in this info
 * @property {number} totalCost
 * @property {number} numFailed
 * @property {number} numDone
 * @property {number} numRunning
 * @property {number} avgProgress
 */

/**
 * @typedef QueueInfoJobs
 * @type {Object}
 * @property {Array.<JobInfo>} infos
 * @property {JobInfoAgg} agg
 */

/**
 * @typedef QueueInfo
 * @type {Object}
 * @property {CameleerQueueConfig} config
 * @property {boolean} isDefault
 * @property {boolean} isParallel
 * @property {string} name
 */

/**
 * @typedef QueueInfoComplete
 * @type {Object}
 * @property {QueueInfo} info
 * @property {{ all: QueueInfoJobs, current: QueueInfoJobs, backlog: QueueInfoJobs }} jobs
 * @property {number} backlog
 * @property {number|null} backlogCost null for parallel-queues
 * @property {number|null} capabilities null for parallel-queues
 * @property {number|null} capabilitiesFree null for parallel-queues
 * @property {number|null} capabilitiesUsed null for parallel-queues
 * @property {boolean} isBusy
 * @property {boolean} isIdle
 * @property {boolean} isPaused
 * @property {boolean} isWorking
 * @property {number} load
 * @property {number} utilization
 * @property {number} numJobsDone
 * @property {number} numJobsFailed
 * @property {number} numJobsRunning
 * @property {number|null} numParallel null for cost-queues
 * @property {number} workDone
 * @property {number} workFailed
 */

/**
 * @typedef TaskInfo
 * @type {Object}
 * @property {string} type
 * @property {string} name
 * @property {string} scheduleType
 * @property {boolean} allowTrigger
 */