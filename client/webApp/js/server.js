var server = new function() {

    var ws = null;

    /**
     * Connect and log in.
     *
     * @param host
     * @param callback
     * @param onMessage
     */
    this.connect = function(host, callback, onMessage) {

        ws = new WebSocket("ws://" + host);
        ws.onopen = function() {
            callback();
        };
        ws.onmessage = function(message) {
            var data = message.data;
            try {
                data = JSON.parse(data);
                onMessage(data);
            } catch (e) {
                console.error("Data parse error", e);
            }
        };
        ws.onclose = function() {
            alert("Server connection down.");
            location.reload();
        };

    };

    this.send = function(data) {

        try {
            ws.send(JSON.stringify(data));
        } catch (e) {
            console.log("Unable to send ", data);
        }

    };

};