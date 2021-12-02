const { mainWindow } = require("../mainWindow");
const {
  getBladeStatus,
  setNimbyValue,
  killRunningTasksOnBlade,
} = require("./blade");
const { powerMonitor } = require("electron");
const os = require("os-utils");
const findProcess = require("find-process");
const path = require("path");
const CONFIG = require("../config/config.json");
const logger = require("../utils/logger");
const store = require("./store");
const { persistStore } = require("./store/persistence");

let autoInterval = null;

function setNimbyAutoMode(newMode) {
  logger.info(`[NIMBY] Switching nimbyMode to: ${newMode ? "AUTO" : "MANUAL"}`);

  if (newMode) {
    store.instance.data.nimbyAutoMode = true;
    triggerAutoInterval();
    checkIfUsed();
  } else {
    store.instance.data.nimbyAutoMode = false;
    clearInterval(autoInterval);
  }

  persistStore();
}

/**
 * Queries the blade status and send it to the window process with IPC
 */
function sendBladeStatusToFront() {
  getBladeStatus().then((response) => {
    if (mainWindow.isVisible()) {
      mainWindow.webContents.send("bladeStatusUpdate", {
        ...response.data,
        nimbyAutoMode: store.instance.data.nimbyAutoMode,
      });
    }
  });
}

function checkForNimbyAutoMode() {
  logger.info("[NIMBY] Checking for auto mode...");
  const hour = new Date().getHours();

  if (!store.instance.data.nimbyAutoMode && hour >= 19 && hour <= 8) {
    logger.info("[NIMBY] Switching to auto mode");
    setNimbyAutoMode(true);
  }
}

function isUserActive() {
  const idleTime = powerMonitor.getSystemIdleTime();
  logger.info(`[NIMBY] idleTime: ${idleTime}`);
  return idleTime < 40;
}

async function checkCPUUsage() {
  return new Promise((resolve) => {
    os.cpuUsage((cpu) => {
      logger.info("[NIMBY] CPU : " + Math.round(cpu * 100) + "%");
      resolve(Math.round(cpu * 100) < 50);
    });
  });
}

function checkForRunningProcesses() {
  logger.info("[NIMBY] Check for running rocesses ...");

  findProcess("name", "").then((processes) => {
    let processFound = false;

    for (const process of processes) {
      const processName = path.parse(process.name).name;

      if (CONFIG.softwares.includes(processName)) {
        logger.info(
          `[NIMBY] Process ${processName} is running, switching to Nimby ON`
        );
        processFound = true;
      }
    }

    getBladeStatus().then((response) => {
      const nimbyON = response.data.nimby !== "None";
      if (!nimbyON && processFound) setNimbyValue(true);
      if (nimbyON && !processFound) setNimbyValue(false);
    });

    setNimbyValue(processFound);
  });
}

function checkIfUsed() {
  if (isUserActive()) {
    logger.info("[NIMBY] User is active");

    getBladeStatus().then((response) => {
      if (response.data.nimby === "None") {
        setNimbyValue(true).then(() =>
          killRunningTasksOnBlade(response.data.hnm)
        );
      }
    });

    return;
  }

  const hour = new Date().getHours();

  // Check if we check the process (day) or only the resource (night)
  if (hour >= 19 && hour <= 8) {
    logger.info("[NIMBY] Running in night mode");

    // NIGHT MODE
    checkCPUUsage().then((lowUsage) => {
      if (lowUsage) {
        logger.info("[NIMBY] Your pc is not used, set nimby OFF");
        setNimbyValue(false);
      } else {
        // TODO else display message
        logger.info("[NIMBY] Your have high cpu usage, let nimby ON");
        setNimbyValue(true);
      }
    });
  } else {
    // DAY MODE
    logger.info("[NIMBY] Running in day mode");
    checkForRunningProcesses();
  }
}

/**
 * Starts the interval when in auto mode
 */
function triggerAutoInterval() {
  autoInterval = setInterval(checkIfUsed, 60000 * 15);
}

function startNimbyEventLoop() {
  // Sends a ping every X seconds to the frontend that updates the blade status
  setInterval(sendBladeStatusToFront, 4000);

  // Switch to auto mode after a certain hour
  setInterval(checkForNimbyAutoMode, 60000 * 10);

  // By default it's in auto mode
  if (store.instance.data.nimbyAutoMode) triggerAutoInterval();
}

module.exports = {
  sendBladeStatusToFront,
  startNimbyEventLoop,
  setNimbyAutoMode,
};
