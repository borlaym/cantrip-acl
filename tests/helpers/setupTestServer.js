var express = require('express');
var bodyParser = require('body-parser');
var fs = require("fs");
var initialData = JSON.parse(fs.readFileSync(__dirname + "/../test.json"));
var acl = JSON.parse(fs.readFileSync(__dirname + "/../test.acl.json"));
var _ = require("lodash");

var cantrip = require("cantrip")({
	saveFrequency: 0,
	file: "../../test.json"
});

var auth = require("../../index.js")({
	acl: acl
});

var port = 3001;
var app = express();
app.use(bodyParser.json());
app.use(function(err, req, res, next) {
	return next({
		status: 400,
		error: "Invalid JSON supplied in request body."
	});
});

app.use(function(req, res, next) {
	req.user = {
		roles: JSON.parse(req.headers["x-roles"])
	}
	next();
});

app.use(auth);

app.use(cantrip);

app.use(function(err, req, res, next) {
if (err.status) res.status(err.status);
	res.send({
		error: err.error
	});
});

app.use(function(req, res, next) {
	res.send(res.body);
});


app.serverInstance = app.listen(port);

app.port = port;


app.resetData = function() {
	cantrip.set("/", _.cloneDeep(initialData));
}

app.url = "http://localhost:"+port+"/";

app.cantrip = cantrip;

module.exports = app;
