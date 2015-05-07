var request = require("request");
var _ = require("lodash");
var should = require("chai").should();
var expect = require("chai").expect;
var fs = require("fs");
var initialData = JSON.parse(fs.readFileSync(__dirname + "/../test.json"));
var acl = JSON.parse(fs.readFileSync(__dirname + "/../test.acl.json"));

var server = require("../helpers/setupTestServer.js");

describe("GET requests", function() {

	beforeEach(function() {
		server.resetData();
	});

	it("should get you the whole JSON when requesting the root", function(done) {
		request({
			method: "GET",
			url: server.url,
			headers: {
				"x-roles": JSON.stringify(["unknown"])
			},
			json: true,
		}, function(error, response, body) {
			response.statusCode.should.equal(401);
			done();
		});
	});

});