const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    setupNodeEvents(on, config) {
      // implement node event listeners here

      on("task", {
        "defaults:db": () => {
          // TODO Seed DB
        },
      });
    },
  },
});
