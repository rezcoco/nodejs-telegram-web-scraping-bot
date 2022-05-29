const http = require('http');
const BASE_URL = process.env.BASE_URL || false

function startKeepAlive() {
    setInterval(function() {
        var options = {
            host: BASE_URL,
            port: 80,
            path: '/'
        };
        http.get(options, function(res) {
            res.on('data', function(chunk) {
                try {
                    // optional logging... disable after it's working
                    console.log("HEROKU RESPONSE: " + chunk);
                } catch (err) {
                    console.log(err.message);
                }
            });
        }).on('error', function(err) {
            console.log("Error: " + err.message);
        });
    }, 10 * 60 * 1000); // load every 10 minutes
}

if (BASE_URL) startKeepAlive();