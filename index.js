var _ = require("lodash");
var fs = require("fs");
var pathToRegexp = require("path-to-regexp");

/**
 * Returns the subroutes (?) of a url. For example, take the url /users/2321/comments. It will return ["/users", "/users/2321", "/users/2321/comments"]
 * @param  {String} url
 * @return {Array}
 */
function subroutes(url) {
	var components = url.split("/");
	components = components.splice(1, components.length -1);
	var fragments = [];
	for (var i = 0; i < components.length; i++) {
		fragments.push("/" + components.slice(0, (i + 1)).join("/"));
	}
	if (fragments[0] !== "/") {
		fragments.unshift("/");
	}
	return fragments;
}

module.exports = function(options) {

	options = _.extend({
		rolesField: "roles",
		idField: "_id",
		userField: "user",
		acl: {}
	}, options);

	var acl;

	if (_.isString(options.acl)) {
		acl = fs.readFileSync(options.acl);
		if (!acl) {
			throw new Error("Couldn't find specified acl file: " + options.acl);
			return;
		}
		try {
			acl = JSON.parse(acl);
		} catch(err) {
			throw new Error("Invalid JSON file specified for acl.");
			return;
		}
	} else {
		acl = options.acl;
	}

	return function(req, res, next) {

		//Get the groups the current user is in. Searches the request object for it, based on the option "rolesField"
		var groups = [];
		var keys = options.rolesField.split(".");
		
		try {
			groups = req[options.userField][options.rolesField];
		} catch(err) {
		}
		if (_.isString(groups)) {
			groups = [groups];
		}
		if (!_.isArray(groups)) {
			console.log("Wrong data supplied as groups.");
			callback(new Error("Wrong data supplied as groups."), false);
			return next({
				status: 500
			});
		}

		var url = req.url;
		var foundRestriction = false; //This indicates whether there was any restriction found during the process. If not, the requests defaults to pass.
		//Loop through all possible urls starting from the beginning, eg: /, /users, /users/:id, /users/:id/comments, /users/:id/comments/:id.
		var fragments = subroutes(req.url);
		for (var i = 0; i < fragments.length; i++) {
			//Get the current url fragment
			var fragment = fragments[i];
			//Loop through the _acl table
			for (var key in acl) {
				var regexp = pathToRegexp(key);
				if (fragment.match(regexp)) {
					if (acl[key][req.method]) {
						foundRestriction = true;
						//Check if the user is in a group that is inside this restriction
						if (_.intersection(groups || [], acl[key][req.method]).length > 0) {
							return next();
						}
					}
				}
			}
		}

		//Check if we found any restrictions along the way
		if (foundRestriction) {
			return next({
				status: 401,
				error: "Access denied: unauthorized access."
			});
		} else {
			return next();
		}
	}
}