

require("io.pinf.server.www").for(module, __dirname, function(app, config, HELPERS) {

	app.get("/view", function (req, res, next) {

		return res.end("View!");
	});

});
