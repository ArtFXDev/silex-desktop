const axios = require("axios").default;
const logger = require("../utils/logger");
const { asciiToHexa } = require("../utils/string");
const store = require("./store");
const { persistStore } = require("./store/persistence");

const BLADE_URL = "http://localhost:9005";

/**
 * Returns a promise with the blade status
 */
async function getBladeStatus() {
  let response = await axios.get(`${BLADE_URL}/blade/status`);
  response.data.nimbyON = !(response.data.nimby === "None");

  return response;
}

/**
 * Sets the nimby status to ON or OFF. Returns a promise
 */
async function setNimbyValue(newStatus) {
  if (!store.instance.data.nimbyAutoMode) {
    store.instance.data.nimbyStatus = newStatus ? "on" : "off";
    persistStore();
  }
  const { updateTrayMenu } = require("../tray");

  logger.info(`[NIMBY] Setting Nimby value to ${newStatus}`);

  const response = await axios.get(
    `${BLADE_URL}/blade/ctrl?nimby=${newStatus ? 1 : 0}`
  );

  if (response.data.rc === 0) updateTrayMenu(newStatus);
}

/**
 * Toggle the status of the Nimby
 */
async function toggleNimby() {
  const response = await getBladeStatus();
  return await setNimbyValue(response.data.nimby === "None");
}

// For tractor authentication see: https://rmanwiki.pixar.com/display/TRA/Login+Management
async function killRunningTasksOnBlade() {
  // Kill all running jobs with special service running in admin
  const status = await getBladeStatus();
  let pid;

  try {
    for (const process of status.data.pids) {
      pid = process.pid;
      logger.info(`Trying to kill process with pid: ${pid}...`);
      await axios.post(`http://localhost:5119/kill/${process.pid}`);
    }
  } catch (err) {
    throw Error(`Failed to kill process ${pid}`);
  }

  const genToken = await axios.get("http://tractor/Tractor/monitor?q=gentoken");
  const challengeEncoded = asciiToHexa(genToken.data.challenge + "|");

  const tractorLogin = await axios.get(
    `http://tractor/Tractor/monitor?q=login&user=nimby&c=${challengeEncoded}`
  );

  if (tractorLogin.data.rc === 0) {
    for (const process of status.data.pids) {
      await axios.get(
        `http://tractor/Tractor/queue?q=jretry&jid=${process.jid}&tsubset=${process.tid}&tsid=${tractorLogin.data.tsid}`
      );
    }
  } else {
    throw new Error("Failed to retry task");
  }
}

module.exports = {
  getBladeStatus,
  setNimbyValue,
  toggleNimby,
  killRunningTasksOnBlade,
};
