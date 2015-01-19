

require("io.pinf.server.www").for(module, __dirname, function(app, config, HELPERS) {

	app.get("/pages", function (req, res, next) {

		return res.end("Pages!");
	});

});
