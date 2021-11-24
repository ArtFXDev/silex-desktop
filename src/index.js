const { app, BrowserWindow, Menu, Tray } = require("electron");
const socketServer = require("@artfxdev/silex-socket-service");
const path = require("path");
const mainWindow = require("./mainWindow");
const AutoLaunch = require("auto-launch");
const { toggleNimby } = require("./utils/blade");

// Early exit to prevent the application to be opened twice
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

const IMAGES_DIR = path.join(__dirname, "assets", "images");
let tray;

/**
 * Add the tray menu (app icon in task bar)
 */
function createTrayMenu() {
  tray = new Tray(path.join(IMAGES_DIR, "256x256.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Silex",
      type: "normal",
      click: mainWindow.openMainWindow,
    },
    { type: "separator" },
    {
      label: `Toggle Nimby`,
      click: () => toggleNimby().then(updateTrayIcon),
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

  tray.setToolTip("Silex pipeline app");
  tray.setContextMenu(contextMenu);
  tray.on("click", mainWindow.openMainWindow);
}

/**
 * Updates the ray icon with the nimby status (green is on and red is off)
 */
function updateTrayIcon(nimbyON) {
  tray.setImage(path.join(IMAGES_DIR, `256x256${nimbyON ? "" : "_off"}.png`));
}

app.on("second-instance", () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow && mainWindow.mainWindow) {
    if (mainWindow.mainWindow.isMinimized()) mainWindow.mainWindow.restore();
    mainWindow.mainWindow.show();
    mainWindow.mainWindow.focus();
  }
});

process.on("uncaughtException", function (error) {
  console.log(error);
});

/**
 * Called when the electron process is ready
 */
app.whenReady().then(() => {
  // Create tray menu and window
  createTrayMenu();
  mainWindow.createMainWindow();

  // Register IPC events
  require("./ipc");

  // Start Nimby monitoring
  require("./utils/nimby").startNimbyEventLoop();

  // Run the socket server
  socketServer.run();

  // Specific to macos
  // See: https://www.electronjs.org/docs/latest/api/app#event-activate-macos
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow.createMainWindow();
    }
  });

  // Prevent closing the app when the main window is closed
  app.on("window-all-closed", (e) => e.preventDefault());

  // start on startup
  const silexLauncher = new AutoLaunch({
    name: "SilexDesktop",
    path: app.getPath("exe"),
  });

  silexLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) silexLauncher.enable();
  });
});

module.exports = { updateTrayIcon };
