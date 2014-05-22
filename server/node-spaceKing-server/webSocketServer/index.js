var gameModule = require("../game");

module.exports = new function() {

    var WebSocketServer = require("../node_modules/ws").Server,
        wss = null,
        clients = {};

    var getNewID = function() {
        var id;
        do {
            id = "user" + Math.random().toString().slice(2);
        } while (clients.hasOwnProperty(id));
        return id;
    };

    var onConnection = function(ws) {

        var UID = getNewID(),
            LOGGED = false;

        clients[UID] = ws;

        ws.on("message", function(message) {

            var data = {};

            try {
                data = JSON.parse(message);
                if (!LOGGED) {
                    if (data["login"]) { // check ONLY if nickname (login) present
                        console.log("Player with ID = " + UID + " joined.");
                        gameModule.playerEntered(data["login"], UID);
                        LOGGED = true;
                    } else {
                        ws.close();
                    }
                } else {
                    gameModule.clientDataReceived(UID, data);
                }
            } catch (e) {
                console.error("Data parse error", e);
            }

        });

        ws.on("close", function() {

            //try {
                gameModule.playerLeft(UID);
                delete clients[UID];
                console.log("Player with ID = " + UID + " left.");
            //} catch (e) { console.error("Fatal error", e); }

        });

    };

    this.send = function(clientID, object) {

        try {
            object = JSON.stringify(object);
        } catch (e) {}

        try {
            clients[clientID].send(object);
        } catch (e) {
            console.error("Unable to send data to client with ID = " + clientID);
        }

    };

    this.run = function() {

        wss = new WebSocketServer({port: 8080});

        wss.on("connection", onConnection);

        gameModule.initialize();

        console.log("Web socket server ready.");

    }

};
