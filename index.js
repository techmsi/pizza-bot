'use strict';

require('skellington')({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  port: process.env.PORT,
  scopes: ['bot'],
  plugins: [
    require('./plugins/welcome'),
    require('./plugins/order')
  ],
  botkit: {
    interactive_replies: true,
    json_file_store: './db/'
  }
});
// Import express and request modules
var express = require('express');
var request = require('request');
var app = express();
app.listen(3001, function () {
    // Callback triggered when server is successfully listening. Hurray!
  console.log('Example app listening on port ' + 3001);
});
app.post('/command', function (req, res) {
  res.send('Your ngrok tunnel is up and running!');
});
