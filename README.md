# vgoswap-site

vgoswap-site is the source code for the popular key exchange site 'VGOSwap.net'.

### Setup

First, make sure you have node.js installed, which you can do here: https://nodejs.org/

#### Config

```bash
$ open config/config.js
```

All the config stuff is commented nicely, and you shouldn't have too much bother with it. 
I'll run through some important things here: 

##### api.steam
The `returnUrl` value should stay the same if running locally.
Make sure to include the port if it's not 80 or 443.

```js
returnUrl: 'http://localhost/auth/steam/return'
// Becomes
returnUrl: 'http://382.73.93.763:4073/auth/steam/return'
```

You can find your Steam API Key for the `steamApiKey` value here: https://steamcommunity.com/dev/apikey

##### api.opskins
You can find your OPSkins API key on the OPSkins website in your advanced options of your account.

To access the secret, you need to setup 2FA on your account with a program that supports secret exports.

You can find one for Chrome here: https://chrome.google.com/webstore/detail/authenticator/bhghoamapcdpbohphigoooaddinpkbai.

The `opskinsTradeApiKey` and `opskinsTradeSecret` values are used for the account sending the bot trades.

The `opskinsBalanceApiKey` is the account used for sending funds for remaining balance. This should probably be your main, with payments etc. all setup.

##### steamBot
This object is fairly self-explanatory, you can reference this video to get your shared and secret values: https://www.youtube.com/watch?v=wPV5V0BINUw

##### database
I'll explain how to setup the database further down, but you should name the schema `vgoswap`. Make sure the password is your mysql database password. The `host`, `user` and `port` values are fairly standard so don't change them unless you've customised your database settings.

#### Database setup
You need to have a MYSQL database running on your machine. I recommend using MYSQL Workbench also, which you can find here: https://www.mysql.com/products/workbench/

Import the database from the sql folder. Your schema should be named the same thing as you set in config.

#### Run the site
Use CMD/Terminal to go to the site's root directory:
```bash
$ cd /Users/Almatrass/Desktop/vgoswap-site
```
Install modules:
```bash
$ npm i
```

You'll need the `gulp-cli` package, install it globally:
```bash
$ npm i -g gulp-cli
```
Run gulp tasks: (minify css and obfuscate, then minify javascript):
```bash
$ gulp
```

Now you can start the server: 
```bash
$ npm start
```

Or forever with PM2: 
```bash
$ pm2 start ./server/vgoswap-server.js
```

#### Support
Please open an issue here if you would like support. I get too many friend requests for general programming questions, please direct those to stack overflow, and specific questions to issues. Thanks!
