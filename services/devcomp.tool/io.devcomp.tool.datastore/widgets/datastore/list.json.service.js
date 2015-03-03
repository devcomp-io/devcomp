
const PATH = require("path");
const FS = require("fs");
const EXEC = require("child_process").exec;
const SPAWN = require("child_process").spawn;
const AWS = require("aws-sdk");


var pioConfig = JSON.parse(FS.readFileSync(PATH.join(__dirname, "../../../.pio.json"), "utf8"));


var datastores = null;

exports.app = function (req, res, next) {


	function respond(body) {
		res.writeHead(200, {
			"Content-Type": "application/json"
		});
	    return res.end(body);
	}

	function sort (tables, fieldname) {
		tables.sort(function(row1, row2) {
			if (!fieldname) return row1 > row2;
	        return row1[fieldname] > row2[fieldname];
	    });
	}



	if (!datastores) {

		datastores = {};

		for (var serviceId in pioConfig['config.plugin']) {

			var serviceConfig = pioConfig['config.plugin'][serviceId];

			for (var datastoreId in serviceConfig.datastores) {
				// NOTE: `datastoreId` is relative to each service and thus useless to us here.

				var datastoreConfig = serviceConfig.datastores[datastoreId];

				if (!datastoreConfig.type) {
					throw new Error("'type' must be set for '" + serviceId + "/" + datastoreId + "'");
				}
				if (!datastoreConfig.dbname) {
					throw new Error("'dbname' must be set for '" + serviceId + "/" + datastoreId + "'");
				}

				if (!datastores[datastoreConfig.type + "~" + datastoreConfig.dbname]) {
					datastores[datastoreConfig.type + "~" + datastoreConfig.dbname] = Object.create({
						"credentials": datastoreConfig.credentials
					});
					datastores[datastoreConfig.type + "~" + datastoreConfig.dbname].label = datastoreConfig.type;
					datastores[datastoreConfig.type + "~" + datastoreConfig.dbname].summary = {
						"usedBy": {}
					};
					datastores[datastoreConfig.type + "~" + datastoreConfig.dbname].context = {
						"type": datastoreConfig.type,
						"dbname": datastoreConfig.dbname
					};
				}
				datastores[datastoreConfig.type + "~" + datastoreConfig.dbname].summary.usedBy[serviceId] = datastoreId;
			}
		}
	}

	if (req.body.filter) {

		var datasoreId = req.body.filter.type + "~" + req.body.filter.dbname;
		var datastoreConfig = datastores[datasoreId];

		if (!datastoreConfig) {
			console.log("Warning: No datasore config found for id:", datasoreId);
			return respond("{}");
		}

		if (datastoreConfig.context.type === "simpledb") {

		    var db = new AWS.SimpleDB(new AWS.Config({
		        accessKeyId: datastoreConfig.credentials.accessKeyId,
		        secretAccessKey: datastoreConfig.credentials.secretAccessKey,
		        region: datastoreConfig.credentials.region
		    }));

			if (req.body.filter.tablename) {

				if (req.body.filter.rowid) {

			        return db.getAttributes({
			            "DomainName": req.body.filter.tablename,
			            "ItemName": req.body.filter.rowid,
			            "ConsistentRead": true
			        }, function(err, result) {
			            if (err) return next(err);
			            if (!result.Attributes || result.Attributes.length === 0) {
			                return respond({});
			            }
			            var attributes = {};
			            result.Attributes.forEach(function (attribute) {
			                attributes[attribute.Name] = attribute.Value;
			            });

						var data = {};
						data[req.body.filter.rowid] = {
							"label": attributes
						};
						return respond(JSON.stringify(data, null, 4));
					});
				}


		        var selectExpression = "select Name from " + req.body.filter.tablename;
		        return db.select({
		            "SelectExpression": selectExpression,
		            "ConsistentRead": true
		        }, function(err, result) {
		            if (err) return next(err);
		            if (!result.Items || result.Items.length === 0) {
		            	return respond("{}");
		            }

		            var items = [];
		            result.Items.forEach(function (item) {
		                var attributes = {};
		                item.Attributes.forEach(function (attribute) {
		                    attributes[attribute.Name] = attribute.Value;
		                });
		                items.push({
		                	id: item.Name,
		                	data: attributes
		                });
		            });

					sort(items, "id");

					var data = {};
					items.forEach(function (row) {
						data[row.id] = {
							"label": row.id,
							"context": {
								"type": req.body.filter.type,
								"dbname": req.body.filter.dbname,
								"tablename": req.body.filter.tablename,
								"rowid": row.id
							}
						}
					});
					return respond(JSON.stringify(data, null, 4));
		        });
			}


			return db.listDomains({
				MaxNumberOfDomains: 100
			}, function (err, result) {
				if (err) return next(err);

	            if (!result.DomainNames || result.DomainNames.length === 0) {
	            	return respond("{}");
	            }

				sort(result.DomainNames);

				var data = {};
				result.DomainNames.forEach(function (table) {
					data[table] = {
						"label": table,
						"context": {
							"type": req.body.filter.type,
							"dbname": req.body.filter.dbname,
							"tablename": table
						}
					}
				});
				return respond(JSON.stringify(data, null, 4));
			});

		} else
		if (datastoreConfig.context.type === "rethinkdb") {

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

						sort(rows, "id");

						var data = {};
						rows.forEach(function (row) {
							data[row.id] = {
								"label": row.id,
								"context": {
									"type": req.body.filter.type,
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

				sort(tables);

				var data = {};
				tables.forEach(function (table) {
					data[table] = {
						"label": table,
						"context": {
							"type": req.body.filter.type,
							"dbname": req.body.filter.dbname,
							"tablename": table
						}
					}
				});
				return respond(JSON.stringify(data, null, 4));
			});

		} else {
			console.error(new Error("Datastore type not yet supported: " + datastoreConfig.context.type).stack);
			return respond("{}");
		}

		return respond("{}");

	}

	return respond(JSON.stringify(datastores, null, 4));
}
