const { inspect } = require('util')
, { Schedule, Scheduler, ScheduleEvent, ManualSchedule, ManualScheduler,
  Interval, IntervalScheduler, Calendar, CalendarScheduler, ManualScheduleEventSimple
  } = require('sh.orchestration-tools')
, { Observable, merge } = require('rxjs')
, { map } = require('rxjs/operators')
, { EventEmitter } = require('events')
, symbolMultiSchedulerEvent = Symbol('multiSchedulerEvent')



/**
 * A Scheduler that internally has all currently known Schedulers (Interval,
 * Calendar, Manual) and can add/remove/hold any of their Schedules. This
 * Scheduler is useful for abstracting away the actual type of Schedule or
 * when it is not important.
 * 
 * @author Sebastian Hönel <development@hoenel.net>
 */
class MultiScheduler extends Scheduler {
  /**
   * @param {...Schedule} schedules
   */
  constructor(...schedules) {
    super(symbolMultiSchedulerEvent);

    this._schedManual = new ManualScheduler();
    this._schedInterval = new IntervalScheduler();
    this._schedCalendar = new CalendarScheduler();
    
    merge(
      this._schedManual.observable,
      this._schedInterval.observable,
      this._schedCalendar.observable
    ).subscribe(schedEvt => {
      this.emit(this._symbol, schedEvt);
    });

    schedules.forEach(schedule => this.addSchedule(schedule));
  };

  /**
   * @param {Schedule} schedule
   * @returns {Scheduler}
   */
  _getScheduleForType(schedule) {
    if (schedule instanceof ManualSchedule) {
      return this._schedManual;
    } else if (schedule instanceof Interval) {
      return this._schedInterval;
    } else if (schedule instanceof Calendar) {
      return this._schedCalendar;
    }

    throw new Error(`The schedule is not supported: ${schedule.constructor.name}, ${inspect(schedule)}`);
  };

  /**
   * Add a Schedule to this scheduler. This is an abstract method.
   * 
   * @inheritDoc
   * @param {Schedule} schedule
   * @returns {this}
   */
  addSchedule(schedule) {
    return this._getScheduleForType(schedule).addSchedule(schedule);
  };

  /**
   * Remove a Schedule from this scheduler. This is an abstract method.
   * 
   * @inheritDoc
   * @param {Schedule} schedule
   * @returns {this}
   */
  removeSchedule(schedule) {
    return this._getScheduleForType(schedule).removeSchedule(schedule);
  };

  /**
   * Returns a value indicating whether this Scheduler has the given
   * Schedule. This is an abstract method.
   * 
   * @inheritDoc
   * @param {Schedule} schedule
   * @returns {this}
   */
  hasSchedule(schedule) {
    return this._getScheduleForType(schedule).removeSchedule(schedule);
  };

  /**
   * @inheritDoc
   * @template T Must be of type ScheduleEvent or more derived.
   * @param {T|Schedule} schedule
   * @returns {Observable.<T|ScheduleEvent>} An Observable for the designated schedule.
   */
  getObservableForSchedule(schedule) {
    return this._getScheduleForType(schedule).getObservableForSchedule(schedule);
  };
};



/**
 * A Schedule that can be comrpised of many schedules. This is useful if
 * many schedules need to be merged into one.
 * 
 * @author Sebastian Hönel <development@hoenel.net>
 */
class MultiSchedule extends ManualSchedule {
  constructor(enabled) {
    super(!!enabled);

    this._multiScheduler = new MultiScheduler();
    this._observable = merge(
      super.observable.pipe(map(item => new ManualScheduleEventSimple(this, item))),
      this._multiScheduler.observable
    );

    this._subs = this.observable.subscribe(schedEvent => {
      this._emitter.emit(symbolMultiSchedulerEvent, schedEvent);
    });
  };

  /**
   * Use this property to access the Scheduler to add Schedules to this
   * MultiSchedule.
   * 
   * @returns {MultiScheduler}
   */
  get scheduler() {
    return this._multiScheduler;
  };

  /**
   * This Observable emits ScheduleEvents from all Schedules.
   * 
   * @returns {Observable.<ScheduleEvent.<any, any>>}
   */
  get observable() {
    return this._observable;
  };
};


module.exports = Object.freeze({
  MultiSchedule,
  MultiScheduler,
  symbolMultiSchedulerEvent
});
