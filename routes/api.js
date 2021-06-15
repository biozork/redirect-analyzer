var app = require('express')();
var bodyParser = require('body-parser');
var request = require('request');

function validateUrl(value) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}

var maxJumps = 5;
var jumps = 0;

function requestUrl(url, arr, res, callback, fixDead, jump) {
    request({
        url: url,
        followRedirect: false
    }, function (err, response, body) {
        try {

            delete response.body;

            if (response.statusCode === 301 || response.statusCode === 302) {

                // some check to see if redirect is relative. If it is, make it absolute so script does not break.
                var nextUrl = response.headers.location;
                if (nextUrl[0] == '/') {
                    nextUrl = url.split('/')[0] + "//" + url.split('/')[2] + response.headers.location;
                }

                var tmpObj = {};
                tmpObj.statusCode = response.statusCode;
                tmpObj.jumpFrom = url;


                if (jump >= maxJumps) {
                    nextUrl = nextUrl.split('/');
                    nextUrl.pop();
                    nextUrl = nextUrl.join('/');
                    tmpObj.killedLoop = true;
                }

                tmpObj.jumpTo = nextUrl;

                arr.push(tmpObj);

                jump++;
                callback(nextUrl, arr, res, callback, fixDead, jump);
            } else {


                if (fixDead && response.statusCode === 404) {
                    var nextUrl = url //response.headers.location;

                    //First try stripping any query parameters
                    if (nextUrl.split('?').length > 1) {

                        nextUrl = nextUrl.split('?')[0];

                        arr.push({
                            "statusCode": response.statusCode,
                            "jumpFrom": url,
                            "jumpTo": nextUrl
                        });

                        jump++;
                        callback(nextUrl, arr, res, callback, fixDead, jump);

                    } else {

                        // Otherwise try splitting the url into folders, and go to nearest
                        if (nextUrl.split('/').length > 3) {
                            nextUrl = nextUrl.split('/');
                            nextUrl.pop();

                            var tmpObj = {
                                "statusCode": response.statusCode,
                                "jumpFrom": url
                            }

                            if (jump >= maxJumps) {
                                nextUrl.pop();
                                tmpObj.killedLoop = true
                            }

                            nextUrl = nextUrl.join('/');
                            tmpObj.jumpTo = nextUrl

                            arr.push(tmpObj);



                            jump++;
                            callback(nextUrl, arr, res, callback, fixDead, jump);
                        } else {

                            res.end(
                                JSON.stringify({
                                    error: 'Url gives a 404 and cannot be resolved: ' + url
                                }, null, 4)
                            );
                        }
                    }



                } else {

                    var obj = {
                        "statusCode": response.statusCode,
                        "resolvedUrl": url,
                        "jumpCount": arr.length,
                        "jumps": arr,
                    }

                    jump = 0;
                    res.end(JSON.stringify(obj, null, 4));
                }

            }

        } catch (e) {
            console.log(e);
            res.end();
        }


    });
}

function validateDomain(domain) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain);
}

// EXTREMLY IMPORTANT IN ORDER TO RECIEVE JSON DATA ffs...
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res, next) {
    res.end(
        JSON.stringify({
            message: 'There is no content on this path. Please do a post JSON format with parameter url: { "url": "http..." }'
        })
    );
});

app.post('/', bodyParser.json(), function (req, res, next) {

    var chain = {};
    chain.startingPoint = req.body.url;
    chain.fixDead = req.body.fixDead || false;
    chain.chains = [];

    // datavalidation
    if (validateUrl(chain.startingPoint)) {

        requestUrl(chain.startingPoint, chain.chains, res, requestUrl, chain.fixDead, 0);

    } else {
        res.end(
            JSON.stringify({
                error: 'Url is not valid: ' + chain.startingPoint
            }, null, 4)
        );
    }
});


module.exports = app;