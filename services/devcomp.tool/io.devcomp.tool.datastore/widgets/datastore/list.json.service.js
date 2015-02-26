
const PATH = require("path");
const FS = require("fs");
const EXEC = require("child_process").exec;
const SPAWN = require("child_process").spawn;


var pioConfig = JSON.parse(FS.readFileSync(PATH.join(__dirname, "../../../.pio.json"), "utf8"));


exports.app = function (req, res, next) {


	function respond(body) {
		res.writeHead(200, {
			"Content-Type": "application/json"
		});
	    return res.end(body);
	}


	var data = {};

	if (req.body.filter) {

		if (req.body.filter.dbname) {

			if (req.body.filter.tablename) {

				if (req.body.filter.rowid) {

					return res.r.db(req.body.filter.dbname).table(req.body.filter.tablename).get(req.body.filter.rowid).run(res.r.conn, function (err, row) {
						if (err) return next(err);

						var data = {};
						data[req.body.filter.rowid] = {
							"label": row
						};
						return respond(JSON.stringify(data, null, 4));
					});
				}

				return res.r.db(req.body.filter.dbname).table(req.body.filter.tablename).limit(10000).run(res.r.conn, function (err, cursor) {
					if (err) return next(err);

					return cursor.toArray(function(err, rows) {
					    if (err) return next(err);
					    if (rows.length === 0) {
							return respond("{}");
					    }

						rows.forEach(function (row) {
							data[row.id] = {
								"label": row.id,
								"context": {
									"dbname": req.body.filter.dbname,
									"tablename": req.body.filter.tablename,
									"rowid": row.id
								}
							}
						});

						return respond(JSON.stringify(data, null, 4));
					});
				});
			}

			return res.r.db(req.body.filter.dbname).tableList().run(res.r.conn, function (err, tables) {
				if (err) return next(err);

				tables.forEach(function (table) {
					data[table] = {
						"label": table,
						"context": {
							"dbname": req.body.filter.dbname,
							"tablename": table
						}
					}
				});

				return respond(JSON.stringify(data, null, 4));
			});
		}

		return respond("{}");

	}

	for (var serviceId in pioConfig['config.plugin']) {

		var serviceConfig = pioConfig['config.plugin'][serviceId];

		for (var datastoreId in serviceConfig.datastores) {
			// NOTE: `datastoreId` is relative to each service and thus useless to us here.

			var datastoreConfig = serviceConfig.datastores[datastoreId];

			if (!data[datastoreConfig.type + "~" + datastoreConfig.dbname]) {
				data[datastoreConfig.type + "~" + datastoreConfig.dbname] = {
					"label": datastoreConfig.type,
					"summary": {
						"usedBy": {}
					},
					"context": {
						"dbname": datastoreConfig.dbname
					}
				}
			}
			data[datastoreConfig.type + "~" + datastoreConfig.dbname].summary.usedBy[serviceId] = datastoreId;
		}
	}

	return respond(JSON.stringify(data, null, 4));
}
