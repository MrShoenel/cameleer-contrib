require('./web/shared');


const Joi = require('joi')
, path = require('path')
, expressWs = require('express-ws')
, express = require('express')
, opn = require('opn')
, { Socket } = require('net')
, { Cameleer, Manager, ManagerConfigSchema, ManualSchedule, SubClassRegister } = require('cameleer')
, { CameleerQueueObserver } = require('../../extras/CameleerQueueObserver');



/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
const AngularSimpleWebManagerSchema = Joi.concat(Joi.object().keys({
  port: Joi.number().integer().min(1).max(2<<15).required(),
  openBrowser: Joi.boolean().default(false).optional()
})).concat(ManagerConfigSchema);


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class AngularSimpleWebManager extends Manager {
  /**
   * @param {Cameleer} cameleerInstance 
   * @param {AngularSimpleWebConfig} config 
   */
  constructor(cameleerInstance, config) {
    super(cameleerInstance, config);

    this.expressApp = expressWs(express()
      .use(express.static(path.resolve(__dirname))));

    this.expressServer = this.expressApp.app.listen(config.port);
    /** @type {Array.<Socket>} */
    this._sockets = [];
    this.expressServer.on('connection', socket => {
      this._sockets.push(socket);
    });

    /** @type {WebSocket} */
    this.wsClient = null;
    /** @type {Array.<WebSocket>} */
    this._webSockets = [];
    this.expressApp.app.ws('/ws', (ws, req) => {
      this._webSockets.push(ws);
      ws.on('message', data => {
        this._handleWsMessage(data);
      });

      const rmWs = () => {
        this._webSockets.splice(this._webSockets.findIndex(w => w === ws), 1);
      };

      ws.on('error', () => rmWs());
      ws.on('close', () => rmWs());
    });

    /** @type {Array.<Subscription>} */
    this._subscriptions = [];

    this._subscriptions.push(this.cameleer.inMemoryLogger.observableMessagesLogged.subscribe(msgEvt => {
      this._sendWsAll({
        typeId: 2,
        payload: AngularSimpleWebManager._toLogMessage(msgEvt.params[0])
      });
    }));

    this.queueObservers = this.cameleer._queuesArr.map(cq => new CameleerQueueObserver(cq));
    this.queueObservers.forEach(async obs => {
      await this._sendWsAll({
        typeId: 3,
        payload: obs.createInfo()
      });

      this._subscriptions.push(obs.observable.subscribe(async evt => {
        await this._sendWsAll({
          typeId: 3,
          payload: evt
        });
      }));
    });

    if (config.openBrowser) {
      opn(`http://localhost:${config.port}/web/`).catch(_ => {});
    }
  };

  /**
   * @returns {ObjectSchema}
   */
  get schemaConf() {
    return AngularSimpleWebManagerSchema;
  };

  /**
   * 
   */
  teardown() {
    this._subscriptions.forEach(subs => subs.unsubscribe());
    this.queueObservers.forEach(obs => obs.teardown());

    return new Promise(async(resolve, _) => {
      this.expressServer.close(() => {
        setTimeout(() => {
          resolve(); // So it's triggered after this method.
        }, 0);
      });

      this._webSockets.forEach(ws => {
        try {
          ws.close();
        } catch (e) { }
      });
      this._webSockets.splice(0, this._webSockets.length);

      this._sockets.forEach(socket => {
        try {
          socket.destroy();
        } catch (e) { }
      });
      this._sockets.splice(0, this._sockets.length);

      await super.teardown();
    });
  };


  /**
   * @param {WsMessage} msg
   */
  _sendWsAll(msg) {
    const asString = JSON.stringify(msg);
    this._webSockets.forEach(async ws => {
      try {
        ws.send(asString);
      } catch (e) { }
    });
  };

  /**
   * 
   * @param {InMemoryMessage} msg
   * @returns {LogMessage}
   */
  static _toLogMessage(msg) {
    return {
      date: msg.dateString,
      time: msg.timeString,
      msg: msg.state,
      type: msg.typeString,
      level: msg.logLevel,
      asString: msg.toString()
    };
  };

  /**
   * @param {string} msgEvt
   */
  _handleWsMessage(msgEvt) {
    /** @type {WsMessage} */
    const msg = JSON.parse(msgEvt);

    switch (msg.typeId) {
      case 1: //WsMessageTypes.getLogMessages:
        /** @type {Array.<LogMessage>} */
        const payload = this.cameleer.inMemoryLogger.messagesArray().map(AngularSimpleWebManager._toLogMessage);
        this._sendWsAll({ typeId: msg.typeId, payload })
        break;
      case 3:
        this.queueObservers.forEach(async obs => {
          await this._sendWsAll({
            typeId: 3,
            payload: obs.createInfo()
          });
        });
        break;
      case 4:
        this._sendWsAll({
          typeId: 4,
          payload: this.cameleer._tasksArr.map(task => {
            /** @type {TaskInfo} */
            const ti = {
              name: task.name,
              type: task.config.type instanceof Function ? task.config.type.name : task.config.type,
              allowTrigger: task.config.schedule instanceof ManualSchedule,
              scheduleType: task.config.schedule.constructor.name
            };
            return ti;
          })
        });
        break;
      case 5:
        /** @type {TaskInfo} */
        const ti = msg.payload;
        this.cameleer._tasks[ti.name].config.schedule.trigger();
        break;
    }
  };
};


SubClassRegister.registerSubclass(AngularSimpleWebManager);


module.exports = Object.freeze({
  AngularSimpleWebManagerSchema,
  AngularSimpleWebManager
});
