/**
 * View module.
 */
var view = new function() {

    var WORLD = null,
        INFO_PANEL = null,
        WORLD_ORIGIN_X = 0,
        WORLD_ORIGIN_Y = 0;

    var updateInfo = function() {

        INFO_PANEL.innerHTML = "World position: ("
            + Math.round(-WORLD_ORIGIN_X) + "; "
            + Math.round(-WORLD_ORIGIN_Y)
            + ")";

    };

    /**
     * Scroll view to given position.
     *
     * @param {number} x
     * @param {number} y
     */
    this.targetXY = function(x, y) {

        WORLD.style.backgroundPosition = -x/1.5 + "px " + -y/1.5 + "px";
        WORLD_ORIGIN_X = -x;
        WORLD_ORIGIN_Y = -y;
        updateInfo();

    };

    /**
     * Setup world object.
     *
     * @param element
     * @param options
     */
    this.setWorldElement = function(element, options) {

        var img = element.childNodes[0],
            sign = element.childNodes[1];

        if (sign) sign.innerHTML = options["name"] + "<br/>" + options["score"] + "/"
            + options["highScore"];

        element.style.transform = element.style.msTransform = element.style.oTransform =
            element.style.mozTransform = element.style.webkitTransform =
                "translate(" + ((options["x"]  || 0) + WORLD_ORIGIN_X + WORLD.clientWidth/2)+ "px, "
                + ((options["y"] || 0) + WORLD_ORIGIN_Y + WORLD.clientHeight/2) + "px) ";

        if (img) img.style.transform = img.style.msTransform = img.style.oTransform =
        img.style.mozTransform = img.style.webkitTransform =
            "rotate(" + (options["dir"] || 0) + "rad) ";

    };

    this.fixImg = function(imgElement, src) {

        imgElement.onload = function() {
            imgElement.style.position = "absolute";
            imgElement.style.left = -imgElement.clientWidth/2 + "px";
            imgElement.style.top = -imgElement.clientHeight/2 + "px";
        };
        imgElement.src = src;

    };

    this.setShipType = function(element, type) {

        var img = element.childNodes[0];
        img.onload = function() {
            img.style.position = "absolute";
            img.style.left = -img.clientWidth/2 + "px";
            img.style.top = -img.clientHeight/2 + "px";
        };
        img.src = "../img/ships/" + type + ".png";

    };

    this.init = function(worldElement) {

        WORLD = worldElement;
        INFO_PANEL = document.createElement("DIV");
        INFO_PANEL.className = "infoPanel";
        WORLD.appendChild(INFO_PANEL);

    };

};
