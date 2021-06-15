var app = require('express')();

app.get('/', function (req, res, next) {
    res.end('There is no content on this path. Only API calls [POST] accepted at /api');
});

module.exports = app;