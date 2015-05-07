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
			throw new Error("Invalid JSON file specified for acl: " + options.acl);
			return;
		}
	} else {
		acl = options.acl;
	}

	return function(req, res, next) {

		//Skip if it's not one of the supported methods
		if (["GET", "POST", "PUT", "PATCH", "DELETE"].indexOf(req.method) === -1) {
			next();
		}

		//Get the roles the current user is in. Searches the request object for it, based on the option "rolesField"
		var roles = [];
		var keys = options.rolesField.split(".");
		
		if (_.isObject(req[options.userField])) {
			roles = req[options.userField][options.rolesField];
		}

		if (!_.isArray(roles)) {
			console.log("Wrong data supplied as roles.");
			callback(new Error("Wrong data supplied as roles."), false);
			return next({
				status: 500
			});
		}

		//Automatically has acccess if has role _super
		if (roles.indexOf("_super") > -1) {
			return next();
		}

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
					if (acl[key][req.method] || acl[key]["ALL"] || acl[key]["MODIFY"]) {
						//Check which rule we must use. Always use a specific rule first, if there is one, then MODIFY then ALL
						var methodToCheck = acl[key][req.method] ? req.method : (acl[key]["MODIFY"] ? "MODIFY" : "ALL");
						//If there's only a modify rule and the request is a GET, skip this rule
						if (methodToCheck === "MODIFY" && req.method === "GET") {
							continue;
						}
						//We found at least one restriction
						foundRestriction = true;
						//Check if the user is in a group that is inside this restriction
						if (_.intersection(roles, acl[key][methodToCheck]).length > 0) {
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