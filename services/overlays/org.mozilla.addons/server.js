

require("io.pinf.server.www").for(module, __dirname, function(app, config, HELPERS) {

	app.get("/list", function (req, res, next) {

		return res.end("List!");
	});

});
