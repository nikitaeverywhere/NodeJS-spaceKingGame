var app = new function() {

    this.logged = function() {



    };

    this.init = function() {

        server.connect(document.getElementById("host").value, function() {
            server.send({
                login: document.getElementById("login").value
            });
            game.start();
        }, game.serverMessage);

    };

};
