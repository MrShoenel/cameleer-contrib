const Joi = require('joi')
, path = require('path')
, expressWs = require('express-ws')
, express = require('express')
, opn = require('opn')
, { Socket } = require('net')
, { Cameleer, Manager, ManagerConfigSchema, SubClassRegister } = require('cameleer');



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
        ws.send(data); // Just do echo as test for now.
      });
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

      this._sockets.forEach(socket => {
        try {
          socket.destroy();
        } catch (e) { }
      });

      await super.teardown();
    });
  };
};


SubClassRegister.registerSubclass(AngularSimpleWebManager);


module.exports = Object.freeze({
  AngularSimpleWebManagerSchema,
  AngularSimpleWebManager
});
