"use strict";
const { MoleculerError } = require("moleculer").Errors;
const express = require("express");
const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const path = require("path");
const session = require("express-session");
const cookieParser = require('cookie-parser');

module.exports = {
	name: "www",

	settings: {
		port: process.env.PORT || 3000,
		pageSize: 5
	},

	methods: {
		initRoutes(app) {
			app.get("/login", this.login);
			app.post("/authorize",this.authorize);
			app.post("/signup",this.signup);
			app.get("/signup",this.signupget);
			app.get("/dashboard",this.dashboard);
			app.get("/shop/items",this.allitem);
			app.get("/shop/create-item",this.createitemget);
			app.post("/shop/create-item",this.createitem);
		},

		login(req, res) {
			let token = req.cookies['author'];
			if(token){
				return Promise.resolve({token}).then(data=>{
					return this.broker.call("users.resolveToken",{token:data.token}).then(data=>{
						return data;
					});
				})
				.then(data => {
					return res.status(200).redirect("/dashboard");
				})
				.catch(this.handleLogin(res));
			} else {
				res.render("login.html", {Error: 'asf' })
			}
		},
		signup(req, res) {
			let param = req.body;
				return Promise.resolve({param}).then(data=>{
					return this.broker.call("users.create", {user:data.param}).then(data => {
 						 res.cookie('author',data.user['token'], { maxAge: 900000, httpOnly: true });
 						  req.session.Auth = data.user;
 						return res;
					});
				})
				.then(data => {
					return res.direct("/login",{Error:"Tạo tài khoản thành công"});
				})
				.catch(this.handleErr(res));

		},
		signupget(req, res){
			res.render("signup.html")
		},
		authorize(req,res){
			let param = req.body;
 			return Promise.resolve({param})
 			.then(data=>{
 				return this.broker.call("users.login", {user:{email:data.param['login-username'],password:data.param['login-password']}}).then(res => {
 						return res;
					});
 			})
 			.then(data=>{
 				 res.cookie('author',data.user['token'], { maxAge: 900000, httpOnly: true });
 				 var sessData = req.session;
  				sessData.id = data.user.id;
  				sessData.name = data.user.name;
  				sessData.shop = data.user.shop;
  				sessData.email = data.user.email;
 				return res.redirect("/dashboard");
 			})
 			.catch(this.handleErr(res));
		},
		dashboard(req,res,netxt){
			let token = req.cookies['author'];
			if(token){
				return Promise.resolve({token}).then(data=>{
					return this.broker.call("users.resolveToken",{token:data.token}).then(data=>{
						return data;
					});
				})
				.then(data => {
					return res.render('Home.html',{title:'Trang chủ',username:data.username,email:data.email,shop:data.shop,id:data.id});
				})
				.catch(this.handleLogin(res));
			} else {
				res.status(420).redirect("/login");
			}
			
		},
		allitem(req,res){
			let {page} = req.query;
			return Promise.resolve({page})
			.then(data=>{
		 		return this.broker.call("shop.list",{ page: data.page, pageSize: 10 })
		 		.then(res=>{return res;});
				 })
			.then(data =>{
				return res.render("item_list.html",{data});
			})
				.catch(this.handleErr(res));
		},
		createitemget(req,res){
			res.render("create_item.html");
		},
		createitem(req,res,next){
			let param = req.body;
				return Promise.resolve({param})
					.then(data=>{
		 				return this.broker.call("shop.create", {item:{
		 					name:data.param['name'],
		 					image1:data.param['image1'],
		 					image2:data.param['image2'],
		 					image3:data.param['image3'],
		 					price:data.param['price'],
		 					unit_price:data.param['unit_price'],
		 					description:data.param['description'],
		 					voucher:data.param['voucher'],
		 					type:data.param['type'],
		 					qrcode:data.param['qrcode'],
		 					user_id:data.param['user_id']
		 				}}).then(res => {
		 						return res;
							});
		 			})
		 			.then(data => {
						return res.send('hello world');
					})
					.catch(this.error(res));
		},
		handleErr(res) {
			return err => {
				return res.status(err.code).redirect("/login");
			};
		},
		handleLogin(res){
			return err=>{
				return res.render("login.html");
			}
		},
		error(res){
			return err=>{
				return res.send('hello you');
			}
		}
	},
	created() {
		const app = express();
		const baseFolder = path.join(__dirname, "..");
		app.use(express["static"](path.join(baseFolder, "public")));
		//set session
		app.use(cookieParser());
		 var MemoryStore =session.MemoryStore;
		app.use(session({
		    secret: "secret",
		    resave: false,
		    saveUninitialized: true,
		    store: new MemoryStore(),
		    cookie: {secure: true,
		    }
		})
		);
		// Set view folder
		app.set("views", path.join(baseFolder, "views"));
		app.use(express.urlencoded());
		app.use(express.json());
		app.engine('html', require('ejs').renderFile);

		if (process.env.NODE_ENV == "production") {
			app.locals.cache = "memory";
			app.set("view cache", true);
		} else {
			// Disable views cache
			app.set("view cache", false);			
		}
		this.initRoutes(app);
		this.app = app;
	},

	started() {
		this.app.listen(Number(this.settings.port), err => {
			if (err)
				return this.broker.fatal(err);

			this.logger.info(`WWW server started on port ${this.settings.port}`);
		});

	},

	stopped() {
		if (this.app.listening) {
			this.app.close(err => {
				if (err)
					return this.logger.error("WWW server close error!", err);

				this.logger.info("WWW server stopped!");
			});
		}
	}
};
