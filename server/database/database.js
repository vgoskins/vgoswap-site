const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'config', 'config.js'));

const mysql = require('mysql');
let connection = mysql.createConnection({
	host: config.database.name
	, port: config.database.port
	, user: config.database.user
	, password: config.database.password
	, database: config.database.schema
});

module.exports = {
	getBalanceBySteamId: function(steamid, cb) {
		connection.query(`SELECT * FROM balance WHERE steamid = ?`, [steamid], function (err, bal) {
			if (err) {
				cb(err);
			}
			else {
				cb(null, bal[0].balance);
			}
		});
	},
	getTotalTrades: function(cb) {
		connection.query(`SELECT SUM(count) AS sum FROM (
			SELECT COUNT(steamid) AS count FROM tf2sellhistory
			UNION ALL 
			SELECT COUNT(steamid) AS count FROM vgosellhistory
			UNION ALL 
			SELECT COUNT(steamid) AS count FROM tf2buyhistory
			UNION ALL 
			SELECT COUNT(steamid) AS count FROM vgobuyhistory
			UNION ALL 
			SELECT COUNT(steamid) AS count FROM opskinswithdrawals
		) AS f`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0].sum);
			}
		});
	},
	getTotalUsers: function(cb) {
		connection.query(`SELECT COUNT(steamid) AS count FROM users`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0].count);
			}
		});
	},
	getTf2KeysInStock: function(cb) {
		connection.query(`SELECT COUNT(assetid) AS count FROM tf2keys WHERE intrade IS NULL`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0].count)
			}
		});
	},
	getVgoKeysInStock: function(cb) {
		connection.query(`SELECT COUNT(assetid) AS count FROM vgokeys WHERE intrade IS NULL`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0].count);
			}
		});
	},
	getUserBySteamId: function(steamid, cb) {
		connection.query(`SELECT * FROM users WHERE steamid = ?`, [steamid], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0]);
			}
		});
	},
	updateUserdata: function(steamid, personaname, avatar, cb) {
		connection.query(`UPDATE users SET avatar = ?, personaname = ? WHERE steamid = ?`, [avatar, personaname, steamid], (err, result) => {
			if (err) {
				console.error(err);
			} else {
				cb(null, result)
			}
		});
	},
	addNewUser: function(steamid, personaname, avatar, time, cb) {
		connection.query(`INSERT INTO users (steamid, personaname, avatar, datejoined) VALUES (?, ?, ?, ?)`, [steamid, personaname, avatar, time], err => {
			if (err) {
				cb(err);
			} else {
				connection.query(`INSERT INTO balance (steamid, balance) VALUES (?, ?)`, [steamid, 0.00], err => {
					if (err) {
						cb(err);
					} else {
						cb(null);
					}
				});
			}
		});
	},
	getChatMessages: function(cb) {
		connection.query(`SELECT * FROM chat LEFT JOIN users ON chat.steamid = users.steamid ORDER BY time DESC LIMIT 30`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result.reverse());
			}
		});
	},
	addChatMsg: function(steamid, msg, time, cb) {
		connection.query(`INSERT INTO chat (steamid, msg, time) VALUES (?, ?, ?)`, [steamid, msg, time], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	getTransactionHistoryBySteamId: function(steamid, cb) {
		connection.query(`SELECT * FROM (
		SELECT total, tradeid AS id, date, 'VGO' AS game, 'Buy' AS type FROM vgobuyhistory WHERE steamid = ?
		UNION ALL
		SELECT total, tradeid AS id, date, 'VGO' AS game, 'Sell' AS type FROM vgosellhistory WHERE steamid = ?
		UNION ALL
		SELECT total, tradeid AS id, date, 'TF2' AS game, 'Buy' AS type FROM tf2buyhistory WHERE steamid = ?
		UNION ALL
		SELECT total, tradeid AS id, date, 'TF2' AS game, 'Sell' AS type FROM tf2sellhistory WHERE steamid = ?
		UNION ALL
		SELECT amount AS total, transferid AS id, date, 'OPSkins' AS game, 'Buy' AS type FROM opskinswithdrawals WHERE steamid = ?
		) AS f ORDER BY date DESC`, [steamid, steamid, steamid, steamid, steamid], (err, result) => {
			if (err) {
				cb(err);
			} else {
				result.forEach(function(transaction) {
					transaction.total = transaction.total.toFixed(2);
					transaction.date = transaction.date.slice(0, 10);
				});
				cb(null, result);
			}
		});
	},
	updateCustomSteamId: function(steamid, custom, cb) {
		connection.query(`UPDATE users SET customsteamid = ? WHERE steamid = ?`, [custom, steamid], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	updateSteamTradeUrl: function(steamid, url, cb) {
		connection.query(`UPDATE users SET tradeurl = ? WHERE steamid = ?`, [url, steamid], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	createTf2OpenOffer: function(steamid, tradeid, keyamount, total, type, date, custom, cb) {
		connection.query(`INSERT INTO opentf2 (steamid, tradeid, keyamount, total, type, date, custom) VALUES (?, ?, ?, ?, ?, ?, ?)`, [steamid, tradeid, keyamount, total, type, date, custom], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	getOpenTf2Offers: function(cb) {
		connection.query(`SELECT * FROM opentf2`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result);
			}
		});
	},
	getOpenVgoOffers: function(cb) {
		connection.query(`SELECT * FROM openvgo`, (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result);
			}
		});
	},
	deleteOpenTf2Offer: function(id, cb) {
		connection.query(`DELETE FROM opentf2 WHERE tradeid = ?`, [id], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result);
			}
		});
	},
	addTf2OfferHistory: function(steamid, tradeid, keyamount, total, date, type, custom, cb) {
		connection.query(`INSERT INTO tf2${type.toLowerCase()}history (steamid, tradeid, keyamount, total, date, custom) VALUES (?, ?, ?, ?, ?, ?)`, [steamid, tradeid, keyamount, total, date, custom], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	updateBalanceBySteamId: function(steamid, amount, cb) {
		connection.query(`UPDATE balance SET balance = balance + ? WHERE steamid = ?`, [amount, steamid], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	createVgoOpenOffer: function(steamid, tradeid, keyamount, total, type, date, custom, cb) {
		connection.query(`INSERT INTO openvgo (steamid, tradeid, keyamount, total, type, date, custom) VALUES (?, ?, ?, ?, ?, ?, ?)`, [steamid, tradeid, keyamount, total, type, date, custom], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	deleteOpenVgoOffer: function(id, cb) {
		connection.query(`DELETE FROM openvgo WHERE tradeid = ?`, [id], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result);
			}
		});
	},
	addVgoOfferHistory: function(steamid, tradeid, keyamount, total, date, type, custom, cb) {
		connection.query(`INSERT INTO vgo${type.toLowerCase()}history (steamid, tradeid, keyamount, total, date, custom) VALUES (?, ?, ?, ?, ?, ?)`, [steamid, tradeid, keyamount, total, date, custom], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	insertVgoKey: function(id, cb) {
		connection.query(`INSERT INTO vgokeys (assetid) VALUES (?) ON DUPLICATE KEY UPDATE assetid = ?`, [id, id], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	insertTf2Key: function(id, cb) {
		connection.query(`INSERT INTO tf2keys (assetid) VALUES (?) ON DUPLICATE KEY UPDATE assetid = ?`, [id, id], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	getTf2KeysForTrade: function(limit, cb) {
		connection.query(`SELECT * FROM tf2keys WHERE intrade IS NULL LIMIT ?`, [limit], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result);
			}
		});
	},
	addTf2InTrade: function(assetid, cb) {
		connection.query(`UPDATE tf2keys SET intrade = ? WHERE assetid = ?`, ['Yes', assetid], err => {
			if (err) {
				cb(err);
			}
			else {
				cb(null);
			}
		});
	},
	getVgoKeysForTrade: function(limit, cb) {
		connection.query(`SELECT * FROM vgokeys WHERE intrade IS NULL LIMIT ?`, [limit], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result);
			}
		});
	},
	addVgoInTrade: function(assetid, cb) {
		connection.query(`UPDATE vgokeys SET intrade = ? WHERE assetid = ?`, ['Yes', assetid], err => {
			if (err) {
				cb(err);
			}
			else {
				cb(null);
			}
		});
	},
	revertTf2InTrade: function(assetid, cb) {
		connection.query(`UPDATE tf2keys SET intrade = ? WHERE assetid = ?`, [null, assetid], err => {
			if (err) {
				cb(err);
			}
			else {
				cb(null);
			}
		});
	},
	revertVgoInTrade: function(assetid, cb) {
		connection.query(`UPDATE vgokeys SET intrade = ? WHERE assetid = ?`, [null, assetid], err => {
			if (err) {
				cb(err);
			}
			else {
				cb(null);
			}
		});
	},
	deleteTf2Key: function(assetid, cb) {
		connection.query(`DELETE FROM tf2keys WHERE assetid = ?`, [assetid], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	deleteVgoKey: function(assetid, cb) {
		connection.query(`DELETE FROM vgokeys WHERE assetid = ?`, [assetid], err => {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		});
	},
	getVgoOfferById: function(id, cb) {
		connection.query(`SELECT * FROM openvgo WHERE tradeid = ?`, [id], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0]);
			}
		});
	},
	getTf2OfferById: function(id, cb) {
		connection.query(`SELECT * FROM opentf2 WHERE tradeid = ?`, [id], (err, result) => {
			if (err) {
				cb(err);
			} else {
				cb(null, result[0]);
			}
		});
	},
  insertOpskinsWithdrawal: function(steamid, transferid, amount, custom, date, cb) {
    connection.query(`INSERT INTO opskinswithdrawals (steamid, transferid, amount, custom, date) VALUES (?, ?, ?, ?, ?)`, [steamid, transferid, amount, custom, date], (err, result) => {
      if (err) {
        cb(err);
      } else {
        cb(null);
      }
    });
  }
}