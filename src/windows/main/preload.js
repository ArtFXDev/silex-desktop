const { contextBridge, ipcRenderer } = require("electron");

const validSendChannels = [
  "openSilexFront",
  "bringWindowToFront",
  "restartApp",
  "closeSilexUpdate",
  "updateDownloaded",
  "setNimbyStatus",
  "setNimbyAutoMode",
  "killAllActiveTasksOnBlade",
  "openPath",

  "mkdir",
];

const validSendSyncChannels = ["pathExists"];

/**
 * Exposing Node API methods to the renderer process (front)
 * For more information see :
 *   - https://stackoverflow.com/questions/44391448/electron-require-is-not-defined
 *   - https://www.electronjs.org/docs/api/context-bridge
 *   - https://www.electronjs.org/docs/tutorial/context-isolation
 */
contextBridge.exposeInMainWorld("electron", {
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      return ipcRenderer.send(channel, data);
    } else {
      throw new Error("channel is not exposed from Electron");
    }
  },
  sendSync: (channel, data) => {
    if (validSendSyncChannels.includes(channel)) {
      return ipcRenderer.sendSync(channel, data);
    } else {
      throw new Error("channel is not exposed from Electron");
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      "updateDownloaded",
      "bladeStatusUpdate",
      "operationSuccess",
      "operationError",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  },
});
