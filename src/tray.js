const { app, Menu, Tray } = require("electron");
const path = require("path");
const mainWindow = require("./mainWindow");
const store = require("./utils/store");
const logger = require("./utils/logger");
const { autoUpdater } = require("electron-updater");
const { persistStore } = require("./utils/store/persistence");
const blade = require("./utils/blade");

let tray;
const IMAGES_DIR = path.join(__dirname, "assets", "images");

/**
 * Updates the ray icon with the nimby status (green is on and red is off)
 */
function updateTrayIcon(nimbyON) {
  tray.setImage(path.join(IMAGES_DIR, `256x256${nimbyON ? "" : "_off"}.png`));
}

function setFrontMode(mode) {
  store.instance.data.frontMode = mode;
  persistStore();

  mainWindow.mainWindow.webContents.session.clearCache(() =>
    logger.info("Cleared window cache")
  );

  mainWindow.loadSilexFrontUrl();
}

/**
 * Add the tray menu (app icon in task bar)
 */
function updateTrayMenu(nimbyON = false) {
  updateTrayIcon(nimbyON);

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
        autoUpdater.checkForUpdatesAndNotify();
      },
    },
    { type: "separator" },
    {
      label: "Mode",
      submenu: [
        {
          label: "prod",
          type: "radio",
          checked: store.instance.data.frontMode === "prod",
          click: () => setFrontMode("prod"),
        },
        {
          label: "beta",
          type: "radio",
          checked: store.instance.data.frontMode === "beta",
          click: () => setFrontMode("beta"),
        },
        {
          label: "dev",
          type: "radio",
          checked: store.instance.data.frontMode === "dev",
          click: () => setFrontMode("dev"),
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

  tray.setContextMenu(contextMenu);
}

function initializeTray() {
  // Create tray menu and window
  tray = new Tray(path.join(IMAGES_DIR, "256x256.png"));
  tray.on("click", mainWindow.openMainWindow);
  tray.setToolTip("Silex pipeline app");

  blade.getBladeStatus().then((response) => {
    updateTrayMenu(response.data.nimbyON);
  });
  updateTrayMenu();
}

module.exports = { tray, updateTrayMenu, initializeTray };
