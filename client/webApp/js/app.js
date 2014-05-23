var app = new function() {

    this.logged = function() {



    };

    this.login = function() {

        server.connect(document.getElementById("host").value, function() {
            server.send({
                login: document.getElementById("login").value
            });
            game.start();
        }, game.serverMessage);

    };

    this.init = function() {

        document.getElementById("host").value = window.location.host + ":8080";

    };

};
