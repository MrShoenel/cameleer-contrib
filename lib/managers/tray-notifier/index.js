require('../../../meta/typedefs');


const Joi = require('joi')
, notifier = require('node-notifier')
, { Cameleer, CameleerQueue, Manager, ManagerConfigSchema, SubClassRegister,
  symbolCameleerWork, symbolCameleerSchedule, symbolCameleerShutdown,
  CameleerWorkEvent } = require('cameleer')
, { CameleerQueueObserver } = require('../../extras/CameleerQueueObserver')
, { symbolIdle, symbolRun, symbolDone, symbolFailed, Rx } = require('sh.orchestration-tools')
, { Observable, Subscription } = Rx
, { BaseLogEvent, symbolMessageLogged, InMemoryLogger, InMemoryLogMessage } = require('sh.log-client');


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
const TrayNotifierManagerSchema = Joi.concat(Joi.object().keys({
  playSounds: Joi.boolean().default(false).optional(),
  queueEvents: Joi.boolean().default(false).optional(),
  notifyWork: Joi.boolean().default(true).optional(),
  notifyLog: Joi.boolean().default(false).optional()
})).concat(ManagerConfigSchema);


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class TrayNotifierManager extends Manager {
  /**
   * @param {Cameleer} cameleerInstance
   * @param {TrayNotifierConfig} config
   */
  constructor(cameleerInstance, config) {
    super(cameleerInstance, config);

    /** @type {(evt: CameleerWorkEvent) => void} */
    this.workHandler = null;
    if (config.notifyWork) {
      this.workHandler = function(workEvt) {
        /** @type {CameleerWorkEvent} */
        const we = workEvt
        , taskTypeName = typeof we.task.config.type === 'string' ? we.task.config.type : we.task.config.type.name;
        let message = null;
        switch (we.type) {
          case symbolCameleerSchedule:
            message = `Enqueueing ${taskTypeName} with name ${we.task.name}..`;
            break;
          case symbolRun:
            message = `Running ${taskTypeName} (${we.task.name}), Job #${we.job.id}..`;
            break;
          case symbolDone:
            message = `Successfully finished ${taskTypeName} (${we.task.name}), Job #${we.job.id}.`;
            break;
          case symbolFailed:
            message = `Failed: ${taskTypeName} (${we.task.name}), Job #${we.job.id}.`;
            break;
        }

        notifier.notify({
          title: CameleerWorkEvent.name,
          sound: this.config.playSounds,
          message
        });
      }.bind(this);

      this.cameleer.on(symbolCameleerWork, this.workHandler);
    }

    /** @type {(baseLogEvent: BaseLogEvent.<InMemoryLogger.<*>>) => void} */
    this.logHandler = null;
    if (config.notifyLog) {
      this.logHandler = function(baseLogEvent) {
        /** @type {BaseLogEvent.<InMemoryLogger.<*>>} */
        const ble = baseLogEvent;
        /** @type {InMemoryLogMessage} */
        const msg = ble.params[0];

        notifier.notify({
          title: Cameleer.name,
          sound: this.config.playSounds,
          message: msg.toString()
        });
      }.bind(this);

      this.cameleer.inMemoryLogger.on(symbolMessageLogged, this.logHandler);
    }

    /** @type {Array.<Subscription>} */
    this.queueSubscriptions = [];
    if (config.queueEvents) {
      this.cameleer._queuesArr.forEach(cq => {
        this.queueSubscriptions.push(cq.queue.observableRun.subscribe(jqEvt => {
          notifier.notify({
            sound: this.config.playSounds,
            title: `${CameleerQueue.name}: ${cq.name}`,
            message: `Running Job ${jqEvt.job.id}..`
          });
        }));
        this.queueSubscriptions.push(cq.queue.observableDone.subscribe(jqEvt => {
          notifier.notify({
            sound: this.config.playSounds,
            title: `${CameleerQueue.name}: ${cq.name}`,
            message: `Job ${jqEvt.job.id} is done.`
          });
        }));
        this.queueSubscriptions.push(cq.queue.observableIdle.subscribe(jqEvt => {
          notifier.notify({
            sound: this.config.playSounds,
            title: `${CameleerQueue.name}: ${cq.name}`,
            message: `This Queue is now idle.`
          });
        }));
        this.queueSubscriptions.push(cq.queue.observableFailed.subscribe(jqEvt => {
          notifier.notify({
            sound: this.config.playSounds,
            title: `${CameleerQueue.name}: ${cq.name}`,
            message: `Job ${jqEvt.job.id} has failed.`
          });
        }));
      });
    }

    this.idleHandler = function() {
      notifier.notify({
        title: Cameleer.name,
        sound: this.config.playSounds,
        message: 'Cameleer is idle.'
      });
    }.bind(this);

    this.shutdownHandler = function() {
      notifier.notify({
        title: Cameleer.name,
        sound: this.config.playSounds,
        message: 'Cameleer is shutting down.'
      });
    }.bind(this);

    this.cameleer.on(symbolIdle, this.idleHandler);
    this.cameleer.on(symbolCameleerShutdown, this.shutdownHandler);
  };

  /**
   * @returns {ObjectSchema}
   */
  get schemaConf() {
    return TrayNotifierManagerSchema;
  };

  async teardown() {
    if (this.workHandler !== null) {
      this.cameleer.off(symbolCameleerWork, this.workHandler);
    }

    if (this.logHandler !== null) {
      this.cameleer.off(symbolMessageLogged, this.logHandler);
    }

    this.queueSubscriptions.forEach(s => s.unsubscribe());

    this.cameleer.off(symbolIdle, this.idleHandler);
    this.cameleer.off(symbolCameleerShutdown, this.shutdownHandler);

    await super.teardown();
  };
};


SubClassRegister.registerSubclass(TrayNotifierManager);


module.exports = Object.freeze({
  TrayNotifierManagerSchema,
  TrayNotifierManager
});
