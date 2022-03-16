const store = require("../utils/store");
const currentProcesses = require("current-processes");

function registerStatus(app) {
  app.get("/desktop/status", (req, res) => {
    res.json(store.instance.data);
  });
}

function registerProcesses(app) {
  app.get("/desktop/processes", (req, res) => {
    currentProcesses.get((err, processes) => {
      res.json(processes);
    });
  });
}

function registerRoutes(app) {
  registerStatus(app);
  registerProcesses(app);
}

module.exports = registerRoutes;
