var generateInput = function() {
    // Define our port
    var port = '3000';

    // And the Arduino URL it would correspond to
    var arduinoURL = 'http://localhost' + ':' + port + '/pin/A0';

    // Go get that URL
    fetch(arduinoURL).then(function(reading) {
        // Convert the response we get to text
        return reading.text();
    }).then(function(readingText) {
        // And now re-define `input` (which is defined globally in our HTML file) to that text
        arduinoInput = readingText;
    });
};
