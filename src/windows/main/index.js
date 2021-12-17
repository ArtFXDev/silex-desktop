const { BrowserWindow, app } = require("electron");
const path = require("path");
const logger = require("../../utils/logger");
const store = require("../../utils/store");
const silexSocketService = require("@artfxdev/silex-socket-service");

// The main window is singleton-like
let mainWindow = null;

/**
 * Create the main Silex window
 */
function createMainWindow(hidden = false) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 480,
    backgroundColor: "#2c2b2b",
    show: false,
    icon: `${__dirname}/../../assets/images/256x256.png`,
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
  mainWindow.on("ready-to-show", () => {
    if (!hidden) {
      mainWindow.show();
      mainWindow.focus();
    }
    setTitleVersion();
  });

  // Do not close the window on close but hide it
  mainWindow.on("close", function (event) {
    event.preventDefault();
    mainWindow.hide();
    return false;
  });

  // Disable menu bar
  mainWindow.setMenuBarVisibility(false);

  const frontUrl = getSilexFrontUrl();
  mainWindow.loadURL(frontUrl);

  // Show the fail to load window
  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.loadURL(
      path.join("file:/", __dirname, "failed-loading.html") +
        `?SILEX_FRONT_URL=${getSilexFrontUrl()}`
    );
  });

  module.exports.mainWindow = mainWindow;
}

/**
 * Returns the
 */
function getSilexFrontUrl() {
  switch (store.instance.data.frontMode) {
    case "beta":
      return process.env.SILEX_FRONT_URL.replace("prod", "preprod");
    case "dev":
      return "http://localhost:3000";
    default:
      // prod
      return process.env.SILEX_FRONT_URL;
  }
}

/**
 * Loads the proper url depending on the front-end mode
 */
function loadSilexFrontUrl() {
  const url = getSilexFrontUrl();
  logger.debug(`Loading front url: ${url}`);
  mainWindow.loadURL(url);
  setTitleVersion();
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
 * Sets the title of the window to have the package version
 */
function setTitleVersion() {
  const desktopVersion = require("../../../package.json").version;

  mainWindow.setTitle(
    `Silex v${desktopVersion} [front-${store.instance.data.frontMode}, rez-${silexSocketService.store.instance.data.rezPackagesMode}]`
  );
}

module.exports = {
  mainWindow,
  setTitleVersion,
  createMainWindow,
  openMainWindow,
  loadSilexFrontUrl,
};
