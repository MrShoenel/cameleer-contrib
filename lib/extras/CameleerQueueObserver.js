const { CameleerQueue } = require('cameleer')
, { Job, ProgressNumeric, JobQueueEvent, JobQueueCapabilities, Rx } = require('sh.orchestration-tools')
, { EventEmitter } = require('events')
, fromEvent = Rx.fromEvent
, Observable = Rx.Observable
, Subscription = Rx.Subscription
, symbolCameleerQueueChanged = Symbol('cameleerQueueChanged');


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class CameleerQueueObserver extends EventEmitter {
  /**
   * @param {CameleerQueue} queue
   */
  constructor(queue) {
    super();
    this.cameleerQueue = queue;
    this.queue = queue.queue;

    /** @type {Array.<Subscription>} */
    this._subscriptions = [];

    this._subscriptions.push(this.queue.observableRun.subscribe(jqEvt => {
      this._emitQueueChanged(jqEvt);
    }));

    this._subscriptions.push(this.queue.observableIdle.subscribe(jqEvt => {
      this._emitQueueChanged(jqEvt);
    }));

    this._subscriptions.push(this.queue.observableDone.subscribe(jqEvt => {
      this._emitQueueChanged(jqEvt);
    }));

    this._subscriptions.push(this.queue.observableFailed.subscribe(jqEvt => {
      this._emitQueueChanged(jqEvt);
    }));

    /** @type {Observable.<QueueInfoComplete>} */
    this.observable = fromEvent(this, symbolCameleerQueueChanged);
  };

  /**
   * @param {JobQueueEvent} jqEvt
   */
  _emitQueueChanged(jqEvt) {
    this.emit(symbolCameleerQueueChanged, this.createInfo(jqEvt));
  };

  teardown() {
    this._subscriptions.forEach(subs => subs.unsubscribe());
    this._subscriptions.splice(0, this._subscriptions.length);
  };

  /**
   * @param {JobQueueEvent} jqEvt
   * @returns {QueueInfoComplete}
   */
  createInfo(jqEvt) {
    const c = this.cameleerQueue, q = this.queue;

    const jobsBacklog = q.queue.map(j => CameleerQueueObserver.getJobInfo(j))
    , jobsCurrent = q.currentJobs.map(j => CameleerQueueObserver.getJobInfo(j))
    , jobsAll = jobsBacklog.concat(jobsCurrent)
    , isCostQ = q instanceof JobQueueCapabilities;

    return {
      info: {
        config: c.config,
        isDefault: c.isDefault,
        isParallel: c.isParallel,
        name: c.name
      },
      jobs: {
        all: {
          infos: jobsAll,
          agg: CameleerQueueObserver.getAggregateJobInfo(jobsAll)
        },
        current: {
          infos: jobsCurrent,
          agg: CameleerQueueObserver.getAggregateJobInfo(jobsCurrent)
        },
        backlog: {
          infos: jobsBacklog,
          agg: CameleerQueueObserver.getAggregateJobInfo(jobsBacklog)
        }
      },
      backlog: q.backlog,
      backlogCost: isCostQ ? q.backlogCost : null,
      capabilities: isCostQ ? q.capabilities : null,
      capabilitiesFree: isCostQ ? q.capabilitiesFree : null,
      capabilitiesUsed: isCostQ ? q.capabilitiesUsed : null,
      isBusy: q.isBusy,
      isIdle: q.isIdle,
      isPaused: q.isPaused,
      isWorking: q.isWorking,
      load: q.load,
      utilization: q.utilization,
      numJobsDone: q.numJobsDone,
      numJobsFailed: q.numJobsFailed,
      numJobsRunning: q.numJobsRunning,
      numParallel: isCostQ ? null : q.numParallel,
      workDone: q.workDone,
      workFailed: q.workFailed
    };
  };

  /**
   * @param {Job.<*>} job
   * @returns {JobInfo}
   */
  static getJobInfo(job) {
    return {
      cost: job.cost,
      hasCost: job.hasCost,
      hasFailed: job.hasFailed,
      isDone: job.isDone,
      isRunning: job.isRunning,
      supportsProgress: job.supportsProgress,
      progressInfo: job.supportsProgress && job.progress instanceof ProgressNumeric ? {
        min: job.progress.progressMin,
        max: job.progress.progressMax,
        last: job.progress.last || 0,
        range : job.progress.progressRange
      } : null
    };
  };

  /**
   * @param {Array.<JobInfo>} jobs
   * @returns {JobInfoAgg}
   */
  static getAggregateJobInfo(jobs) {
    const jobsWithNumericProgress = jobs.filter(j => j.progressInfo !== null);

    return {
      qty: jobs.length,
      totalCost: jobs.map(j => j.hasCost ? j.cost : 0)
        .reduce((prev, curr) => prev + curr, 0),
      numFailed: jobs.filter(j => j.hasFailed).length,
      numDone: jobs.filter(j => j.isDone).length,
      numRunning: jobs.filter(j => j.isRunning).length,
      // Averages all Jobs with numeric progress
      avgProgress: jobsWithNumericProgress.map(j => {
        const pi = j.progressInfo;

        if (!pi.last || pi.last === pi.min) {
          return 0;
        }

        return (pi.last - pi.range) / pi.range;
      }).reduce((prev, curr) => prev + curr, 0) / jobsWithNumericProgress
    }
  };
};


module.exports = Object.freeze({
  CameleerQueueObserver
});
