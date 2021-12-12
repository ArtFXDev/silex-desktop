const { contextBridge, ipcRenderer } = require("electron");

/**
 * Exposing Node API methods to the renderer process (front)
 * For more information see :
 *   - https://stackoverflow.com/questions/44391448/electron-require-is-not-defined
 *   - https://www.electronjs.org/docs/api/context-bridge
 *   - https://www.electronjs.org/docs/tutorial/context-isolation
 */
contextBridge.exposeInMainWorld("electron", {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = [
      "openSilexFront",
      "bringWindowToFront",
      "restartApp",
      "closeSilexUpdate",
      "updateDownloaded",
      "setNimbyStatus",
      "setNimbyAutoMode",
      "killAllActiveTasksOnBlade",
      "openFolderOrFile",
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
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
