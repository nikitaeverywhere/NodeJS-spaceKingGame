var express = require("../node_modules/express");

module.exports = new function() {

    var app = express();

    /**
     * Runs the server.
     */
    this.run = function() {

        app.use(express.static("client/webApp"), function(){});
        app.listen(80);
        console.log("Web server ready.");

    }

};
