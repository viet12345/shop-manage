"use strict";

const path = require("path");
const DbService	= require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");

module.exports = function(collection) {
		return {
			mixins: [DbService],
			adapter: new MongoAdapter("mongodb://localhost/admin"),
			collection
		};
};
