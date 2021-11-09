const axios = require("axios").default;
const logger = require("../utils/logger");

const BLADE_URL = "http://localhost:9005";

/**
 * Returns a promise with the blade status
 */
function getBladeStatus() {
  return axios.get(`${BLADE_URL}/blade/status`);
}

/**
 * Sets the nimby status to ON or OFF. Returns a promise
 */
function setNimbyValue(newStatus) {
  logger.info(`[NIMBY] Setting Nimby value to ${newStatus}`);
  return axios.get(`${BLADE_URL}/blade/ctrl?nimby=${newStatus ? 1 : 0}`);
}

/**
 * Toggle the status of the Nimby
 */
function toggleNimby() {
  return getBladeStatus().then((response) =>
    setNimbyValue(response.data.nimby === "None")
  );
}

module.exports = { getBladeStatus, setNimbyValue, toggleNimby };
