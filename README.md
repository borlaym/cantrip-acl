# cantrip-acl

Simple Access Control List middleware, where you define the access rules in a JSON file using the routes of the different resources. Although it works on its own, it's particularly well suited to be paired with [cantrip](https://kriek.co.uk/cantrip).

## Getting Started

In your express app, use cantrip-acl to create a middleware checking if the user has access to the route she tries to call.

```js
var app = require('express')();

var auth = require("cantrip-acl")({
	acl: "./acl.json"
});

app.use(function(req, res, next) {
	req.user = {
		roles: ["admin"]
	};
	next();
});

app.use(auth);

app.get("/hello", function(req, res, next) {
	res.send({
		"hello": "world"
	});
});

app.listen(3000);
```

It will expect the request.user object to be populated and have a roles array, which then it can match against the acl object. The access control list is a JSON file that defines routes that can only be accessed by specific user groups. Such a file looks like this:

```json
{
	"/": {
		"GET": ["admin"]
	}
}
```

In this example, the base route's GET method is restricted to the *admin* group. Note that not defined methods are available for everyone.

```json
{
	"/foo": {
		"GET": ["admin"]
	},
	"/foo/bar": {
		"GET": ["user"]
	},
	"/foo/bar/baz": {
		"GET": ["admin"]
	}
}
```

Here we restricted access to the /foo endpoint, so a simple user can't request that whole object. But later with the /foo/bar endpoint, we allow users access too. When designing the structure of your data, always try to go from strict rules to more broad ones. The third definition in this list has no effect, since we already granted access to /foo/bar to the user, so they will be able to access subroutes of that.

You can define different restrictions for the GET, POST, PUT, PATCH, DELETE methods, but there are two helpers that can make this task less tedious: ALL restrics all the above methods, MODIFY restrics everything but GET.

## Options

You can specify a number of options when calling the factory function to generate a middleware.

* acl: you can either provide a String that directs to a JSON file which will be parsed and used, or a simple Javascript object with similar structure. Defaults to an empty object.
* userField: You can specify which key to check for the user on the request object. The default is user.
* rolesField: You can specify which key to check for the user roles array on the user object. The default is roles.

## License

  [MIT](LICENSE)