/**
 * Example of a simple cantrip server binding to a data.json file. 
 * It's not a real life example, and its main purpose is just to demonstrate various ways to modify cantrip's basic behaviour.
 */

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var _ = require("lodash");

//Initialize a cantrip instance with the data.json in this directory
var cantrip = require("cantrip")({
    file: __dirname + '/data.json'
});

var auth = require("../index.js")({
    acl: __dirname + '/acl.json'
});

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(function(err, req, res, next) {
    return next({
        status: 400,
        error: "Invalid JSON supplied in request body."
    });
});

//Check access
app.use(auth);

//Now comes the normal cantrip behavior
app.use(cantrip);


app.use(function(req, res, next) {
    res.send(res.body);
});

app.use(function(err, req, res, next) {
    if (err.status) res.status(err.status);
    res.send({
        error: err.error
    });
});

app.listen(3000);