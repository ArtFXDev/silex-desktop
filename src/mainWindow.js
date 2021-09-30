const { BrowserWindow } = require("electron")
const path = require("path")
const silexSocketService = require("@artfxdev/silex-socket-service/src/index")

// The main window kind of singleton
let mainWindow
module.exports.mainWindow = mainWindow

/**
 * Create the browser window.
 */
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 940,
    minHeight: 480,
    webviewTag: true,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    backgroundColor: "rgb(40, 39, 39)",
    show: false,
    icon: path.join(__dirname, "256x256.png")
  })

  // Show the window when ready to avoid visual blinking
  // See : https://www.electronjs.org/docs/api/browser-window#setting-backgroundcolor
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
    mainWindow.focus()
    silexSocketService.run()
  })

  // Disable menu bar
  mainWindow.setMenuBarVisibility(false)

  // Check if running in dev mode
  if (process.env.NODE_ENV.includes("dev")) {
    mainWindow.loadURL("http://localhost:3000")
    // Open dev tools console
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(`file://${process.resourcesPath}/build/html/index.html`)
  }
}

/**
 * Open the main window, bring it to front otherwise recreate it
 */
function openMainWindow () {
  if (!mainWindow.isDestroyed()) {
    // Bring it to the front
    mainWindow.show()
  } else {
    createMainWindow()
  }
}

module.exports = {
  createMainWindow: createMainWindow,
  openMainWindow: openMainWindow
}
