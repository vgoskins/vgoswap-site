module.exports = {
	admins: ['76561198089553444'],
	rates: {
		tf2SellPrice: 1.50, // Users sell their TF2 keys for this price
		vgoSellPrice: 2.30, // Users sell their VGO keys for this price
		tf2BuyPrice: 1.59, // Users buy the bot's TF2 keys for this price
		vgoBuyPrice: 2.39 // Users buy the bot's VGO keys for this price
	},
	api: {
		opskins: {
			opskinsTradeApiKey: 'BOT API KEY', // The API key of the bot account to be used for trades
			opskinsTradeSecret: 'BOT SECRET', // The secret of the bot account to be used for trades
			opskinsPollInterval: 5,
			opskinsBalanceApiKey: 'OPERATION POINTS TRANSFER ACCOUNT API' // The API key of the account to be used for balance transfers.
		},
		steam: {
			steamApiKey: 'STEAM API KEY', // Your Steam API key
			realm: 'http://localhost:3037', // Name of your site WITH PORT
			returnUrl: 'http://localhost:3037/auth/steam/return' // Return URL WITH PORT
		}
	},
	steamBot: {
		botSharedSecret: 'STEAM BOT SHARED SECRET', // Your Steam bot account's shared secret
		botIdentitySecret: 'STEAM BOT IDENTITY SECRET', // Your Steam bot account's identity secret
		botUsername: 'STEAM BOT USERNAME', // Bot username
		botPassword: 'STEAM BOT PASSWORD', // Bot password
		inGame: 440 // Either an appid, or a string of the game you want to play
	},
	contact: {
		email: 'vgoswap@gain.gg', // Contact email address
		twitterLink: 'https://twitter.com/VGOSwap', // Twitter link
		steamLink: 'https://steamcommunity.com/groups/vgoswap', // Steam group link
		discordLink: 'https://discordapp.com/invite/ZeqvUnD' // Discord invite link
	},
	database: {
		schema: 'vgoswap', // Database schema
		password: 'DATABASE PASSWORD', // Database password
		host: 'localhost', // You don't need to change this
		user: 'root', // You don't need to change this
		port: 3306 // You don't need to change this
	},
	max: {
		vgo: 200, // Max VGO keys per single trade
		tf2: 50 // Max TF2 keys per single trade
	},
	siteName: 'VGOSwap.net', // Displayed in the title and footer of the website 
	port: 3037, // Use port 80 if you're not using reverse proxy.
	tradeTimeout: 1, // Seconds to wait between trade requests,
	tf2OfferRefresh: 15, // Seconds for polling TF2 offers
	vgoOfferRefresh: 15 // Seconds for polling VGO offers
}