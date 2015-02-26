
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
				"list": self.config.serviceBaseUri + "/io.devcomp.tool.datastore/datastore/list.json"
			},
			[
				{
					resources: [ "htm" ],
					streams: [ "list" ],
					handler: function(_htm, _list) {

						return window.API.helpers.ensureFireConsole(self.widget.id).then(function (FIRECONSOLE) {

							var fireconsole = null;

							function loadExplorer (datastoreId) {

								var datastoreConfig = _list.data[datastoreId];

								return fireconsole.fireconsole.callApi("console.clear").then(function () {								

									if (!datastoreId) {
										return;
									}

							        fireconsole.wildfire.insight.console.random.send(fireconsole.insight.encode(datastoreConfig.summary, {}, {}));

							        function fetch (context) {
										var request = _list.clone();
										request.setFilter(context);
										return request.fetch();
							        }

								    var api = fireconsole.wildfire.fireconsole.columnexplorer;

									return fetch(datastoreConfig.context).then(function (response) {

									    return api.column("Databases", response, function (rowId, context) {
									    	var api = this;

											return fetch(context).then(function (response) {

											    return api.column("Tables", response, function (rowId, context) {
											    	var api = this;

													return fetch(context).then(function (response) {

													    return api.column("Rows", response, function (rowId, context) {
													    	var api = this;

															return fetch(context).then(function (response) {

															    return api.column("Row", response);
														    });
													    });
												    });
											    });
										    });
									    });
									});
								});
							}

							var datastores = {
								"": {
									"label": "Please select ..."
								}
							};

							for (var id in _list.data) {
								datastores[id] = _list.data[id];
							}

							return self.setHTM(_htm, {
								datastores: datastores
							}).then(function(tag) {


								function redraw () {
									var h = $(window).height() - tag.offset().top - 90;
									$("#datastore-viewer", tag).height(h);
								}
								$(window).resize(function() {
									return redraw();
								});
								redraw();


		                        var consoleWidget = new FIRECONSOLE.FireConsoleWidget();
		                        return consoleWidget.attach($("#datastore-viewer", tag)).then(function (context) {
		                            return context.fireconsole.callApi("menu.close").then(function () {
		                                fireconsole = context;

										$("#datastore-selector", tag).on("change", function () {
											loadExplorer($("#datastore-selector option:selected", tag).val());
										});

										return tag;
		                            });
		                        });
							});
						});
					}
				}
			]
		);
	};
});
