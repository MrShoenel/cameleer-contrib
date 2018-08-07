const Joi = require('joi')
, path = require('path')
, expressWs = require('express-ws')
, express = require('express')
, { Socket } = require('net')
, { Cameleer, Manager, ManagerConfigSchema, SubClassRegister } = require('cameleer');


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
const AngularSimpleWebManagerSchema = Joi.concat(Joi.object().keys({
  port: Joi.number().integer().min(1).max(2<<15).required()
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
      .use(express.static(path.resolve(path.join(__dirname, './web')))));

    this.expressServer = this.expressApp.app.listen(config.port);
    /** @type {Array.<Socket>} */
    this._sockets = [];
    this.expressServer.on('connection', socket => {
      this._sockets.push(socket);
    });
    this.expressApp.app.ws('/ws', (ws, req) => {
      ws.on('message', data => {
        ws.send(data); // Just do echo as test for now.
      });
    });
  };

  /**
   * @returns {ObjectSchema}
   */
  schemaConf() {
    return AngularSimpleWebManagerSchema;
  };

  /**
   * 
   */
  teardown() {
    return new Promise(async(resolve, reject) => {
      this.expressServer.close(() => {
        resolve();
      });

      this._sockets.forEach(socket => socket.destroy());

      await super.teardown();
    });
  };
};


SubClassRegister.registerSubclass(AngularSimpleWebManager);


module.exports = Object.freeze({
  AngularSimpleWebManagerSchema,
  AngularSimpleWebManager
});
