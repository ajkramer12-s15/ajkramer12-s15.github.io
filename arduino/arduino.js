// Load johnny-five, the library that lets us speak JavaScript to our Arduino.  You can read more about Johnny Five at http://johnny-five.io/
var five = require("johnny-five");

// Create a new variable to hold a reference to our board (in this case, an Arduino)
var board = new five.Board();

board.on("ready", function() { // When we successfully connect to the board and it's ready to run

    var pin = new five.Pin("A0"); // Load the analog pin by default

    // Load the express web framework which lets us set up a web server easily; you can read more about it at https://expressjs.com/
    var express = require('express');

    // Create a new server object and configure it to allow requests from anywhere
    var app = express();
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // Configure the server so that when it receives a request for /pin/whatever
    app.get('/pin/:number', function(request, response) {
        // It connects to the pin `whatever` (stored in `params.number`—you can read more about express's ability to capture named parameters at http://expressjs.com/en/guide/routing.html#route-parameters)
        pin.pin = request.params.number;

        // Ask that pin its state
        pin.query(function(state) {
            // And when we get it, send back its value as a string (otherwise it's interpreted as a response status, which you can read more about at https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
            var reading = String(state.value);
            response.send(reading);
        });

        delete pin;
    });

    // Now that we have our server configured, lets start it up on port 3000
    app.listen(3000, function() {
        console.log("Arduino listening on port 3000; navigate to http://localhost:3000/pin/A0 to see A0's reading!");
    });

});
