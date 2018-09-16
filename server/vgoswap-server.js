// Require the NPM modules we need
const http = require('http');
const path = require('path');
const express = require('express');
const handlebars = require('express-handlebars');
const socket = require('socket.io');
const sanitizer = require('sanitizer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const passportSocketIo = require('passport.socketio');
const assert = require('assert');
// Require the modules we made
const config = require(path.join(__dirname, '..', 'config', 'config.js'));
const utils = require(path.join(__dirname, 'utils.js'));
const database = require(path.join(__dirname, 'database', 'database.js'));
const tradeHandler = require(path.join(__dirname, 'trade-handler.js'));
// Logs our bot into Steam
tradeHandler.init();
// Setup mysql, this will be used for session storage
const mysql = require('mysql');
let connection = mysql.createConnection({
	host: config.database.name
	, port: config.database.port
	, user: config.database.user
	, password: config.database.password
	, database: config.database.schema
});
// Session storage with cookies. If you restart
// the server all users will remain logged in.
const sessionStore = new MySQLStore({}, connection);
// Setup our server
const app = express();
const server = http.Server(app);
// Sockets:
const io = socket(server);
// Setup our view engine, in this case handlebars
const Handlebars = handlebars.create({
	extname: '.html'
	, partialsDir: path.join(__dirname, '..', 'views', 'partials')
	, helpers: {
		getCommas: function (number) {
			return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		},
    getFixed: function(number) {
      return number.toFixed(2);
    }
	}
});
// More handlebars setup
app.engine('html', Handlebars.engine);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '..', 'views'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
// We can emit alerts to clients outside of the
// socket session with this function.
function emitAlertToClient(steamid, message) {
	for (let i = clients.length - 1; i >= 0; i--) {
		if (clients[i].steamid == steamid) {
			io.to(clients[i].socketid).emit('alert', message);
		}
	}
}
// Emit any event to a client, even outside
// of the socket session.
function emitEventToClient(steamid, event, obj) {
	for (let i = clients.length - 1; i >= 0; i--) {
		if (clients[i].steamid == steamid) {
			io.to(clients[i].socketid).emit(event, obj);
		}
	}
}
// Emit the balance of a user outside
// of the socket session.
function emitBalance(steamid, callback) {
	database.getBalanceBySteamId(steamid, function (err, balance) {
		if (err) {
			callback(err);
		}
		else {
			callback(null);
			emitEventToClient(steamid, 'updateBalance', balance);
		}
	});
}
// Trade attempts are rate-limited to prevent
// someone from 'double spending' - this function
// removes them after that time has passed.
function removeWithdrawProgress(steamid) {
	for (let i = withdrawProgress.length - 1; i >= 0; i--) {
		if (withdrawProgress[i] == steamid) {
			withdrawProgress.splice(i, 1);
		}
	}
}
// This stores SteamIDs of people
// currently withdrawing and 
// are rate limited
let withdrawProgress = [];
// These store the home stats
let totalTrades = 0;
let totalUsers = 0;
// These store the current keys in stock
let tf2KeysInStock = 0;
let vgoKeysInStock = 0;
// This function updates the stats on the homepage
function updateHomeStats() {
	utils.updateHomeStats((err, stats) => {
		if (err) {
			console.error(err);
		}
		else {
			totalTrades = stats.totalTrades;
			totalUsers = stats.totalUsers;
		}
	});
}
// Keep refreshing the homepage stats
updateHomeStats();
setInterval(function () {
	updateHomeStats();
}, 10000);
// This updates the keys in stock.
function updateInStock() {
	utils.updateInStock((err, result) => {
		if (err) {
			console.error(err);
		}
		else {
			tf2KeysInStock = result.tf2;
			vgoKeysInStock = result.vgo;
			io.emit('updateStock', {
				tf2KeysInStock: result.tf2
				, vgoKeysInStock: result.vgo
			});
		}
	});
}
// Keep updating the keys in stock
updateInStock();
setInterval(function () {
	updateInStock();
}, 10000);
// Simple function for server-side rendering
function renderPage(page, obj, cb) {
	if (typeof obj == 'function' && !cb) {
		cb = obj;
	}
	let pageToRender = path.join(__dirname, '..', 'views', 'partials', `${page}.html`);
	Handlebars.render(pageToRender, obj).then((html) => {
		cb(null, html);
	}, (err) => {
		cb(err);
	});
}
// This is the object passed to our view engine.
function getMainObject(user) {
	return {
		user: user
		, totalTrades: totalTrades
		, totalUsers: totalUsers
		, tf2KeysInStock: tf2KeysInStock
		, vgoKeysInStock: vgoKeysInStock
		, online: online
		, config: config
	};
}
// When a user logs on...
passport.serializeUser((user, done) => {
	// Check the database for the user
	database.getUserBySteamId(user._json.steamid, (err, localUser) => {
		if (err) {
			console.error(err);
			done('An error occurred');
		}
		else {
			// If they already exist...
			if (localUser) {
				// Update their name and avatar
				database.updateUserdata(user._json.steamid, user._json.personaname, user._json.avatarfull, (err, result6) => {
					if (err) {
						console.error(err);
						done('An error occurred');
					}
					else {
						done(null, user._json);
						console.log(`[EXISTING USER] ${user._json.personaname}/${user._json.steamid} logged on [${utils.getIsoString()}]`);
					}
				});
			}
			// If they don't already exist...
			else {
				// Add them to the database
				database.addNewUser(user._json.steamid, user._json.personaname, user._json.avatarfull, utils.getIsoString(), err => {
					if (err) {
						console.error(err);
						done('An error occurred');
					}
					else {
						done(null, user._json);
						console.log(`[NEW USER] ${user._json.personaname}/${user._json.steamid} logged on [${utils.getIsoString()}]`);
					}
				});
			}
		}
	});
});
passport.deserializeUser((obj, done) => {
	done(null, obj);
});
// Setup Steam login
passport.use(new SteamStrategy({
	returnURL: config.api.steam.returnUrl
	, realm: config.api.steam.realm
	, apiKey: config.api.steam.steamApiKey
}, (identifier, profile, done) => {
	return done(null, profile);
}));
// Setup our sessions
app.use(cookieParser());
app.use(session({
	key: 'session_id'
	, secret: 'almatrass'
	, resave: false
	, saveUninitialized: true
	, store: sessionStore
	, cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 365
	}
}));
app.use(passport.initialize());
app.use(passport.session());
// Allows us to access the user object
// in a socket session
io.use(passportSocketIo.authorize({
	cookieParser: cookieParser
	, key: 'session_id'
	, secret: 'almatrass'
	, store: sessionStore
	, success: onAuthorizeSuccess
	, fail: onAuthorizeFail
}));

function onAuthorizeSuccess(data, accept) {
	accept();
}

function onAuthorizeFail(data, message, error, accept) {
	accept(null, !error);
}
// The 'clients' array holds objects. Each object contains
// a 'steamid' and a 'socketid'. This allows us to emit
// events to specific steamids, even outside a socket session.
let clients = [];
// Keeps track of how many users are online
let online = 0;
// This stuff gets logged a lot
const commonLogs = {
		generalErr: `An error occurred, please try again`
		, validAmount: `Please enter a valid amount`
		, login: `You must be logged in to trade!`
		, tradeWait: `Please wait at least ${config.tradeTimeout} seconds before requesting another trade`
		, notEnoughStock: `We don't have enough keys in stock for this - sorry about that`
		, notEnoughKeys: `You don't have enough keys in your inventory!`
		, getSteamTradeSentHtml: function (offerid) {
			return `<h5>Trade offer sent!</h5><a class="btn blue accent-2" href="https://steamcommunity.com/tradeoffer/${offerid}" target="_blank">View Trade</a>`;
		}
	}
	// When someone connects to the server...
io.on('connection', socket => {
	// Update the online counter
	online += 1;
	// Let the clients know the new value
	io.emit('updateOnline', online);
	// When a user disconnects, update online again
	socket.on('disconnect', () => {
		online -= 1;
		io.emit('updateOnline', online);
	});
	let socketuser;
	// If socket.request.user.logged_in !== false, there is
	// a user logged on. We assign the 'socket.request.user'
	// property to the 'socketuser' variable for easy access.
	if (socket.request.user.logged_in !== false) {
		socketuser = socket.request.user;
	}
	if (socketuser) {
		// If there's a user, we add them to the 
		// 'clients' array. This means we can easily
		// emit events to a client by specifying a 
		// steamid.
		clients.push({
			steamid: socketuser.steamid
			, socketid: socket.id
		});
		// When the user disconnects, remove them from the array
		socket.on('disconnect', () => {
			for (let i = clients.length - 1; i >= 0; i--) {
				if (clients[i].socketid == socket.id) {
					clients.splice(i, 1);
				}
			}
		});
	}
	// This is the server-side rendering function.
	// The page and event to emit are decided client-side,
	// and we render the appropriate page and return it.
	socket.on('renderPage', function (page, event) {
		renderPage(page, getMainObject(socketuser), (err, html) => {
			if (err) {
				console.error(err);
				socket.emit('alert', commonLogs.generalErr);
			}
			else {
				socket.emit(event, html);
			}
		});
	});
	socket.on('getModList', function () {
		socket.emit('modListHere', config.admins);
	});
	// We require database queries for the settings modal,
	// so it's kept separate from the regular 'renderPage' event
	socket.on('renderSettings', function () {
		if (socketuser) {
			database.getUserBySteamId(socketuser.steamid, (err, user) => {
				if (err) {
					console.error(err);
					socket.emit('alert', commonLogs.generalErr);
				}
				else {
					renderPage('settings', {
						user: socketuser
						, userdata: user
					}, (err, html) => {
						if (err) {
							console.error(err);
							socket.emit('alert', commonLogs.generalErr);
						}
						else {
							socket.emit('renderSettings', html);
						}
					});
				}
			});
		}
		else {
			let settingsHtml = `<div class="center-align"><h5>Please login to view your settings!</h5><a href="/auth/steam" class="btn white black-text z-depth-2 waves-effect waves-dark"><img class="steamLoginBtnImg left" src="/public/img/steamlogo.png">Sign in through Steam</a></div>`;
			socket.emit('renderSettings', settingsHtml);
		}
	});
	// When we click on the nav items within the settings modal
	socket.on('loadSettingsNav', function (page) {
		if (socketuser) {
			// The 'settings' page where they can 
			// change their settings
			if (page == 'settings') {
				database.getUserBySteamId(socketuser.steamid, (err, user) => {
					if (err) {
						console.error(err);
						socket.emit('alert', commonLogs.generalErr);
					}
					else {
						renderPage('settingssettings', {
							user: socketuser
							, userdata: user
						}, (err, html) => {
							if (err) {
								console.error(err);
								socket.emit('alert', commonLogs.generalErr);
							}
							else {
								socket.emit('loadSettingsNav', html);
							}
						});
					}
				});
			}
			// The 'history' page, where they can view
			// their transaction history
			else if (page == 'history') {
				database.getTransactionHistoryBySteamId(socketuser.steamid, (err, transactions) => {
					if (err) {
						console.error(err);
						socket.emit('alert', commonLogs.generalErr);
					}
					else {
						renderPage('settingshistory', {
							stuff: transactions
						}, (err, html) => {
							if (err) {
								console.error(err);
								socket.emit('alert', commonLogs.generalErr);
							}
							else {
								socket.emit('loadSettingsNav', html);
							}
						});
					}
				});
			}
		}
		else {
			socket.emit('alert', `Please login to access your settings!`);
		}
	});
	// When the page loads, the client will request a balance.
	// This happens after page load, rather than before,
	// for a very slight performance benefit.
	socket.on('getBalance', function () {
		if (socketuser) {
			database.getBalanceBySteamId(socketuser.steamid, (err, balance) => {
				if (err) {
					console.error(err);
					socket.emit('alert', `An error occurred retrieving your balance, try refreshing`);
				}
				else {
					socket.emit('updateBalance', balance);
				}
			});
		}
	});
	// This loads chat. Like mentioned above, this is requested
	// after page load, to stop render-blocking.
	socket.on('getChat', function () {
		database.getChatMessages((err, messages) => {
			if (err) {
				console.error(err);
				socket.emit('alert', `An error occurred loading chat, try refreshing`);
			}
			else {
				socket.emit('loadedChat', messages);
			}
		});
	});
	// When a user sends a message
	socket.on('chatMsg', function (msg) {
		if (socketuser) {
			// Escape the message to prevent anyone typing HTML
			// or scripts into chat
			let safeMsg = sanitizer.escape(msg);
			let protoMsg = {
				steamid: socketuser.steamid
				, avatar: socketuser.avatar
				, name: socketuser.personaname
				, msg: safeMsg
				, time: utils.getIsoString()
			};
			// Emit the message to everyone, and also
			// store it in the database
			io.emit('chatMsg', protoMsg);
			database.addChatMsg(protoMsg.steamid, protoMsg.msg, utils.getIsoString(), err => {
				if (err) {
					console.error(err);
				}
			});
		}
		else {
			socket.emit('alert', `Please login to chat!`);
		}
	});
	// The user has the ability to specify a custom
	// steamid for opskins trades.
	socket.on('updateCustom', function (id) {
		if (socketuser) {
			database.updateCustomSteamId(socketuser.steamid, id, err => {
				if (err) {
					console.error(err);
					socket.emit('alert', commonLogs.generalErr);
				}
				else {
					socket.emit('closeModal');
					socket.emit('alert', `OPSkins SteamID successfully updated!`);
				}
			});
		}
		else {
			socket.emit('alert', `Please login to update your OPSkins SteamID!`);
		}
	});
	// For the user to tell us their steam trade URL
	socket.on('updateTradeUrl', function (url) {
		if (socketuser) {
			if (url) {
				database.updateSteamTradeUrl(socketuser.steamid, url, err => {
					if (err) {
						console.error(err);
					}
					else {
						socket.emit('tradeUrlSuccess');
						socket.emit('alert', `Trade URL successfully updated!`);
					}
				});
			}
			else {
				socket.emit('alert', `Please enter a valid Trade URL`);
			}
		}
		else {
			socket.emit('alert', `You must be logged in to update your Trade URL!`);
		}
	});
	socket.on('tf2Sell', function (amount) {
		if (socketuser) {
			if (amount) {
				let alreadyWithdrawing = false;
				for (let i = withdrawProgress.length - 1; i >= 0; i--) {
					if (withdrawProgress[i] == socketuser.steamid) {
						alreadyWithdrawing = true;
					}
				}
				setTimeout(function () {
					removeWithdrawProgress(socketuser.steamid);
				}, config.tradeTimeout * 1000);
				if (!alreadyWithdrawing) {
					amount = parseInt(amount);
					if (isNaN(amount) || amount < 1) {
						socket.emit('alert', commonLogs.validAmount);
						socket.emit('modalErrorFeedback', commonLogs.validAmount);
					}
					else if (amount > config.max.tf2) {
						let text = `Maximum ${config.max.tf2} keys per TF2 trade`;
						socket.emit('alert', text);
						socket.emit('modalErrorFeedback', text);
					}
					else {
						database.getUserBySteamId(socketuser.steamid, (err, user) => {
							if (err) {
								console.error(err);
								socket.emit('alert', commonLogs.generalErr);
								socket.emit('modalErrorFeedback', commonLogs.generalErr);
							}
							else {
								if (user.tradeurl) {
                  let customSteamid;
                  let sendSteamid = socketuser.steamid;
                  if (user.customsteamid) {
                    customSteamid = user.customsteamid;
                    sendSteamid = user.customsteamid;
                  }
                  console.log(sendSteamid)
									withdrawProgress.push(socketuser.steamid);
									tradeHandler.getKeysInSteamInventory(sendSteamid, (err, keys) => {
										if (err) {
											console.error(err);
											socket.emit('alert', commonLogs.generalErr);
											socket.emit('modalErrorFeedback', commonLogs.generalErr);
										}
										else {
											if (keys.length >= amount) {
												let theirKeys = keys.slice(0, amount);
												let preValue = amount * config.rates.tf2SellPrice;
												let message = `${config.siteName} - Trade for ${amount} keys / $${preValue.toFixed(2)}. This offer will be cancelled in 10 minutes.`;
												socket.emit('changeModalStatus', `Sending trade offer...`);
												tradeHandler.sendSteamTrade(user.tradeurl, theirKeys, message, 'Sell', 1000 * 60 * 10, (err, offer) => {
													if (err) {
														console.error(err);
														socket.emit('alert', commonLogs.generalErr);
														socket.emit('modalErrorFeedback', commonLogs.generalErr);
													}
													else {
														let sentKeys = [];
														
														offer.itemsToReceive.forEach(function (key) {
															sentKeys.push(key.assetid);
														});
														let sentValue = config.rates.tf2SellPrice * sentKeys.length;
														
														socket.emit('clearAmountInputs');
														socket.emit('alert', `TF2 Sell offer sent!`);
														socket.emit('modalSuccessFeedback', commonLogs.getSteamTradeSentHtml(offer.id));
														let logText = `[SELL OFFER] ${socketuser.steamid} - ${sentKeys.length} TF2 - $${sentValue.toFixed(2)}`;
														console.log(logText);
														if (sentKeys.length !== theirKeys.length) {
															console.error(new Error(`Sent keys proposed not equal to keys actually sent`));
														}
														database.createTf2OpenOffer(socketuser.steamid, offer.id, sentKeys.length, sentValue, 'Sell', utils.getIsoString(), customSteamid, err => {
															if (err) {
																console.error(err);
															}
														});
													}
												});
											}
											else {
												socket.emit('alert', commonLogs.notEnoughKeys);
												socket.emit('modalErrorFeedback', commonLogs.notEnoughKeys);
											}
										}
									});
								}
								else {
									socket.emit('alert', `Please set your Steam Trade URL to trade!`);
									socket.emit('modalEnterTradeURL');
								}
							}
						});
					}
				}
				else {
					socket.emit('alert', commonLogs.tradeWait);
					socket.emit('modalErrorFeedback', commonLogs.tradeWait);
				}
			}
			else {
				socket.emit('alert', commonLogs.generalErr);
				socket.emit('modalErrorFeedback', commonLogs.generalErr);
			}
		}
		else {
			socket.emit('alert', commonLogs.login);
			socket.emit('modalErrorFeedback', commonLogs.login);
		}
	});
	socket.on('vgoSell', amount => {
		if (socketuser) {
			if (amount) {
				let alreadyWithdrawing = false;
				for (let i = withdrawProgress.length - 1; i >= 0; i--) {
					if (withdrawProgress[i] == socketuser.steamid) {
						alreadyWithdrawing = true;
					}
				}
				setTimeout(function () {
					removeWithdrawProgress(socketuser.steamid);
				}, config.tradeTimeout * 1000);
				if (!alreadyWithdrawing) {
					amount = parseInt(amount);
					if (isNaN(amount) || amount < 1) {
						socket.emit('alert', commonLogs.validAmount);
						socket.emit('modalErrorFeedback', commonLogs.validAmount);
					}
					else if (amount > config.max.vgo) {
						let text = `Maximum ${config.max.vgo} keys per VGO trade`;
						socket.emit('alert', text);
						socket.emit('modalErrorFeedback', text);
					}
					else {
						database.getUserBySteamId(socketuser.steamid, (err, user) => {
							if (err) {
								console.error(err);
								socket.emit('alert', commonLogs.generalErr);
								socket.emit('modalErrorFeedback', commonLogs.generalErr);
							}
							else {
								withdrawProgress.push(socketuser.steamid);
								let customsteamid;
								let opskinsSendId = socketuser.steamid;
								if (user.customsteamid) {
									customsteamid = user.customsteamid;
									opskinsSendId = user.customsteamid;
								}
								tradeHandler.getKeysInVgoInventory(opskinsSendId, (err, keys) => {
									if (err) {
										console.error(err);
										socket.emit('alert', commonLogs.generalErr);
										socket.emit('modalErrorFeedback', commonLogs.generalErr);
									}
									else {
										if (keys.length >= amount) {
											socket.emit('changeModalStatus', `Sending trade offer...`);
											let theirKeys = keys.slice(0, amount);
											let preValue = theirKeys.length * config.rates.vgoSellPrice;
											
											let tradeMsg = `${config.siteName} - Trade for ${theirKeys.length} keys / $${preValue.toFixed(2)}.`;
											tradeHandler.sendVgoTrade(opskinsSendId, theirKeys.toString(), tradeMsg, (err, offer) => {
												if (err) {
													console.error(err);
													socket.emit('alert', commonLogs.generalErr);
													socket.emit('modalErrorFeedback', commonLogs.generalErr);
												}
												else {
													if (offer.status == 1) {
														let sentKeys = [];
														offer.response.offer.recipient.items.forEach(function (item) {
															sentKeys.push(item.id);
														});
														let sentValue = sentKeys.length * config.rates.vgoSellPrice;
														
														database.createVgoOpenOffer(socketuser.steamid, offer.response.offer.id, sentKeys.length, parseFloat(sentValue.toFixed(2)), 'Sell', utils.getIsoString(), customsteamid, err => {
															if (err) {
																console.error(err);
																let fatal = `A FATAL ERROR OCCURRED, DO NOT ACCEPT INCOMING TRADE. CONTACT A STAFF MEMBER IMMEDIATELY`;
																socket.emit('alert', fatal);
																socket.emit('modalErrorFeedback', fatal);
															}
															else {
																socket.emit('alert', `VGO sell offer sent!`);
																socket.emit('modalSuccessFeedback', `<h5>Trade offer sent!</h5><a class="btn blue accent-2" href="https://trade.opskins.com/trade-offers/${offer.response.offer.id}" target="_blank">View Trade</a>`);
																let logText = `[SELL OFFER] ${socketuser.steamid} - ${sentKeys.length} VGO - $${sentValue.toFixed(2)}`;
																console.log(logText);
																socket.emit('clearAmountInputs');
															}
														});
													}
													else {
														alertWeb(data.steamid, `An error occurred sending your offer, please try again`, socket);
														eventWeb(data.steamid, 'modalErrorFeedback', `An error occurred sending your offer, please try again`, socket);
													}
												}
											});
										}
										else {
											socket.emit('alert', commonLogs.notEnoughKeys);
											socket.emit('modalErrorFeedback', commonLogs.notEnoughKeys);
										}
									}
								});
							}
						});
					}
				}
				else {
					socket.emit('alert', commonLogs.tradeWait);
					socket.emit('modalErrorFeedback', commonLogs.tradeWait);
				}
			}
			else {
				socket.emit('alert', commonLogs.generalErr);
				socket.emit('modalErrorFeedback', commonLogs.generalErr);
			}
		}
		else {
			socket.emit('alert', commonLogs.login);
			socket.emit('modalErrorFeedback', commonLogs.login);
		}
	});
	socket.on('tf2Buy', amount => {
		if (socketuser) {
			if (amount) {
				let alreadyWithdrawing = false;
				for (let i = withdrawProgress.length - 1; i >= 0; i--) {
					if (withdrawProgress[i] == socketuser.steamid) {
						alreadyWithdrawing = true;
					}
				}
				setTimeout(function () {
					removeWithdrawProgress(socketuser.steamid);
				}, config.tradeTimeout * 1000);
				if (!alreadyWithdrawing) {
					amount = parseInt(amount);
					if (isNaN(amount) || amount < 1) {
						socket.emit('alert', commonLogs.validAmount);
						socket.emit('modalErrorFeedback', commonLogs.validAmount);
					}
					else if (amount > config.max.tf2) {
						let text = `Maximum ${config.max.tf2} keys per TF2 trade`;
						socket.emit('alert', text);
						socket.emit('modalErrorFeedback', text);
					}
					else {
						database.getUserBySteamId(socketuser.steamid, (err, user) => {
							if (err) {
								console.error(err);
								socket.emit('alert', commonLogs.generalErr);
								socket.emit('modalErrorFeedback', commonLogs.generalErr);
							}
							else {
								if (user.tradeurl) {
									withdrawProgress.push(socketuser.steamid);
									database.getBalanceBySteamId(socketuser.steamid, (err, balance) => {
										if (err) {
											console.error(err);
											socket.emit('alert', commonLogs.generalErr);
											socket.emit('modalErrorFeedback', commonLogs.generalErr);
										}
										else {
											if (balance >= parseFloat((amount * config.rates.tf2BuyPrice).toFixed(2))) {
												if (amount <= tf2KeysInStock) {
													database.getTf2KeysForTrade(amount, (err, result) => {
														if (err) {
															console.error(err);
															socket.emit('alert', commonLogs.generalErr);
															socket.emit('modalErrorFeedback', commonLogs.generalErr);
														}
														else {
															let keysToSend = [];
															result.forEach(function (key) {
																keysToSend.push(key.assetid);
															});
															
															if (result.length == amount) {
																let preValue = amount * config.rates.tf2BuyPrice;
																let offerMsg = `${config.siteName} - Trade for ${amount} keys / $${preValue.toFixed(2)}. This offer will be cancelled in 10 minutes.`;
																socket.emit('changeModalStatus', `Sending trade offer...`);
																tradeHandler.sendSteamTrade(user.tradeurl, keysToSend, offerMsg, 'Buy', 1000 * 60 * 10, (err, offer) => {
																	if (err) {
																		console.error(err);
																		socket.emit('alert', commonLogs.generalErr);
																		socket.emit('modalErrorFeedback', commonLogs.generalErr);
																	}
																	else {
																		socket.emit('changeModalStatus', `Trade sent, confirming it...`);
                                    socket.emit('clearAmountInputs');
																		let sentKeys = [];
																		
																		offer.itemsToGive.forEach(function (item) {
																			sentKeys.push(item.assetid);
																		});
																		
																		let realValue = sentKeys.length * config.rates.tf2BuyPrice;
																		
																		offer.itemsToGive.forEach(function (item) {
																			database.addTf2InTrade(item.assetid, err => {
																				if (err) {
																					console.error(err);
																				} else {
																					updateInStock();
																				}
																			});
																		});
																		
																		let logText = `[BUY OFFER] ${socketuser.steamid} - ${sentKeys.length} TF2 - $${realValue.toFixed(2)}`;
																		console.log(logText);
																		
																		let customSteamid;
																		if (socketuser.steamid !== offer.partner.getSteamID64()) {
																			customSteamid = offer.partner.getSteamID64();
																		}
																		
																		database.createTf2OpenOffer(socketuser.steamid, offer.id, sentKeys.length, realValue, 'Buy', utils.getIsoString(), customSteamid, err => {
																			if (err) {
																				console.error(err);
																			}
																		});
																		database.updateBalanceBySteamId(socketuser.steamid, realValue * -1, err => {
																			if (err) {
																				console.error(err);
																			}
																			else {
																				emitBalance(socketuser.steamid, err => {
																					if (err) {
																						console.error(err);
																					}
																				});
																			}
																		});
																		tradeHandler.acceptSteamConfirmation(offer.id, err => {
																			if (err) {
																				console.error(err);
																				let msg = `Trade could not be confirmed, please allow up to 5 minutes for it to be confirmed!`;
																				socket.emit('alert', msg);
																				socket.emit('modalSuccessFeedback', `<h5>${msg}</h5>`);
																				console.log(`[UNCONFIRMED] ${socketuser.steamid} offer not confirmed`);
																			}
																			else {
																				socket.emit('alert', `TF2 buy offer sent!`);
																				socket.emit('modalSuccessFeedback', commonLogs.getSteamTradeSentHtml(offer.id));
																				console.log(`[CONFIRMED] ${socketuser.steamid} offer confirmed`);
																			}
																		});
																	}
																});
															}
															else {
																socket.emit('alert', commonLogs.notEnoughStock);
																socket.emit('modalErrorFeedback', commonLogs.notEnoughStock);
															}
														}
													});
												}
												else {
													socket.emit('alert', commonLogs.notEnoughStock);
													socket.emit('modalErrorFeedback', commonLogs.notEnoughStock);
												}
											}
											else {
												socket.emit('alert', `You don't have enough balance!`);
												socket.emit('modalErrorFeedback', `You don't have enough balance!`);
											}
										}
									});
								}
								else {
									socket.emit('alert', `Please set your Steam Trade URL to trade!`);
									socket.emit('modalEnterTradeURL');
								}
							}
						});
					}
				}
				else {
					socket.emit('alert', commonLogs.tradeWait);
					socket.emit('modalErrorFeedback', commonLogs.tradeWait);
				}
			}
			else {
				socket.emit('alert', commonLogs.generalErr);
				socket.emit('modalErrorFeedback', commonLogs.generalErr);
			}
		}
		else {
			socket.emit('alert', commonLogs.login);
			socket.emit('modalErrorFeedback', commonLogs.login);
		}
	});
	socket.on('vgoBuy', amount => {
		if (socketuser) {
			if (amount) {
				let alreadyWithdrawing = false;
				for (let i = withdrawProgress.length - 1; i >= 0; i--) {
					if (withdrawProgress[i] == socketuser.steamid) {
						alreadyWithdrawing = true;
					}
				}
				setTimeout(function () {
					removeWithdrawProgress(socketuser.steamid);
				}, config.tradeTimeout * 1000);
				if (!alreadyWithdrawing) {
					amount = parseInt(amount);
					if (isNaN(amount) || amount < 1) {
						socket.emit('alert', commonLogs.validAmount);
						socket.emit('modalErrorFeedback', commonLogs.validAmount);
					}
					else if (amount > config.max.vgo) {
						let text = `Maximum ${config.max.vgo} keys per VGO trade`;
						socket.emit('alert', text);
						socket.emit('modalErrorFeedback', text);
					}
					else {
						database.getUserBySteamId(socketuser.steamid, (err, user) => {
							if (err) {
								console.error(err);
								socket.emit('alert', commonLogs.generalErr);
								socket.emit('modalErrorFeedback', commonLogs.generalErr);
							}
							else {
                database.getBalanceBySteamId(socketuser.steamid, (err, balance) => {
										if (err) {
											console.error(err);
											socket.emit('alert', commonLogs.generalErr);
											socket.emit('modalErrorFeedback', commonLogs.generalErr);
										}
										else {
											if (balance >= parseFloat((amount * config.rates.vgoBuyPrice).toFixed(2))) {
												if (amount <= vgoKeysInStock) {
                          database.getVgoKeysForTrade(amount, (err, result) => {
                            if (err) {
                              console.error(err);
                              socket.emit('alert', commonLogs.generalErr);
                              socket.emit('modalErrorFeedback', commonLogs.generalErr);
                            }
                            else {
                              let keysToSend = [];
                              result.forEach(function (key) {
                                keysToSend.push(key.assetid);
                              });
                              if (result.length == amount) {
                                let value = amount * config.rates.vgoBuyPrice;
                                let offerMsg = `${config.siteName} - Trade for ${amount} keys / $${value.toFixed(2)}.`;
                                socket.emit('changeModalStatus', `Sending trade offer...`);
                                let customsteamid;
                                let opskinsSendId = socketuser.steamid;
                                if (user.customsteamid) {
                                  customsteamid = user.customsteamid;
                                  opskinsSendId = user.customsteamid;
                                }
                                tradeHandler.sendVgoTrade(opskinsSendId, keysToSend.toString(), offerMsg, (err, offer) => {
                                  if (err) {
                                    console.error(err);
                                    socket.emit('alert', commonLogs.generalErr);
                                    socket.emit('modalErrorFeedback', commonLogs.generalErr);
                                  }
                                  else {
                                    if (offer.status == 1) {
                                      let sentKeys = [];
                                      offer.response.offer.sender.items.forEach(function (item) {
                                        sentKeys.push(item.id);
                                      });
                                      let afterValue = sentKeys.length * config.rates.vgoBuyPrice;
                                      offer.response.offer.sender.items.forEach(function (item) {
                                        database.addVgoInTrade(item.id, err => {
                                          if (err) {
                                            console.error(err);
                                          }
                                          else {
                                            updateInStock();
                                          }
                                        });
                                      });
                                      let keyLength = sentKeys.length;
                                      database.updateBalanceBySteamId(socketuser.steamid, afterValue * -1, err => {
                                        if (err) {
                                          console.error(err);
                                        }
                                        else {
                                          emitBalance(socketuser.steamid, err => {
                                            if (err) {
                                              console.error(err);
                                            }
                                          });
                                        }
                                      });
                                      database.createVgoOpenOffer(socketuser.steamid, offer.response.offer.id, keyLength, afterValue, 'Buy', utils.getIsoString(), customsteamid, err => {
                                        if (err) {
                                          console.error(err);
                                        }
                                        else {
                                          socket.emit('alert', `VGO buy offer sent!`);
                                          socket.emit('modalSuccessFeedback', `<h5>Trade offer sent!</h5><a class="btn blue accent-2" href="https://trade.opskins.com/trade-offers/${offer.response.offer.id}" target="_blank">View Trade</a>`);
                                          let logText = `[BUY OFFER] ${socketuser.steamid} - ${sentKeys.length} VGO - $${afterValue.toFixed(2)}`;
                                          console.log(logText);
                                          socket.emit('clearAmountInputs');
                                        }
                                      });
                                    }
                                    else {
                                      alertWeb(data.steamid, `An error occurred sending your offer, please try again`, socket);
                                      eventWeb(data.steamid, 'modalErrorFeedback', `An error occurred sending your offer, please try again`, socket);
                                    }
                                  }
                                });
                              }
                              else {
                                socket.emit('alert', commonLogs.notEnoughStock);
                                socket.emit('modalErrorFeedback', commonLogs.notEnoughStock);
                              }
                            }
                          });
                        } else {
                          socket.emit('alert', commonLogs.notEnoughStock);
                          socket.emit('modalErrorFeedback', commonLogs.notEnoughStock);
                        }
                      } else {
                        socket.emit('alert', `You don't have enough balance!`);
												socket.emit('modalErrorFeedback', `You don't have enough balance!`);
                      }
                    }
                });
							}
						});
					}
				}
				else {
					socket.emit('alert', commonLogs.tradeWait);
					socket.emit('modalErrorFeedback', commonLogs.tradeWait);
				}
			}
			else {
				socket.emit('alert', commonLogs.generalErr);
				socket.emit('modalErrorFeedback', commonLogs.generalErr);
			}
		}
		else {
			socket.emit('alert', commonLogs.login);
			socket.emit('modalErrorFeedback', commonLogs.login);
		}
	});
  socket.on('opskinsWithdraw', function(amount) {
    if (socketuser) {
      if (amount) {
        let alreadyWithdrawing = false;
				for (let i = withdrawProgress.length - 1; i >= 0; i--) {
					if (withdrawProgress[i] == socketuser.steamid) {
						alreadyWithdrawing = true;
					}
				}
				setTimeout(function () {
					removeWithdrawProgress(socketuser.steamid);
				}, config.tradeTimeout * 1000);
        if (!alreadyWithdrawing) {
          amount = parseFloat(amount);
          if (isNaN(amount) || amount < 0.01) {
            socket.emit('alert', `Please enter a valid amount`);
            socket.emit('modalErrorFeedback', `Please enter a valid amount`);
          }
          else {
            database.getBalanceBySteamId(socketuser.steamid, (err, balance) => {
              if (err) {
                console.error(err);
                socket.emit('alert', commonLogs.generalErr);
                socket.emit('modalErrorFeedback', commonLogs.generalErr);
              } else {
                if (balance >= amount) {
                  database.getUserBySteamId(socketuser.steamid, (err, user) => {
                    if (err) {
                      console.error(err);
                      socket.emit('alert', commonLogs.generalErr);
                      socket.emit('modalErrorFeedback', commonLogs.generalErr);
                    } else {
                      let customSteamid;
                      let sendSteamid = socketuser.steamid;
                      if (user.customsteamid) {
                        customSteamid = user.customsteamid;
                        sendSteamid = user.customsteamid;
                      }
                      tradeHandler.sendOpskinsFunds(sendSteamid, amount, (err, id) => {
                        if (err) {
                          console.error(err);
                          socket.emit('alert', commonLogs.generalErr);
                          socket.emit('modalErrorFeedback', commonLogs.generalErr);
                        } else {
                          socket.emit('alert', `OPSkins funds sent!`);
						              socket.emit('modalSuccessFeedback', `<h5>Funds successfully sent!</h5><h6>Transfer ID: ${id}</h6>`);
                          database.updateBalanceBySteamId(socketuser.steamid, amount * -1, err => {
                            if (err) {
                              console.error(err);
                            } else {
                              emitBalance(socketuser.steamid, err => {
                                if (err) {
                                  console.error(err);
                                }
                              });
                            }
                          });
                          database.insertOpskinsWithdrawal(socketuser.steamid, id, amount, customSteamid, utils.getIsoString(), err => {
                            if (err) {
                              console.error(err);
                            }
                          });
                        }
                      });
                    }
                  });
                } else {
                  socket.emit('alert', `You don't have enough balance!`);
								  socket.emit('modalErrorFeedback', `You don't have enough balance!`);
                }
              }
            });
          }
        }
        else {
          socket.emit('alert', `Please wait at least 10 seconds before requesting another trade`);
          socket.emit('modalErrorFeedback', `Please wait at least 10 seconds before requesting another trade`);
        }
      }
      else {
        socket.emit('alert', `An error occurred, please try again`);
        socket.emit('modalErrorFeedback', `An error occurred, please try again`);
      }
      }
      else {
        socket.emit('alert', `You must be logged in to trade!`);
        socket.emit('modalErrorFeedback', `You must be logged in to trade!`);
      }
  });
});
// Root route
app.get('/', function(req, res) {
	res.render('index', getMainObject(req.user));
	// Log the activity, just to get a feel for 
	// how much activity we're getting
	if (req.user) {
		console.log(`[ACTIVITY] ${req.user.personaname}/${req.user.steamid}`);
	}
	else {
		console.log(`[ACTIVITY] NOT LOGGED IN`);
	}
});
// All routes look the same server-side, the client will
// make socket requests depending on the route
app.get(['/terms', '/faq', '/contact', '/settings', '/privacy'], function(req, res) {
	res.render('index', getMainObject(req.user));
});
// This deals with /auth/steam and /auth/steam/return
app.get(/^\/auth\/steam(\/return)?$/, passport.authenticate('steam', {
	failureRedirect: '/'
}), (req, res) => {
	res.redirect('/');
});
// Log the user out
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});
// Listen on the specified port
server.listen(config.port);

// This function periodically checks open TF2 offers.
function checkTf2Offers() {
	// Retrieve our list of open offers from the database.
	tradeHandler.retrieveOpenTf2Offers((err, accepted, failed) => {
		if (err) {
			console.error(err);
		}
		else {
			// We deal with the successful offers here
			accepted.forEach(function (acceptedOffer) {
				database.getTf2OfferById(acceptedOffer.id, (err, localOffer) => {
					if (err) {
						console.error(err);
					}
					else {
						// We separate the steamid of the account, and the
						// custom steamid if present
						let realSteamid = localOffer.steamid;
						let customSteamid = localOffer.custom;
						
						// No items to give - must be a successful sell offer
						if (!acceptedOffer.itemsToGive.length) {

							// The number of keys in the trade
							let keys = acceptedOffer.itemsToReceive.length;
							// The value of the keys in the trade
							let value = acceptedOffer.itemsToReceive.length * config.rates.tf2SellPrice;

							// First delete it from open offers
							database.deleteOpenTf2Offer(acceptedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									// If it can't be deleted, throw an error
									assert(result.affectedRows, `Offer not deleted from open offers`);

									// Add the transaction to history
									database.addTf2OfferHistory(realSteamid, acceptedOffer.id, keys, value, utils.getIsoString(), 'Sell', customSteamid, err => {
										if (err) {
											console.error(err);
										}
									});
									console.log(`[SUCCESS SELL] ${realSteamid} sold ${keys} TF2 keys ($${value.toFixed(2)})`);
									// Here's where this function comes in handy. We can emit 
									// to a client outside the socket session, which we are.
									emitAlertToClient(realSteamid, `Successfully sold ${keys} TF2 keys ($${value.toFixed(2)})`);

									// The sell was successful, we can update their balance
									database.updateBalanceBySteamId(realSteamid, value, err => {
										if (err) {
											console.error(err);
										}
										else {
											// Emit the new balance so the client doesn't
											// need to refresh the page.
											emitBalance(realSteamid, err => {
												if (err) {
													console.error(err);
												}
											});
										}
									});
								}
							});
						}
						// Items to give - must be a successful buy offer
						else if (acceptedOffer.itemsToGive.length) {
							// The array of keys that were sent
							let keyArr = acceptedOffer.itemsToGive;
							// The number of keys sent
							let keys = acceptedOffer.itemsToGive.length;
							// The site value of keys sent
							let value = acceptedOffer.itemsToGive.length * config.rates.tf2BuyPrice;

							console.log(`[SUCCESS BUY] ${realSteamid} - ${keys} TF2 - $${value.toFixed(2)}`);
							emitAlertToClient(realSteamid, `TF2 Buy Offer Completed!`);

							// First, delete the open offer from database
							database.deleteOpenTf2Offer(acceptedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									// If it's not deleted, throw error
									assert(result.affectedRows, `Offer not deleted from open offers`);

									// Add it to the history
									database.addTf2OfferHistory(realSteamid, acceptedOffer.id, keys, value, utils.getIsoString(), 'Buy', customSteamid, err => {
										if (err) {
											console.error(err);
										}
									});

									// Delete the keys database table, the
									// keys have successfully been traded away
									keyArr.forEach(function (key) {
										database.deleteTf2Key(key.assetid, err => {
											if (err) {
												console.error(err);
											}
										});
									});
								}
							});
						}
					}
				});
				
			});
			// We deal with the failed offers here
			failed.forEach(function (failedOffer) {
				database.getTf2OfferById(failedOffer.id, (err, localOffer) => {
					if (err) {
						console.error(err);
					}
					else {
						// We separate the steamid of the account, and the
						// custom steamid if present
						let realSteamid = localOffer.steamid;
						let customSteamid = localOffer.custom;
						
						// No items to give - must be a failed sell offer
						if (!failedOffer.itemsToGive.length) {
							let keys = failedOffer.itemsToReceive.length;
							let value = failedOffer.itemsToReceive.length * config.rates.tf2SellPrice;
							console.log(`[CANCELLED SELL] ${realSteamid} - ${keys} TF2 - $${value.toFixed(2)}`);
							emitAlertToClient(realSteamid, `TF2 Sell offer cancelled`);

							// Don't to do anything with a failed sell other than 
							// delete it from our open offers table.
							database.deleteOpenTf2Offer(failedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									assert(result.affectedRows, `Offer not deleted from open offers`);
								}
							});
						}
						// Items to give - must be a failed buy offer
						else if (failedOffer.itemsToGive.length) {
							let keyArr = failedOffer.itemsToGive;
							let keys = failedOffer.itemsToGive.length;
							let value = failedOffer.itemsToGive.length * config.rates.tf2BuyPrice;
							console.log(`[CANCELLED BUY] ${realSteamid} - ${keys} TF2 - $${value}`);
							emitAlertToClient(realSteamid, `TF2 Buy offer cancelled`);

							// For a failed buy offer, we must refund the user, delete
							// the offer, and restore the keys in stock.

							// Delete the offer from the database
							database.deleteOpenTf2Offer(failedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									assert(result.affectedRows, `Offer not deleted from open offers`);

									// Remove the keys from 'intrade' in the database,
									// allowing them to be tradable again.
									keyArr.forEach(function (key) {
										database.revertTf2InTrade(key.assetid, err => {
											if (err) {
												console.error(err);
											}
											else {
												updateInStock();
											}
										});
									});
									// Refund the user
									database.updateBalanceBySteamId(realSteamid, value, err => {
										if (err) {
											console.error(err);
										}
										else {
											emitBalance(realSteamid, err => {
												if (err) {
													console.error(err);
												}
											});
										}
									});
								}
							});
						}
					}
				});
			});
		}
	});
}

// Allow 5 seconds for the bot to logon,
// then start checking offers forever.
setTimeout(function () {
	checkTf2Offers();
	setInterval(function () {
		checkTf2Offers();
	}, config.tf2OfferRefresh * 1000);
}, 5000);

// This function periodically checks open tf2 offers.
function checkVgoOffers() {
	// Get the open offers
	tradeHandler.retrieveOpenVgoOffers((err, accepted, failed) => {
		if (err) {
			console.error(err);
		}
		else {
			// Deal with the accepted VGO offers here
			accepted.forEach(function (acceptedOffer) {
				// First retrieve the offer from the database.
				database.getVgoOfferById(acceptedOffer.id, (err, localOffer) => {
					if (err) {
						console.error(err);
					}
					else {
						// We separate the steamid of the account, and the
						// custom steamid if present
						let realSteamid = localOffer.steamid;
						let customSteamid = localOffer.custom;
						
						// No sender items - must be a successful sell
						if (!acceptedOffer.sender.items.length) {
							let keyArr = acceptedOffer.recipient.items;
							let keys = acceptedOffer.recipient.items.length;
							let value = acceptedOffer.recipient.items.length * config.rates.vgoSellPrice;
							
							// Delete the open offer
							database.deleteOpenVgoOffer(acceptedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									assert(result.affectedRows, `Offer not deleted from open offers`);
									// Insert the transaction into the offer history
									database.addVgoOfferHistory(realSteamid, acceptedOffer.id, keys, value, utils.getIsoString(), 'Sell', customSteamid, err => {
										if (err) {
											console.error(err);
										}
									});
									// Unlike Steam, up-to-date assetids are provided in the 
									// offer receipt, so we'll use them now.
									keyArr.forEach(function (key) {
										database.insertVgoKey(key.id, err => {
											if (err) {
												console.error(err);
											} else {
												updateInStock();
											}
										});
									});
									console.log(`[SUCCESS SELL] ${realSteamid} sold ${keys} VGO keys ($${value.toFixed(2)})`);
									emitAlertToClient(realSteamid, `Successfully sold ${keys} VGO keys ($${value.toFixed(2)})`);
									// Update the balance of the real account
									database.updateBalanceBySteamId(realSteamid, value, err => {
										if (err) {
											console.error(err);
										}
										else {
											emitBalance(realSteamid, err => {
												if (err) {
													console.error(err);
												}
											});
										}
									});
								}
							});
						}
						// Sender items - must be a successful buy
						else if (acceptedOffer.sender.items.length) {
							let keyArr = acceptedOffer.sender.items;
							let keys = acceptedOffer.sender.items.length;
							let value = acceptedOffer.sender.items.length * config.rates.vgoBuyPrice;
							console.log(`[SUCCESS BUY] ${realSteamid} - ${keys} VGO - $${value.toFixed(2)}`);
							emitAlertToClient(realSteamid, `VGO buy offer completed!`);
							
							// Add the offer to history
							database.addVgoOfferHistory(realSteamid, acceptedOffer.id, keys, value, utils.getIsoString(), 'Buy', customSteamid, err => {
								if (err) {
									console.error(err);
								}
							});
							// Delete the offer from open
							database.deleteOpenVgoOffer(acceptedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									assert(result.affectedRows, `Offer not deleted from open offers`);
								}
							});
							
							// We can delete the keys from the database - they
							// have been successfully traded away
							keyArr.forEach(function (key) {
								database.deleteVgoKey(key.id, err => {
									if (err) {
										console.error(err);
									}
								});
							});
						}
					}
				});
			});
			// Deal with the failed VGO offers here
			failed.forEach(function (failedOffer) {
				// First retrieve the offer from the database.
				database.getVgoOfferById(failedOffer.id, (err, localOffer) => {
					if (err) {
						console.error(err);
					}
					else {
						let realSteamid = localOffer.steamid;
						let customSteamid = localOffer.custom;
						// No sender items - must be a failed sell offer
						if (!failedOffer.sender.items.length) {
							console.log(`[CANCELLED SELL] ${realSteamid} - ${failedOffer.recipient.items.length} VGO - $${failedOffer.recipient.items.length * config.rates.vgoSellPrice}`);
							emitAlertToClient(realSteamid, `VGO Sell offer cancelled`);
							
							// Delete the open offer from the database
							database.deleteOpenVgoOffer(failedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									assert(result.affectedRows, `Offer not deleted from open offers`);
								}
							});
						}
						// Sender items - must be a failed buy offer
						else if (failedOffer.sender.items.length) {
							let keyArr = failedOffer.sender.items;
							let keys = failedOffer.sender.items.length;
							let value = failedOffer.sender.items.length * config.rates.vgoBuyPrice;
							console.log(`[CANCELLED BUY] ${realSteamid} - ${keys} VGO - $${value}`);
							emitAlertToClient(realSteamid, `VGO Buy offer cancelled`);
							
							// This adds the keys back to the site
							// stock database, tracked by the
							// 'intrade' column
							keyArr.forEach(function (key) {
								database.revertVgoInTrade(key.id, err => {
									if (err) {
										console.error(err);
									}
									else {
										updateInStock();
									}
								});
							});
							// Delete the open offer from database
							database.deleteOpenVgoOffer(failedOffer.id, (err, result) => {
								if (err) {
									console.error(err);
								}
								else {
									assert(result.affectedRows, `Offer not deleted from open offers`);
									// Refund the user
									database.updateBalanceBySteamId(realSteamid, value, err => {
										if (err) {
											console.error(err);
										}
										else {
											// Update balance so they don't have to
											// refresh the page
											emitBalance(realSteamid, err => {
												if (err) {
													console.error(err);
												}
											});
										}
									});
								}
							});
						}
					}
				});
			});
		}
	});
}
// Start an interval to constantly
// check open offers
checkVgoOffers();
setInterval(function () {
	checkVgoOffers();
}, config.vgoOfferRefresh * 1000);
