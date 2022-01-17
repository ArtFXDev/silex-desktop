const { app, Menu, Tray, Notification } = require("electron");
const path = require("path");
const mainWindow = require("./windows/main");
const store = require("./utils/store");
const logger = require("./utils/logger");
const { autoUpdater } = require("electron-updater");
const { persistStore } = require("./utils/store/persistence");
const blade = require("./utils/blade");
const silexSocketService = require("@artfxdev/silex-socket-service");
const { setLogLevel } = require("./utils/settings");

const IMAGES_DIR = path.join(__dirname, "assets", "images");
let tray;

/**
 * Sets the front mode to either prod, beta or dev
 * It reloads the cache and update the store
 */
function setFrontMode(mode) {
  store.instance.data.frontMode = mode;
  persistStore();

  mainWindow.mainWindow.webContents.session.clearCache(() =>
    logger.info("Cleared window cache")
  );

  mainWindow.loadSilexFrontUrl();
}

/**
 * Same for the rez packages but they are stored in the socket service library
 */
function setRezPackagesMode(mode) {
  silexSocketService.store.instance.data.rezPackagesMode = mode;
  silexSocketService.persistStore();
  mainWindow.setTitleVersion();
}

/**
 * Updates the tray icon with the nimby status (green is on and red is off)
 */
function updateTrayIcon(nimbyON) {
  tray.setImage(path.join(IMAGES_DIR, `256x256${nimbyON ? "" : "_off"}.png`));
}

/**
 * Builds the tray menu
 */
function updateTrayMenu(nimbyON = false) {
  updateTrayIcon(nimbyON);

  const possibleModes = ["prod", "beta", "dev"];

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Silex",
      type: "normal",
      click: mainWindow.openMainWindow,
    },
    { type: "separator" },
    {
      label: `Toggle Nimby ${nimbyON ? "OFF" : "ON"}`,
      click: () => blade.toggleNimby(),
    },
    { type: "separator" },
    {
      label: "Check for Updates...",
      click: () => {
        logger.info("Checking for updates...");
        new Notification({
          title: "Silex",
          body: "Checking for updates...",
        }).show();
        autoUpdater.checkForUpdatesAndNotify();
      },
    },
    { type: "separator" },
    {
      label: "Advanced",
      submenu: [
        {
          label: "UI mode",
          submenu: possibleModes.map((mode) => ({
            label: mode,
            type: "radio",
            checked: store.instance.data.frontMode === mode,
            click: () => setFrontMode(mode),
          })),
        },
        {
          label: "Python mode",
          submenu: possibleModes.map((mode) => ({
            label: mode,
            type: "radio",
            checked:
              silexSocketService.store.instance.data.rezPackagesMode === mode,
            click: () => setRezPackagesMode(mode),
          })),
        },
        {
          label: "Log level",
          submenu: ["WARNING", "INFO", "DEBUG"].map((logLevel) => ({
            label: logLevel,
            type: "radio",
            checked: store.instance.data.logLevel === logLevel,
            click: () => setLogLevel(logLevel),
          })),
        },
        {
          label: "Update threshold",
          submenu: [0, 5, 10, 100, 500, 2000].map((threshold) => ({
            label: `${threshold}ms`,
            type: "radio",
            checked:
              parseInt(process.env.SILEX_UPDATE_THRESHOLD || 10) === threshold,
            click: () => (process.env.SILEX_UPDATE_THRESHOLD = threshold),
          })),
        },
      ],
    },
    { type: "separator" },
    {
      label: "Quit Silex",
      type: "normal",
      click: () => {
        app.quit();
        app.exit();
      },
    },
  ]);

  // Apply the menu to the tray
  tray.setContextMenu(contextMenu);
}

/**
 * Initializes the tray menu
 */
function initializeTray() {
  tray = new Tray(path.join(IMAGES_DIR, "256x256.png"));

  tray.on("click", mainWindow.openMainWindow);
  tray.setToolTip("Silex desktop");

  // Update the tray icon with the blade status
  blade.getBladeStatus().then((response) => {
    updateTrayMenu(response.data.nimbyON);
  });

  updateTrayMenu();
}

module.exports = { tray, updateTrayMenu, initializeTray };
