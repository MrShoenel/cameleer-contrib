const { ManualSchedule, PreliminaryScheduleEvent } = require('sh.orchestration-tools')
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

  async teardown() {
    this.cronJob.cancel();
    return await super.teardown();
  };

  /**
   * Returns all pending invocations in the specified Date-range.
   * 
   * @inheritDoc
   * @see {http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.1}
   * @param {Date} [after] Optional. Defaults to the minimum allowed date.
   * @param {Date} [before] Optiona. Defaults to the maximum allowed date.
   * @returns {IterableIterator.<PreliminaryScheduleEvent.<CronSchedule, undefined>>}
   */
  *preliminaryEvents(after, before) {
    after = after instanceof Date ? after : new Date(-8640000000000000);
    before = before instanceof Date ? before : new Date(8640000000000000);

    const a = +after, b = +before
    , invocs = this._job.pendingInvocations().filter(invoc => {
      const ts = +invoc.fireDate;
      return ts >= a && ts < b;
    });

    for (const i of invocs) {
      yield new PreliminaryScheduleEvent(i.fireDate, this);
    }
  };
};


module.exports = Object.freeze({
  CronSchedule
});
