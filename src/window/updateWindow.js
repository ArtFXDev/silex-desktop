const { BrowserWindow } = require("electron");
const path = require("path");
let win;

function createUpdateWindow() {
  win = new BrowserWindow({
    height: 300,
    width: 300,
    autoHideMenuBar: true,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "../preload.js"),
    },
  });
  win.loadURL(`file://${__dirname}/index.html`);

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
    win.setAlwaysOnTop(true, "screen");
  });
}

function closeUpdateWindow() {
  if (!win) {
    return;
  }

  win.close();
}

function onUpdateDownloaded() {
  if (!win) {
    return;
  }

  win.webContents.send("updateDownloaded");
}

module.exports = { createUpdateWindow, closeUpdateWindow, onUpdateDownloaded };
