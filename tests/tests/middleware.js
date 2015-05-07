//Use x-roles header to send an array of roles to the test server

var request = require("request");
var _ = require("lodash");
var should = require("chai").should();
var expect = require("chai").expect;
var fs = require("fs");
var initialData = JSON.parse(fs.readFileSync(__dirname + "/../test.json"));
var acl = JSON.parse(fs.readFileSync(__dirname + "/../test.acl.json"));

var server = require("../helpers/setupTestServer.js");

describe("ACL", function() {

	beforeEach(function() {
		server.resetData();
	});

	it("shouldn't let you get a node if it has an acl value of []", function(done) {
		request({
			method: "GET",
			url: server.url + "foo",
			headers: {
				"x-roles": JSON.stringify(["user", "admin"])
			},
			json: true,
		}, function(error, response, body) {
			response.statusCode.should.equal(401);
			expect(body.error).to.exist;
			done();
		});
	});

	it("unless you are the _super user", function(done) {
		request({
			method: "GET",
			url: server.url + "foo",
			headers: {
				"x-roles": JSON.stringify(["_super"])
			},
			json: true,
		}, function(error, response, body) {
			response.statusCode.should.equal(200);
			expect(body.error).to.not.exist;
			body.value.should.equal(initialData.foo);
			done();
		});
	});

	it("but it should get you something that has no restriction", function(done) {
		request({
			method: "GET",
			url: server.url + "faa",
			headers: {
				"x-roles": JSON.stringify(["user", "admin"])
			},
			json: true,
		}, function(error, response, body) {
			response.statusCode.should.equal(200);
			expect(body.error).to.not.exist;
			body.value.should.equal(initialData.faa);
			done();
		});
	});

	it("should let you get an item that had a broader restriction that was lifted", function(done) {
		request({
			method: "GET",
			url: server.url + "faz/baz",
			headers: {
				"x-roles": JSON.stringify(["user", "admin"])
			},
			json: true,
		}, function(error, response, body) {
			response.statusCode.should.equal(200);
			expect(body.error).to.not.exist;
			body.should.deep.equal(initialData.faz.baz);
			done();
		});
	});

	it("even its subitems, even if it later has a stricter rule", function(done) {
		request({
			method: "GET",
			url: server.url + "faz/baz/goo",
			headers: {
				"x-roles": JSON.stringify(["user", "admin"])
			},
			json: true,
		}, function(error, response, body) {
			response.statusCode.should.equal(200);
			expect(body.error).to.not.exist;
			body.value.should.equal(initialData.faz.baz.goo);
			done();
		});
	});

});