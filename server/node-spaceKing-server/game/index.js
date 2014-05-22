module.exports = new function() {

    var GAME_LOOP_SPEED = 25, // game loop interval speed
        GAME_LOOP_INTERVAL = 0, // id of game loop
        EPSILON = 0.001; // min speed limiter

    /**
     * @type {{WebSocketServer}}
     */
    var wss = null;

    /**
     * Anonymous send-to-client function.
     * Redefined send-method not to write webSocketServer.send each time.
     *
     * @see url(../webSocketServer/index.js).send
     * @type {function}
     */
    var send = null;

    var SHIP_TYPES = 5,
        COLLISION_DISTANCE = 150;

    /**
     * Sends data to all connected players.
     *
     * @param {object} data
     */
    var sendToAll = function(data) {
        for (var o in gameField) {
            if (!gameField.hasOwnProperty(o)) continue;
            send(gameField[o].PLAYER_ID, data);
        }
    };

    /**
     * Constructors of player events.
     * Written to simplify WS protocol.
     * Example: send(playerID, new evs.PlayerEntered(playerID, shipInstance))
     */
    var evs = {

        /**
         * @param {{SpaceShip}} mySpaceShip
         * @constructor
         */
        SetupGame: function(mySpaceShip) {
            this.event = "setupGame";
            this.data = {
                myID: mySpaceShip.getID()
            }
        },

        /**
         * @param {{SpaceShip}} spaceShip
         * @constructor
         */
        PlayerEntered: function(spaceShip) {
            this.event = "playerEntered";
            this.data = {
                playerID: spaceShip.getID(),
                x: spaceShip.getX(),
                y: spaceShip.getY(),
                dir: spaceShip.getDir(),
                shipType: spaceShip.getType(),
                nickname: spaceShip.getNickname()
            };
        },

        /**
         * @param {{SpaceShip}} spaceShip
         * @constructor
         */
        PlayerUpdated: function(spaceShip) {
            this.event = "playerUpdated";
            this.data = {
                playerID: spaceShip.getID(),
                x: spaceShip.getX(),
                y: spaceShip.getY(),
                isAccelerating: spaceShip.isAccelerating(),
                dir: spaceShip.getDir(),
                score: spaceShip.getScore(),
                highScore: spaceShip.getHighScore()
            };
        },

        /**
         * @param {{SpaceShip}} spaceShip
         * @constructor
         */
        PlayerLeft: function(spaceShip) {
            this.event = "playerLeft";
            this.data = {
                playerID: spaceShip.getID()
            };
        },

        Boom: function(x, y) {
            this.event = "boomAnimation";
            this.data = {
                x: x,
                y: y
            }
        }

    };

    /**
     * @param {{SpaceShip}} ship1
     * @param {{SpaceShip}} ship2
     */
    var getShipDistance = function(ship1, ship2) {

        return Math.sqrt(Math.pow(ship1.getX() - ship2.getX(), 2)
            + Math.pow(ship1.getY() - ship2.getY(), 2));

    };

    var boomAnimation = function(x, y) {

        sendToAll(new evs.Boom(x, y));

    };

    var SpaceShip = function(PLAYER_ID, NICKNAME) {

        var x = 0,
            y = 0,
            hSpeed = 0,
            vSpeed = 0,
            acceleration = 1,
            rotateFactor = 0,
            score = 0,
            highScore = 0,
            moving = false,
            shipType = Math.round(Math.random()*(SHIP_TYPES - 1)), // random type
            direction = 0,

            /**
             * Instance of spaceship context "this" variable
             *
             * @type {{SpaceShip}}
             * @private
             */
            _this = null;

        this.startAccelerate = function() { moving = true; };
        this.stopAccelerate = function() { moving = false; };
        this.startRotate = function(d) { rotateFactor = d/Math.max(1 + _this.getSpeed(), 5); };
        this.stopRotate = function() { rotateFactor = 0; };
        this.PLAYER_ID = PLAYER_ID;

        this.getX = function() { return x; };
        this.getY = function() { return y; };
        this.getDir = function() { return direction; };
        this.getID = function() { return PLAYER_ID; };
        this.getType = function() { return shipType; };
        this.getScore = function() { return score };
        this.getHighScore = function() { return highScore };
        this.isAccelerating = function() { return moving; };
        this.getNickname = function() { return NICKNAME; };
        this.getSpeed = function() { return Math.sqrt(hSpeed*hSpeed + vSpeed*vSpeed) };

        var updateClients = function() {

            sendToAll(new evs.PlayerUpdated(_this));

        };

        /**
         * Updates the ship with delta time.
         *
         * @param delta
         */
        this.update = function(delta) {

            direction += rotateFactor;

            if (moving) {
                hSpeed += acceleration*Math.cos(direction);
                vSpeed += acceleration*Math.sin(direction);
            }

            x += hSpeed;
            y += vSpeed;

            if (Math.abs(hSpeed) > EPSILON || Math.abs(vSpeed) > EPSILON) {
                updateClients();
            }

            hSpeed /= 1.04;
            vSpeed /= 1.04;

        };

        var resetPosition = function() {

            x = Math.random()*2000 - 1000;
            y = Math.random()*2000 - 1000;
            hSpeed = 0;
            vSpeed = 0;
            direction = Math.random()*Math.PI*2;

        };

        /**
         * @param {{SpaceShip}} opponentShip
         */
        this.dead = function(opponentShip) {

            score = 0;
            boomAnimation(x, y);
            resetPosition();
            updateClients();

        };

        /**
         * @param {{SpaceShip}} opponentShip
         */
        this.destroyed = function(opponentShip) {

            score++;
            if (score > highScore) highScore = score;
            updateClients();

        };

        this.init = function() {

            _this = this; // JSDOCv3 correct
            resetPosition();
            sendToAll(new evs.PlayerEntered(_this));

        };

    };

    var gameField = {
        /**
         * { x, y, hSpeed, vSpeed }
         */
    };

    /**
     * List of functions.
     */
    var actions = {

        startAccelerate: function(playerID) {
            gameField[playerID].startAccelerate();
        },

        stopAccelerate: function(playerID) {
            gameField[playerID].stopAccelerate();
        },

        startRotate: function(playerID, dir) {
            gameField[playerID].startRotate(((dir*1 || 0) < 0)?-1:1);
        },

        stopRotate: function(playerID) {
            gameField[playerID].stopRotate();
        }

    };

    var checkCollisions = function() {

        var collided = {}; // list of collided objects

        for (var oSource in gameField) {
            if (!gameField.hasOwnProperty(oSource)) continue;
            for (var oDest in gameField) {
                if (!gameField.hasOwnProperty(oDest)) continue;
                if (oSource !== oDest && !collided.hasOwnProperty(oSource)) {

                    var o1 = gameField[oSource],
                        o2 = gameField[oDest];

                    if (getShipDistance(o1, o2) > COLLISION_DISTANCE) continue;

                    collided[oSource] = collided[oDest] = 1;
                    if (o1.getSpeed() > o2.getSpeed()) {
                        o2.dead(o1);
                        o1.destroyed(o2);
                    } else {
                        o1.dead(o2);
                        o2.destroyed(o1);
                    }

                }
            }
        }

    };

    /**
     * Call update method of all the objects on game field.
     */
    var gameLoop = function() {

        for (var o in gameField) {
            if (!gameField.hasOwnProperty(o)) continue;
            if (typeof gameField[o].update === "function") {
                gameField[o].update();
            } else {
                console.error("No update method for object on game field.", o);
            }
        }

        checkCollisions();

    };

    var startGameLoop = function() {

        GAME_LOOP_INTERVAL = setInterval(gameLoop, GAME_LOOP_SPEED);

    };

    var stopGameLoop = function() {

        clearInterval(GAME_LOOP_INTERVAL);
        GAME_LOOP_INTERVAL = 0;

    };

    /**
     * Player enter handler.
     *
     * @param nickname
     * @param playerID
     * @see url(../webSocketServer/index.js)
     */
    this.playerEntered = function(nickname, playerID) {

        for (var o in gameField) {
            if (!gameField.hasOwnProperty(o)) continue;
            send(playerID, new evs.PlayerEntered(gameField[o]));
        }
        gameField[playerID] = new SpaceShip(playerID, nickname);
        gameField[playerID].init(); // initialize and give the instance
        send(playerID, new evs.SetupGame(gameField[playerID]));

    };

    this.clientDataReceived = function(playerID, data) {

        if (actions.hasOwnProperty(data["action"]) && Array.isArray(data["arguments"])) {

            data["arguments"].unshift(playerID);
            actions[data["action"]].apply(actions, data["arguments"]);

        } else { console.warn("Suspicious data from client: ", data); }

    };

    this.playerLeft = function(playerID) {

        var p = gameField[playerID];
        delete gameField[playerID];

        sendToAll(new evs.PlayerLeft(p));

    };

    this.initialize = function() {

        wss = require("../webSocketServer");
        send = wss.send; // redefine method

        startGameLoop();

        console.log("Game started.");

    };

};