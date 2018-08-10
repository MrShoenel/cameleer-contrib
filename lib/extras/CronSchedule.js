const { ManualSchedule } = require('cameleer')
, { Job, scheduleJob, RecurrenceRule } = require('node-schedule');


/**
 * A class that wraps node-schedule in a ManualSchedule and triggers scheduling
 * whenever the underlying cron-job is scheduled to run.
 * 
 * @author Sebastian Hönel <development@hoenel.net>
 */
class CronSchedule extends ManualSchedule {
  /**
   * @param {string|RecurrenceRule} rule Supports the same types as scheduleJob().
   * @param {string} [name] Optional. Defaults to null. Passed to scheduleJob().
   */
  constructor(rule, name = null) {
    super(true);
    const args = [];
    if (typeof name === 'string') {
      args.push(name);
    }

    args.push(rule);
    args.push(fireDate => {
      this.triggerNext(fireDate);
    });

    /** @type {Job} */
    this._job = scheduleJob.apply(null, args);
  };

  /**
   * The underlying cron-job. Can be used to e.g. re-schedule or cancel
   * a job.
   * 
   * @returns {Job}
   */
  get cronJob() {
    return this._job;
  };
};


module.exports = Object.freeze({
  CronSchedule
});
