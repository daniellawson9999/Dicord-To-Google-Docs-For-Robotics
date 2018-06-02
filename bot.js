// all code throughout the project has been created independently
/*
this if statement imports local environment variables if the program is not in production (not deployed to a service like Heroku)
TOKEN: contains discord bot token
MONGO_URL: contains link to mlabs mongodb database
*/
if (process.env.NODE_ENV !== 'production') require('dotenv').load();
//import APIs
//require discord.js [https://discord.js.org/#/] which simplifies interacting with the Discord API [https://discordapp.com/developers/docs/intro]
const Discord = require('discord.js');

//used for manipulating mongodb database (such as by using schemas) [http://mongoosejs.com/]
const mongoose = require('mongoose');

//import event handler functions from seperate file
const event = require('./events.js');

//obtain discord bot token
const token = process.env.TOKEN;

//obtain mongodb url and connect to mlabs database [https://mlab.com/]
mongoose.Promise = global.Promise;
const mongoURL = process.env.MONGO_URL;
mongoose.connect(mongoURL);

//create discord.js client object for the bot
const Client = new Discord.Client();

//the ready event occurs when the bot starts, this sets the event to call a function
//which calls and passes the Client object to the ready function
Client.on("ready", function(){
  event.ready(Client);
});
//set up an event which occurs every time a message is sent in a server with a bot
Client.on("message", event.message);
//error occurs if the bot disconnects for some reason (like loss of internet connection on a local computer hosting the bot)
Client.on("error", event.error)

//finally, login the bot using its token
//found in panel for your bot in https://discordapp.com/developers/applications
Client.login(token);
