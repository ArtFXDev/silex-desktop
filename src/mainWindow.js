const { BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

/**
 * Create the browser window.
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 480,
    webviewTag: true,
    backgroundColor: "#2c2b2b",
    show: false,
    icon: path.join(__dirname, "assets", "images", "256x256.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Show the window when ready to avoid visual blinking
  // See : https://www.electronjs.org/docs/api/browser-window#setting-backgroundcolor
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Disable menu bar
  mainWindow.setMenuBarVisibility(false);

  // Serves the silex frontend directly
  mainWindow.loadURL(process.env.SILEX_FRONT_URL);

  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.loadURL(
      path.join("file:/", __dirname, "pages", "failed-loading.html") +
        `?SILEX_FRONT_URL=${process.env.SILEX_FRONT_URL}`
    );
  });

  module.exports.mainWindow = mainWindow;
}

/**
 * Open the main window, bring it to front otherwise recreate it
 */
function openMainWindow() {
  if (!module.exports.mainWindow.isDestroyed()) {
    // Bring it to the front
    module.exports.mainWindow.show();
    console.log("Window is still there");
  } else {
    createMainWindow();
    console.log("creating window");
  }
}

module.exports = {
  mainWindow,
  createMainWindow,
  openMainWindow,
};
