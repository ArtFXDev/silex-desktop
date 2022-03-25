const store = require("../utils/store");

function registerStatus(app) {
  app.get("/desktop/status", (req, res) => {
    res.json(store.instance.data);
  });
}

function registerRoutes(app) {
  registerStatus(app);
}

module.exports = registerRoutes;
