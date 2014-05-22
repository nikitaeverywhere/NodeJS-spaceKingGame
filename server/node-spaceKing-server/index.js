var webServer = require("./webServer"),
    wss = require("./webSocketServer");

module.exports = new function() {

    this.initialize = function() {

        webServer.run();
        wss.run();

    };

};