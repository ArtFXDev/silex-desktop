/**
 * The store is used as centralized place for data in the library.
 */
const store = {
  /** Auto mode value for the Nimby */
  nimbyAutoMode: true,

  /** Dev, prod or beta mode, choosing the silex front url */
  frontMode: "prod",
};

// ----------------------------------------------------
// Singleton boring stuff for NodeJS...

const STORE_KEY = Symbol.for("silex_desktop.store");
const globalSymbols = Object.getOwnPropertySymbols(global);
const hasStore = globalSymbols.indexOf(STORE_KEY) > -1;

if (!hasStore) {
  global[STORE_KEY] = { data: store };
}

const singleton = {};

Object.defineProperty(singleton, "instance", {
  get: function () {
    return global[STORE_KEY];
  },
});

module.exports = singleton;
