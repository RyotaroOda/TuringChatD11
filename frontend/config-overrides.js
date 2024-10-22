const path = require("path");

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "@shared": path.resolve(__dirname, "shared"),
  };
  return config;
};
