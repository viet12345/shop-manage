"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

module.exports = {
	name: "shop",
	mixins: [
		DbService("shop"),
		CacheCleanerMixin([
			"cache.clean.shop"
		])
	],

	/**
	 * Default settings
	 */
	settings: {
		/** Public fields */
		fields: ["_id", "user_id", "name", "image1","image2","image3","price","unit_price","description","view","purchase","voucher","type","qrcode"],

		/** Validator schema for entity */
		entityValidator: {
			name: { type: "string", optional: true},
			image1: { type: "string", optional: true },
			image2: { type: "string", optional: true },
			image3: { type: "string", optional: true },
			price: { type: "string", optional: true},
			unit_price: { type: "string", optional: true},
			description: { type: "string", optional: true},
			voucher: { type: "string", optional:true},
			type: { type: "string", optional:true},
			qrcode: { type: "string", optional:true},
			user_id: { type: "string", optional: true},
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Register a items
		 *
		 * @actions
		 * @param {Object} item 
		 *
		 * @returns {Object} Created
		 */
		create: {
			params: {
				item: { type: "object" }
			},
			handler(ctx) {
				let entity = ctx.params.item;
				return this.validateEntity(entity)
					.then(() => {
						entity.image1= entity.image1 || null;
						entity.image2= entity.image2 || null;
						entity.image3= entity.image3 || null;			
						entity.voucher= entity.voucher|| null;
						entity.type= entity.type|| null;
						entity.qrcode= entity.qrcode|| null;
						entity.view= "0";
						entity.purchase ="0";
						entity.createdAt = new Date();
						console.log(entity);
						return this.adapter.insert(entity)
							.then(doc => this.transformDocuments(ctx, {}, doc))
							.then(json => this.entityChanged("created", json, ctx).then(() => json));
					});
			}
		},

	},
	/**
	 * Methods
	 */
	methods: {
	},

	events: {
		"cache.clean.users"() {
			if (this.broker.cacher)
				this.broker.cacher.clean(`${this.name}.*`);
		},
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};
