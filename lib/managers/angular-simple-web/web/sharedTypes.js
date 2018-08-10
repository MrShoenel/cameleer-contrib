
const WsMessageTypes = Object.freeze({
  getLogMessages: 1,
  pushLogMessage: 2,
  getQueueInfo: 3,
  getTasks: 4,
  enqueueTask: 5
});

export {
  WsMessageTypes
};
