'use strict'

var request = require('request');
var express = require('express');
var app = express();
var http = require('http').Server(app); 

// Routes
var index = require('./routes/index.js');
var api = require('./routes/api.js');

app.use('/', index);
app.use('/api', api);


// use process.env variables for heroku
var port = process.env.PORT || 5000;
var host = process.env.HOST || "localhost";

http.listen(port, function () {
    console.log('server is running');
})

