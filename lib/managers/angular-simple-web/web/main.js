/// <reference path="../node_modules/@types/angular/index.d.ts" />
/// <reference path="../node_modules/@types/angular/jqlite.d.ts" />


import './shared.js';
import { WsMessageTypes} from './sharedTypes.js';


(() => {


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class Controller {
  /**
   * @param {angular.IScope} $scope
   */
  constructor($scope) {
    this.$scope = $scope;
    this._isReady = false;

    /** @type {WebSocket} */
    this._ws = null;
    this._getWs().then(ws => this._ws = ws).catch(_ => {});

    this._maxLogLength = 500;
    /** @type {Array.<LogMessage>} */
    this._logMessages = [];

    /** @type {Array.<QueueInfoComplete>} */
    this._queues = [];

    /** @type {Array.<TaskInfo>} */
    this._tasks = [];


    Promise.all([
      this.loadAllLogEntries(),
      this.loadAllQueues(),
      this.loadAllTasks()
    ]).catch(_ => {});

    this._cameleerPaused = false;
  };

  _truncateLog() {
    const excess = this._logMessages.length - this._maxLogLength;
    if (excess > 0) {
      this._logMessages.splice(this._maxLogLength, excess);
    }
  };

  /** @returns {Array.<LogMessage>} */
  get logMessages() {
    return this._logMessages;
  };

  /** @returns {Array.<QueueInfoComplete>} */
  get queues() {
    return this._queues;
  };

  /**
   * @returns {TaskInfo}
   */
  get tasks() {
    return this._tasks;
  };

  /**
   * @returns {Promise.<WebSocket>}
   */
  _getWs() {
    return new Promise((resolve, _) => {
      if (this._ws === null) {
        this._ws = new WebSocket(`ws://${location.host}/ws`);

        this._ws.addEventListener('open', ev => {
          resolve(this._ws);
        });

        this._ws.onerror = async() => {
          this._ws = null;
          resolve(await this._getWs());
        };

        this._ws.onmessage = async msg => {
          await this._handleWsMsgEvt(msg);
        };
      } else {
        if (this._ws.readyState === WebSocket.OPEN) {
          resolve(this._ws);
        } else {
          const onOpenOld = this._ws.onopen;
          this._ws.addEventListener('open', ev => {
            resolve(this._ws);
          });
        }
      }
    });
  }

  /**
   * @param {MessageEvent} msgEvt
   */
  async _handleWsMsgEvt(msgEvt) {
    /** @type {WsMessage} */
    const msg = JSON.parse(msgEvt.data);

    switch (msg.typeId) {
      case WsMessageTypes.getLogMessages:
        this._logMessages.splice(0, this._logMessages.length);
        /** @type {Array.<LogMessage>} */
        const payload = msg.payload;
        this._logMessages.unshift(...payload);
        this._truncateLog();
        break;
      case WsMessageTypes.pushLogMessage:
        this._logMessages.unshift(msg.payload);
        this._truncateLog();
        break;
      case WsMessageTypes.getQueueInfo:
        /** @type {QueueInfoComplete} */
        const newQ = msg.payload;
        const qIdx = this._queues.findIndex(qic => qic.info.name === newQ.info.name);
        if (qIdx >= 0) {
          this._queues[qIdx] = newQ;
        } else {
          this._queues.push(newQ);
        }
        break;
      case WsMessageTypes.getTasks:
        /** @type {Array.<TaskInfo>} */
        const tasks = msg.payload;
        this._tasks.splice(0, this._tasks.length);
        this._tasks.push(...tasks);
        break;
    }

    this.$scope.$digest();
  };

  /**
   * @param {WsMessage} msg
   */
  async _sendToWs(msg) {
    (await this._getWs()).send(JSON.stringify(msg));
  };


  ////////////////////////////////////////////
  //////// BELOW ONLY ANGULAR VM METHODS
  ////////////////////////////////////////////
  async loadAllLogEntries() {
    await this._sendToWs({
      typeId: WsMessageTypes.getLogMessages
    });
  };

  async loadAllQueues() {
    await this._sendToWs({
      typeId: WsMessageTypes.getQueueInfo
    });
  };

  async loadAllTasks() {
    await this._sendToWs({
      typeId: WsMessageTypes.getTasks
    });
  };

  /**
   * @param {TaskInfo} ti
   */
  async enqueue(ti) {
    await this._sendToWs({
      typeId: WsMessageTypes.enqueueTask,
      payload: ti
    });
  };
};

if (window._inited) {
  return;
}

window._inited = true;
const app = angular.module('app', []);
app.controller('Ctrl', ['$scope', Controller])
  .filter('percentage', [() => {
    return (input, decimals = 2) => {
      return (input * 100).toFixed(decimals) + ' %';
    }
  }]);
angular.bootstrap(document.body, ['app']);


})();