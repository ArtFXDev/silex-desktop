const { BrowserWindow, app } = require("electron");
const { autoUpdater } = require("electron-updater");
const updateWindow = require("./windows/update");
const path = require("path");
const logger = require("./utils/logger");

// The main window is singleton-like
let mainWindow = null;

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
    autoUpdater.checkForUpdatesAndNotify();
    setTitleVersion();
  });

  mainWindow.on("close", function (event) {
    event.preventDefault();
    mainWindow.hide();
    return false;
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

  autoUpdater.on("error", (err) => {
    logger.error(err);
  });

  autoUpdater.on("update-available", () => {
    logger.info("update available");
    openUpdateWindow();
  });

  autoUpdater.on("update-downloaded", () => {
    logger.info("update downloaded");
    updateWindow.onUpdateDownloaded();
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
  } else {
    createMainWindow();
  }
}

/**
 * Called when a new update of the application is found on GitHub
 */
function openUpdateWindow() {
  updateWindow.createUpdateWindow();
}

function setTitleVersion() {
  let { currentVersion } = "";

  if (process.env.NODE_ENV === "development") {
    currentVersion = require("../package.json").version;
  } else {
    currentVersion = app.getVersion();
  }

  mainWindow.setTitle(`Silex v${currentVersion}`);
}

module.exports = {
  mainWindow,
  createMainWindow,
  openMainWindow,
};
