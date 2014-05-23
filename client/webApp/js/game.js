var game = new function() {

    var WORLD = null,
        MY_SHIP = null,
        GAME_LOOP_INTERVAL = 25,
        GAME_LOOP = 0;

    var players = {},
        otherObjects = [];

    var removeOtherObject = function(obj) {

        for (var i = 0; i < otherObjects.length; i++) {
            if (otherObjects[i] === obj) {
                otherObjects.splice(i, 1);
                break;
            }
        }

    };

    var createWorld = function() {

        document.body.innerHTML = "";
        WORLD = document.createElement("DIV");
        WORLD.setAttribute("id", "gameWorld");
        document.body.appendChild(WORLD);
        view.init(WORLD);

    };

    var updateWorld = function() {

        view.targetXY(MY_SHIP.getX(), MY_SHIP.getY());

        for (var i = 0; i < otherObjects.length; i++) {

            otherObjects[i].update();

        }

    };

    var boomAnimation = function(x, y) {

        otherObjects.push(new Boom(x, y));

    };

    var Boom = function(X, Y) {

        var _this = this;

        var el = document.createElement("DIV");
        el.className = "gameObject";
        WORLD.appendChild(el);

        var img = document.createElement("IMG");
        view.fixImg(img, "img/effects/explosion.gif?" + Math.random());
        el.appendChild(img);

        this.update = function() {

            view.setWorldElement(el, {
                x: X,
                y: Y
            })

        };

        this.update();

        setTimeout(function() {

            el.parentNode.removeChild(el);
            removeOtherObject(_this);

        }, 1500);

    };

    var Player = function(PLAYER_ID, SHIP_TYPE) {

        var element = null,
            x = 0,
            y = 0,
            score = 0,
            highScore = 0,
            direction = 0,
            nickname = "Anonymous",
            accelerating = false;

        this.PLAYER_ID = PLAYER_ID;

        /**
         * Updates the ship with delta time.
         */
        this.updateView = function() {

            view.setWorldElement(element, {
                x: x,
                y: y,
                dir: ( direction + Math.PI/2 ),
                score: score,
                highScore: highScore,
                name: nickname
            });

        };

        this.setPosition = function(xx, yy, dir) {

            x = xx || 0;
            y = yy || 0;
            direction = dir;

        };

        this.setAccelerating = function(is) {
            accelerating = !!is;
        };

        this.setScore = function(s, hs) { score = s; highScore = hs; };
        this.setNickName = function(n) { nickname = n; };

        this.remove = function() {

            element.parentNode.removeChild(element);

        };

        this.getX = function() { return x; };
        this.getY = function() { return y; };
        this.getDir = function() { return direction; };

        element = document.createElement("DIV");
        element.className = "spaceShip";

        var img = document.createElement("IMG");
        element.appendChild(img);

        var sign = document.createElement("DIV");
        sign.className = "playerInfo";
        element.appendChild(sign);

        view.setShipType(element, SHIP_TYPE);
        WORLD.appendChild(element);
        this.updateView();

    };

    var step = function() {

        updateWorld();

        for (var o in players) {
            if (!players.hasOwnProperty(o)) continue;
            players[o].updateView();
        }

    };

    var events = {

        setupGame: function(data) {

            MY_SHIP = players[data["myID"]];

        },

        playerEntered: function(data) {

            var id = data["playerID"];
            players[id] = new Player(id, data["shipType"] || 0);
            players[id].setPosition(data["x"], data["y"], data["dir"]);
            players[id].setNickName(data["nickname"]);

        },

        playerUpdated: function(data) {

            var id = data["playerID"];
            players[id].setScore(data["score"] || 0, data["highScore"] || 0);
            players[id].setAccelerating(data["isAccelerating"]);
            players[id].setPosition(data["x"], data["y"], data["dir"]);

        },

        playerLeft: function(data) {

            var id = data["playerID"];
            players[id].remove();
            delete players[id];

        },

        boomAnimation: function(data) {

            boomAnimation(data["x"] || 0, data["y"] || 0);

        }

    };

    this.serverMessage = function(data) {

        if (events.hasOwnProperty(data["event"]) && typeof data["data"] === "object") {

            events[data["event"]].call(events[data["event"]], data["data"]);

        } else { console.warn("Suspicious data from server: ", data); }

    };

    var bindEvents = function() {

        var initialDirection = 0;

        document.body.onkeypress = function(e) {
            switch (e.charCode || e.keyCode) {
                case 119: server.send({ // W
                    action: "startAccelerate",
                    arguments: []
                }); break;
                case 100: server.send({ // W
                    action: "startRotate",
                    arguments: [1]
                }); break;
                case 97: server.send({ // W
                    action: "startRotate",
                    arguments: [-1]
                }); break;
            }
        };

        document.body.onkeyup = function(e) {
            switch (e.charCode || e.keyCode) {
                case 87: server.send({ // W
                    action: "stopAccelerate",
                    arguments: []
                }); break;
                case 68: server.send({ // L
                    action: "stopRotate",
                    arguments: []
                }); break;
                case 65: server.send({ // R
                    action: "stopRotate",
                    arguments: []
                }); break;
            }
        };

        document.body.ontouchstart = function(e) {

            e.preventDefault();

            var cx = window.innerWidth/2,
                cy = window.innerHeight/2,
                px = e.touches[0].pageX,
                py = e.touches[0].pageY,
                cdir = MY_SHIP.getDir(),
                dir = Math.PI/2 - Math.atan2(px - cx, py - cy),
                diff = Math.atan2(Math.sin(dir - cdir), Math.cos(dir - cdir)),
                dd = (diff > 0)?1:-1;

            initialDirection = dd;

            server.send({
                action: "startAccelerate",
                arguments: []
            });

            server.send({
                action: "startRotate",
                arguments: [dd]
            });

        };

        document.body.ontouchmove = function(e) {

            e.preventDefault();

            var cx = window.innerWidth/2,
                cy = window.innerHeight/2,
                px = e.changedTouches[0].pageX,
                py = e.changedTouches[0].pageY,
                cdir = MY_SHIP.getDir(),
                dir = Math.PI/2 - Math.atan2(px - cx, py - cy),
                diff = Math.atan2(Math.sin(dir - cdir), Math.cos(dir - cdir)),
                dd = (diff > 0)?1:-1;

            if (Math.abs(diff) > 0.05) {
                if (initialDirection !== dd) {
                    initialDirection = dd;
                    server.send({
                        action: "startRotate",
                        arguments: [dd]
                    });
                }
            } else {
                server.send({
                    action: "stopRotate",
                    arguments: []
                });
                initialDirection = 0;
            }

        };

        document.body.ontouchend = function(e) {

            e.preventDefault();

            server.send({
                action: "stopRotate",
                arguments: []
            });

            server.send({
                action: "stopAccelerate",
                arguments: []
            });

        };

    };

    var startGameLoop = function() {
        stopGameLoop();
        GAME_LOOP = setInterval(step, GAME_LOOP_INTERVAL);
    };
    var stopGameLoop = function() { clearInterval(GAME_LOOP); };

    this.start = function() {

        bindEvents();
        createWorld();
        startGameLoop();

    };

};
