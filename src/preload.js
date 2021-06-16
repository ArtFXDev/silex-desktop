const { contextBridge, ipcRenderer } = require('electron');

const websocket = require('./ws/ws.js');

/**
 * Exposing Node API methods to the renderer process (front)
 * For more information see :
 *   - https://www.electronjs.org/docs/api/context-bridge
 *   - https://www.electronjs.org/docs/tutorial/context-isolation
 */
contextBridge.exposeInMainWorld(
  'electron', {
    openDCC: (name) => ipcRenderer.send('openDCC', {name: name}),
    getDCCClients: () => ipcRenderer.send('getDCCClients'),
  }
);
