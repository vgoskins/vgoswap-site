const path = require('path');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const request = require('request');

const config = require(path.join(__dirname, '..', 'config', 'config.js'));
const utils = require(path.join(__dirname, 'utils.js'));
const database = require(path.join(__dirname, 'database', 'database.js'));

const ExpressTrade = require('expresstrade');

const ET = new ExpressTrade({
  apikey: config.api.opskins.opskinsTradeApiKey,
  twofactorsecret: config.api.opskins.opskinsTradeSecret,
	pollInterval: config.api.opskins.opskinsPollInterval * 1000
});

const client = new SteamUser();
const SteamID = SteamCommunity.SteamID;

const logOnOptions = {
	accountName: config.steamBot.botUsername
	, password: config.steamBot.botPassword
	, twoFactorCode: SteamTotp.generateAuthCode(config.steamBot.botSharedSecret)
};

const community = new SteamCommunity();
const manager = new TradeOfferManager({
	steam: client
	, community: community
	, language: 'en'
});

client.on('webSession', (sessionid, cookies) => {
	manager.setCookies(cookies);
	community.setCookies(cookies);
	community.startConfirmationChecker(300000, config.steamBot.botIdentitySecret);
	updateInventory();
	setInterval(function () {
		updateInventory();
	}, 30000);
});

client.on('loggedOn', () => {
	console.log('[BOT] Logged into Steam');
	client.setPersona(SteamUser.Steam.EPersonaState.Online);
	client.gamesPlayed(config.steamBot.inGame);
});

manager.on('newOffer', offer => {
	let admin;
	config.admins.forEach(function(person) {
		if (person == offer.partner.getSteamID64()) {
			admin = true;
		}
	});
	if (admin) {
		offer.accept((err, status) => {
			if (err) {
				console.error(err);
			}
			else {
				console.log(`[BOT] Trade accepted from ${offer.partner.getSteamID64()}`);
				community.acceptConfirmationForObject(config.steamBot.botIdentitySecret, offer.id, err => {
					if (err) {
						console.error(err);
					}
					else {
						console.log(`Admin trade confirmed!`);
					}
				});
			}
		})
	}
	else {
		offer.decline(err => {
			if (err) {
				console.error(err);
			}
			else {
				console.log('[BOT] Cancelled offer from ' + offer.partner.getSteamID64());
			}
		});
	}
});

let lastLoginAttempt = Date.now();
community.on('sessionExpired', err => {
    console.error(`SESSION EXPIRED, LOGGING IN...`);
    if (Date.now() - lastLoginAttempt > 30000) {
      lastLoginAttempt = Date.now();
      client.webLogOn();
    }
    else {
      console.error(`WAITING 30 SECONDS BEFORE LOGIN ATTEMPT AGAIN`);
    }
});

function updateInventory() {
	manager.getInventoryContents(440, 2, true, (err, inventory) => {
		if (err) {
			console.error(err);
		}
		else {
			inventory.forEach(function (item) {
				if (item.market_hash_name == 'Mann Co. Supply Crate Key') {
					database.insertTf2Key(item.assetid, err => {
						if (err) {
							console.error(err);
						}
					});
				}
			});
		}
	});
}

module.exports = {
	init: function () {
		client.logOn(logOnOptions);
	},
	getKeysInVgoInventory: function(steamid, cb) {
		ET.ITrade.GetUserInventoryFromSteamId({steam_id: steamid, app_id: 1, search: 'Skeleton Key'}, (err, body) => {
			if (err) {
				cb(err);
			} else {
				// If status is 1, inventory loaded successfully
				if (body.status == 1) {
					let theirInvKeys = [];
					body.response.items.forEach(function (item) {
						if (item.name === 'Skeleton Key') {
							theirInvKeys.push(item.id);
						}
					});
					cb(null, theirInvKeys);
				} else {
					// If status is not 1, something went wrong.
					cb(new Error(body.message));
				}
			}
		});
	},
	getKeysInSteamInventory: function(steamid, cb) {
		let steamidObj = new TradeOfferManager.SteamID(steamid);
		manager.getUserInventoryContents(steamidObj, 440, 2, true, (err, inventory) => {
			if (err) {
				cb(err);
			}
			else {
				let theirKeysProto = [];
				inventory.forEach(function (item) {
					if (item.market_hash_name === 'Mann Co. Supply Crate Key') {
						theirKeysProto.push(item.assetid);
					}
				});
				cb(null, theirKeysProto);
			}
		});
	},
	sendVgoTrade: function(steamid, items, message, cb) {
		ET.ITrade.SendOfferToSteamId({steam_id: steamid, items: items, message: message}, (err, body) => {
			if (err) {
				cb(err);
			} else {
				// If status is 1, trade was sent successfully
				if (body.status == 1) {
					cb(null, body);
				} else {
					// If status is not 1, something went wrong.
					cb(new Error(body.message));
				}
			}
		});
	},
	sendSteamTrade: function(tradeurl, keys, message, type, canceltime, cb) {
		let offer;
		let noErr = true;
		try {
			offer = manager.createOffer(tradeurl);
		}
		catch (err) {
			cb(err);
			noErr = false;
		}
		finally {
			if (noErr) {
				offer.getUserDetails((err, me, them) => {
					if (err) {
						cb(err);
					}
					else {
						if (them) {
							if (them.escrowDays < 1 || type == 'Buy') {
								keys.forEach(function (key) {
									if (type == 'Sell') {
										offer.addTheirItem({
											assetid: key
											, appid: 440
											, contextid: 2
											, amount: 1
										});
									} else if (type == 'Buy') {
										offer.addMyItem({
											assetid: key
											, appid: 440
											, contextid: 2
											, amount: 1
										});
									}
								});
								offer.setMessage(message);
								offer.data('cancelTime', canceltime);
								offer.send(err => {
									if (err) {
										cb(err);
									}
									else {
										cb(null, offer);
									}
								});
							}
							else {
								cb(`Escrow trades are not accepted`);
							}
						}
						else {
							cb(`An unknown error occurred fetching user details`);
						}
					}
				});
			}
		}
	},
	retrieveOpenTf2Offers: function(cb) {
		database.getOpenTf2Offers((err, result) => {
			if (err) {
				cb(err);
			}
			else {
				if (result.length) {
					manager.getOffers(3, null, function (err, sent) {
						if (err) {
							cb(err);
						}
						else {
							let acceptedOffers = [];
							let failedOffers = [];
							sent.forEach(function (offer) {
								result.forEach(function (localoffer) {
									if (offer.id == localoffer.tradeid) {
										if (offer.state == 3) {
											acceptedOffers.push(offer);
										}
										else if (offer.state == 1 || offer.state == 4 || offer.state == 5 || offer.state == 6 || offer.state == 7 || offer.state == 8 || offer.state == 10) {
											failedOffers.push(offer);
										}
										else if (offer.state == 11) {
											console.error(`ESCROW TRADE HAPPENED - TRADEID ${offer.id}/USER ${offer.partner.getSteamID64()}`);
										}
									}
								});
							});
							cb(null, acceptedOffers, failedOffers);
						}
					});
				}
			}
		});
	},
	retrieveOpenVgoOffers: function(cb) {
		database.getOpenVgoOffers((err, result) => {
			if (err) {
				cb(err);
			}
			else {
				if (result.length) {
					let offersToGet = [];
					result.forEach(function (trade) {
						offersToGet.push(trade.tradeid);
					});
					ET.ITrade.GetOffers({ids: offersToGet.toString()}, (err, body) => {
						if (err) {
							cb(err);
						} else {
							if (body.status == 1) {
								let acceptedOffers = [];
								let failedOffers = [];
								body.response.offers.forEach(function (offer) {
									result.forEach(function (localoffer) {
										if (offer.id == localoffer.tradeid) {
											if (offer.state == 3) {
												acceptedOffers.push(offer);
											}
											else if (offer.state == 5 || offer.state == 6 || offer.state == 7 || offer.state == 8) {
												failedOffers.push(offer);
											}
										}
									});
								});
								cb(null, acceptedOffers, failedOffers);
							} else {
								cb(new Error(body.message));
							}
						}
					});
				}
			}
		});
	},
	acceptSteamConfirmation: function(tradeid, cb) {
		community.acceptConfirmationForObject(config.steamBot.botIdentitySecret, tradeid, err => {
			if (err) {
				cb(err);
			}
			else {
				cb(null);
			}
		});
	},
  sendOpskinsFunds: function(steamid, amount, cb) {
    let apiKey = Buffer.from(config.api.opskins.opskinsBalanceApiKey + ":", "ascii").toString("base64");
		let options = {
			url: 'https://api.opskins.com/ITransactions/TransferFunds/v1/'
			, headers: {
				'authorization': `Basic ${apiKey}`
				, 'Content-Type': 'application/json; charset=utf-8'
			}
			, body: `{"id64":${steamid}, "amount": ${amount*100}}`
		};
		request.post(options, (err, response, body) => {
			if (err) {
				cb(err);
			}
			else {
				if (utils.isValidJson(body)) {
					let realBody = JSON.parse(body);
					if (realBody.status == 1) {
            cb(null, realBody.response.transfer_id);
					} else {
						cb(new Error(realBody.message));
					}
				} else {
          cb(new Error(`Invalid JSON response`));
				}
			}
		});
	}
}
