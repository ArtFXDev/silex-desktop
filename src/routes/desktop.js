const store = require("../utils/store");
const currentProcesses = require("current-processes");

function register_status(app) {
  app.get("/desktop/status", (req, res) => {
    res.json(store.instance.data);
  });
}

function register_processes(app) {
  app.get("/desktop/processes", (req, res) => {
    currentProcesses.get((err, processes) => {
      res.json(processes);
    });
  });
}

function register_routes(app) {
  register_status(app);
  register_processes(app);
}

module.exports = register_routes;
