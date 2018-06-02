//import google, google authorization, and the authorization schema

//used for making calls to google apps script [http://google.github.io/google-api-nodejs-client/]
const google = require('googleapis');
//used for obtaining authorization to eventually execute the google apps script [https://github.com/google/google-auth-library-nodejs]
const googleAuth = require('google-auth-library');

//require the authorization document which contains the Authorization Model
const databaseAuthorizationSctructure = require('./models/Authorization');
//create an object to store the Authorization model
const Authorization = databaseAuthorizationSctructure.authDocument;
//prefix used to start discord commands with the bot
const targetPrefix = ".";
//googleapis scopes required to be authorized by a user for the bot to make google apps script calls
const SCOPES = ['https://www.googleapis.com/auth/documents','https://www.googleapis.com/auth/script.projects', 'https://www.googleapis.com/auth/script.external_request'];

//function that is ran when the bot is started
const ready = function(Client){
  //set the bot's username to AutoJournal on discord
  Client.user.setUsername("AutoJournal");
  Client.user.setPresence({ game: { name: ".help for commands"}});
  //log that the bot has started
	console.log("bot started");
}

//function that is ran when there is an error with  the discord bot
//which is typically caused by the bot disconnecting
const errorHandler = function(error){
  //exit the program
  process.exit(1);
}
//function that is ran whenever a message is sent in a channel the bot is inside
//messaage is a discord.js Message object
const message = function(message){
  //stop processing the message if it has no content
  if(!message) return;
  //stop processing the message if it is from another bot (or this bot)
  if(message.author.bot) return;
  //obtain the message text
  let data = message.content;
  //get the prefix (should be a !)
  let prefix = data[0];
  /*
  get the command, which is the rest of the text in the first word of the message after the prefix
  data.split(' ') creates an array of words, and [] gets the first word
  slice(1) extracts everything except the first character, and toLowerCase converts to everything ot lowercase
  */
  let command = data.split(' ')[0].slice(1).toLowerCase();
  /*
  splits the contents of the message again, and extact everything using
  slice(1) except the first word which contains the command, then join the array back into a string
  */
  let text = data.split(' ').slice(1).join(' ');
  //pass the "parsed" message to the handle function
  handle(prefix,command,text,message);
}
//prefix is a single character string containing the prefix used in the message
//command is a string containing the command used in the message
//text is the text of the message excluding the command
//message passes the Message object used by the message function
function handle(prefix,command,text,message){
  //exit the function if the prefix is incorrect
  if(prefix !== targetPrefix) return;
    //execute help response if the user typed the help command
    if(command === "help"){
      let information =
      `
      **Commands:**
      **${targetPrefix}setup**
      \`description:\` creates or updates ids and secrets for your google documents

      \`usage\` ${targetPrefix}setup secret: <json> scriptid: <string> document: <string>

      \`other\` your secret can be obtained via [https://console.cloud.google.com/apis] while secret and document can be found through google documents.

      **${targetPrefix}getvalidationlink**
      \`description\` returns a link to authorize bot for your google document, ${targetPrefix}setup must be ran first

      \`other\`
      when logging in to allow permission, there may be a warning screen saying the project is not verified, click advanced and continue
      also make sure to be logged into the account which owns or has sufficient permissions for the document

      **${targetPrefix}verifyCode**
      \`description\` expects code received from ${targetPrefix}getValidationLink

      \`usage\` ${targetPrefix}verifyCode <string>

      \`other\` the code is located in the url of the redirect page, make sure to include the # at the end of the code

      **${targetPrefix}append**
      \`description:\` simply appends text to your document, useful for testing

      \`usage\` ${targetPrefix}append <string>

      \`exampl\` ${targetPrefix}append My First Log!

      **${targetPrefix}createFormat:**
      \`description\` prepares journal for daily entries

      \`usage\` ${targetPrefix}createFormat <string> (optional)
        format will be appended to document unless the string "at location" is present which will tell
        the bot to look for a header1 named START JOURNAL in the document and create the format at its location

      \`example\` ${targetPrefix}createFormat at location

      **${targetPrefix}newentry:**
      \`description\` creates a new entry format in the journal.

      \`usage\` ${targetPrefix}newentry <string> (optional)
        if a string is not provided, an entry for today's date will be created
      \`example\` ${targetPrefix}newentry 5/30/2018

      **${targetPrefix}update**
      \`usage\` ${targetPrefix}update-<category>-<section>-<date> (date is optional) <string>

      \`description\` adds to an entry's category in the given section. Default date is today.

      \`other\` date should be formatted in month/day/fullyear (ie 2018 not 18)

      \`example\` ${targetPrefix}update-brainstorming-tasks-6/1/2018 discussed new community involvement plans.

      **${targetPrefix}insertimage**
      \`description\` adds and resizes an image from discord to the image table of any day's meeting.

      \`usage\` ${targetPrefix}insertimage-<location>-<date> <description>

      \`other\`
       where location is equal to "attached" or "above".
       Attached will look for a message that was created as a description for a submitted image, above will look for the most recent image in the chat up to 10 messages

      \`example\` ${targetPrefix}insertimage-above-6/5/2018 A cute picture of a cat
      `;
      //send the contents of the help command
      //code: "html" will box/format the message as if it were html code, makes it look nicer
      //the split option will cause the bot to send multiple messages instead of causing an error if information exceeds the character limit
      message.channel.send(information, {split: true});
    }
    //respond to a setup command by saving the provided secret and document/script ids
    if(command === "setup"){
      /*command format
      secret: (a JSON in string format)
      sriptid: (A STRING)
      document: (A STRING)
      */
      if(text == "") return;
      //obtain the secret portion of the message by extracting all text in between the words secret: and scriptid:
      let secret = text.slice(text.indexOf("secret:") + 7, text.indexOf("scriptid:"));
      //try to parse the provided secret
      try{
        secret = JSON.parse(secret)["web"];
      }
      //catch if the user provides an invalid json which fails to parse and reply telling them their mistake
      catch(e){
        return sendMessage(message.channel,"check JSON format");
      }
      //obtain the script id which is the section of text in between the scriptid: and document:
      let scriptid = text.slice(text.indexOf("scriptid:") + 9,text.indexOf("document:")).replace(/\s+/g, '');
      //obtain the document id which is the section of text after document:
      let docid = text.slice(text.indexOf("document:") + 9).replace(/\s+/g, '');
      //json used to query the database which contains the server id
      let query = {server: message.channel.guild.id};
      //json to update or create a document of the Authorization model
      let update = {server: message.channel.guild.id, script: scriptid, doc: docid, secret: secret};
      //additional options to be used with findOneAndUpdate,
      //upsert will create the document if it does not exist, runValidators will validify the supplied update with the model's schema and through an error if it is invalid
      let options = {upsert: true, runValidators: true};
      Authorization.findOneAndUpdate(query,update,options,function (error){
        //handle an error if necessary, otherwise notify the user of that their command worked
        if(error){
          return sendMessage(message.channel, "error creating/updating check secet/documentid/scriptid");
        }else{
          sendMessage(message.channel,`authorization saved or updated, run ${targetPrefix}getValidationLink to proceed or ${targetPrefix}help for more commands`);
        }
      });

    }
    //get a link that will direct the user to validate their account
    if(command === "getvalidationlink"){
      //find the authorization document for the server
      Authorization.findOne({server: message.channel.guild.id},function(error, authDocument){
        //if there's an error finding the document notify the user and finish executing the function
        if(error) return sendMessage(message.channel,"could not find a token with the server id");
        //call the authorizeUrl function, passing the autDocument and a callback function to execute when done
        authorizeUrl(authDocument, function(authUrl,authError){
          //if there's an error obtaining the authUrl notify the user
          if(authError) return sendMessage(message.channel,"error obtaining url");
          //if succesful, send the url and further directions
          sendMessage(message.channel,`Authorize url by visiting ${authUrl} run the command ${targetPrefix}verifyCode afterwards with the code from the redirect url after authentication`);
        });
      });
    }
    //
    if(command === "verifycode"){
      //find the authorization document for the server
      Authorization.findOne({server: message.channel.guild.id}, function(error, authDocument){
        //handle an error obtaining the authorziation document
        if(error) return sendMessage(message.channel,"could not find a token with the server id");
        //call getOauth by passing authDocument, which calls a callback function and supplies the oauth2Client object
        getOauth(authDocument, function(oauth2Client,authError){
          //check for and handle an error obtaining the oauth2Client object
          if(authError) return sendMessage(message.channel, "error obtaining oauth2Client object");
          //"rename" message text for local scope ot code for readability
          let code = text;
          //use the getToken function provided by the google auth library which generates an authorization token from a code supplied by verification
          oauth2Client.getToken(code, function(error,token) {
            //handle an error
            if(error){
              return sendMessage(message.channel,"error getting token with supplied code");
            }else{
              //add the token to the authorizationDocument, and save
              authDocument.token = token;
              authDocument.save(function(error){
                //notify the user of the outcome of the save
                if(error) return sendMessage(message.channel,"error saving generated token");
                sendMessage(message.channel,"token received and saved");
              });
            }
          });
        });
      });
    }
    //a command that simply appends to a document, which is useful for testing directly after commpleting the authorization process
    if(command === "append"){
      //return if no text is supplied to append
      if(text == "") return;
      //find the document associated with the server
      Authorization.findOne({server: message.channel.guild.id}, function(error, authDocument){
        //hand and send a message if there's an error
        if(error) return sendMessage(message.channel,"server not setup with id");
        //get a fully authorized oauth2Client object so a call to google apps script can be made
        authorize(authDocument, function(oauth2Client,authError){
          //handle an error and notify the user
          if(authError){
            sendMessage(message.channel,"error try to revalidate client secret or setup a new one");
          }else{
            //use the callScript function, passing the oauth2Client object, the script id, a reference to the channel (to send a message if necessary), the command,
            //and parameters for to send to google apps script which is the document id and the text to append
            callScript(oauth2Client,authDocument.script,message.channel,"append",[authDocument.doc,text]);
          }
        });
      });
    }
    //used for formatting the journal for adding daily entries
    if(command === "createformat"){
      //if the text "at location" is supplied in the command, apps script will be called with setLocation true otherwise it will be false
      //this will cause google apps script to look for the text "START JOURNAL" as a header1 somewhere in the document
      let setLocation = false;
      if(text.toLowerCase() == "at location"){
        setLocation = true;
      }
      //find the authorization document
      Authorization.findOne({server: message.channel.guild.id}, function(error, authDocument){
        //handle an error
        if(error) return sendMessage(message.channel,"server not setup with id");
        //obtain an oauth2Client for the authorization document
        authorize(authDocument, function(oauth2Client,authError){
          //handle an error if there's one obtaining the oauth2Client
          if(authError){
            sendMessage(message.channel,"error try to revalidate client secret or setup a new one");
          }else{
            //callappscript supplying standard parameters such as oauth2Client, the script id, and the channel, as well as
            //specifying the createentryformat and the parameters of the document id and setLocation

            callScript(oauth2Client,authDocument.script,message.channel,"createentryformat",[authDocument.doc,setLocation.toString()]);
          }
        });
      });
    }
    //create a new entry in the journal
    if(command === "newentry"){
      //obtain the date to create an entry
      //if no date is supplied, create a day object for today, otherwise create a day object for the supplied day
      let date = null;
      if(text){
        date = new Date(text);
      }else{
        date = new Date();
      }
      date = shortenDate(date.toString());
      //Get the document for the server
      Authorization.findOne({server: message.channel.guild.id}, function(error, authDocument){
        //handle an error
        if(error) return sendMessage(message.channel,"server not setup with id");
        //obtain the a complete oauth2Client object
        authorize(authDocument, function(oauth2Client,authError){
          //handle an error
          if(authError){
            sendMessage(message.channel,"error try to revalidate client secret or setup a new one");
          }else{
            //call the callScript function, supplying standard paramaters, the "newentry command", and sending the document id, date in string form
            callScript(oauth2Client,authDocument.script,message.channel,"newentry",[authDocument.doc,date]);
          }
        });
      });
    }
    //used for updating a day that already has a template
    if(command.startsWith("update")){
      //return if there's no text
      if(!text) return;
      //command format !update-<area>-<section>-<date> <string>
      //creates an array containing the three parts of the command, and assign them to an individual variables
      let divided = command.split('-');
      let category = divided[1];
      let section = divided[2];
      let day = divided[3];
      //process date, create a date object for the supplied date, otherwise create one for today which is the default for Date.now() if no parameters are passed
      let date = null;
      if(day){
        date = new Date(day);
      }else{
        date = new Date();
      }
      date = shortenDate(date.toString());
      //template row categories
      let categories = ["brainstorming","design","building","management"];
      //template column sections
      let sections = ["tasks","reflection"];
      //test for valid command format, because an entry can be any combination of a single element of categories and a single section, as well as two other tested cases
      //these cases are update-summary-members and update-summary-general
      //which are in the first table instead of the second table so they can not follow the same categories/section format
      //indexOf is used to test if an array contains the supplied category, as indexOf will return -1 if the value is not found in the list
      if((categories.indexOf(category) >= 0 && section.indexOf(section) >= 0)
        || command.startsWith("update-summary-members")  || command.startsWith("update-summary-general")){
          //proceed to find authorization for the server if category and section are valid
          Authorization.findOne({server: message.channel.guild.id}, function(error, authDocument){
            //handle an error finding the document
            if(error) return sendMessage(message.channel,"server not setup with id");
            //obtain an oauth2Client object
            authorize(authDocument, function(oauth2Client,authError){
              //handle an error
              if(authError){
                sendMessage(message.channel,"error try to revalidate client secret or setup a new one");
              }else{
                //call google apps script with standard parameters, and information on the document id, date, category, section, and text to append to the correct section
                callScript(oauth2Client,authDocument.script,message.channel,"addinformation",[authDocument.doc,date,category,section,text]);
              }
            });
          });
      }
    }
    if(command.startsWith("insertimage")){
     async function process(){
      let divided = command.split('-');
      let form = divided[1].toLowerCase();
      let day = divided[2];
      let date = null;
      if(day){
        date = new Date(day);
      }else{
        date = new Date();
      }
      date = shortenDate(date.toDateString());
      let url = null;
      if(form === "attached"){
        try{
          url = message.attachments.values().next().value.proxyURL;
        }catch (e){
          return sendMessage(message.channel, "invalid image attachment");
        }
      }else if(form === "above"){
        let messages = await message.channel.fetchMessages({limit: 10})
        .then((messages) => {return messages})
        .catch(()=>{sendMessage(message.channel,"error fetching messages")});
        let found = false;
        for(let [id, message] of messages){
          if(!found){
            try{
              url = message.attachments.values().next().value.proxyURL;
              if(url != null) found = true;
              }catch(e){
                url = null;
                found = false;
              }
          }
        }
        if(!found){
          return sendMessage(message.channel, "attachment not found in recent chat");
        }
      }else{
        return sendMessage(message.channel, "invalid command form");
      }
      Authorization.findOne({server: message.channel.guild.id}, function(error, authDocument){
        //handle an error finding the document
        if(error) return sendMessage(message.channel,"server not setup with id");
        //obtain an oauth2Client object
        authorize(authDocument, function(oauth2Client,authError){
          //handle an error
          if(authError){
            sendMessage(message.channel,"error try to revalidate client secret or setup a new one");
          }else{
            //call google apps script
            callScript(oauth2Client,authDocument.script,message.channel,"insertphoto",[authDocument.doc,date,url,text]);
          }
        });
      });
    }
    process();
  }
 }
 //function used to sendMessages, makes sure valid text is printed
 //sending empty text may cause an error with discord.sj
 //channel is a discord.js Channel object while text is a string
function sendMessage(channel,text){
  if(!text) return;
  if(text.length > 0){
    channel.send(text);
  }
}
//getOauth generates a supplies an oauth2Client object to a callback function
//the contents of this function, excluding the try/catch logic is based off...
//the authorize funciton in step 3 of the nodejs quickstart for google apps script api [https://developers.google.com/apps-script/api/quickstart/nodejs]
/*parameters:
Auth: an Authorization document
callback: a callback function
*/
function getOauth (Auth,callback){
  let clientSecret = Auth.secret.client_secret;
  let clientId = Auth.secret.client_id;
  let redirectUrl = "https://www.google.com/";
  let gAuth = new googleAuth();
  let oauth2Client = "";
  try{
    oauth2Client = new gAuth.OAuth2(clientId, clientSecret, redirectUrl);
  }catch (e){
    return callback(null, new Error("failed to create oauth object"));
  }
  callback(oauth2Client);
}
//used for generating an authorization url from an Authorization document
/*parameters:
Auth: an Authorization document
callback: a callback function
*/
function authorizeUrl(Auth, callback){
  //call getOauth to get an oauth2Client object from Auth (an Authorization document object)
  getOauth(Auth, function(oauth2Client,error){
    //if there's an error, pass it to the callback function
    if(error){
      callback(null, error);
    }else{
      //get a json to store the options for creating the url
      let options = {
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES
      };
      //try to generate a url with the options
      try {
        let authUrl = oauth2Client.generateAuthUrl(options);
        //if succesful run the callback function with the generated url
        callback(authUrl);
      }catch(e){
        //otherwiese, supply an error to the callback function
        callback(null, e);
      }
    }
  });
}
//used for obtaining a fuly auhtorized oauth2Client Object,
//which is one that contains an Authorization token which is necessary for executing...
//a google apps script call
/*parameters:
Auth: an Authorization document
callback: a callback function
*/
function authorize(Auth, callback){
  //use getOauth to obtain an oauth2Client object using the Auth document
  getOauth(Auth, function(oauth2Client, error){
    //if there was an error in getOauth, pass it to the callback
    if(error){
      callback(null,error);
    }else if(Auth.token){
      //if there's a token, set the oauth2Client's credentials to be equal to the token
      oauth2Client.credentials = Auth.token;
      //and supply it to the callback function
      callback(oauth2Client);
    }else{
      //if there's not a token, send an error to the callback function
      callback(null, new Error("Token not yet defined"));
    }
  });
}
//the syntax for this function is an extension of the nodejs quickstart callAppsScript function [https://developers.google.com/apps-script/api/quickstart/nodejs]
//auth is an oauth2Client object which was obtained by the authorize function
//scriptId is a string containing the id of the google apps script script saved for a particular server
//command is a string containing the command which coressponds to a GAS function
//parameters is an array of parameters to be used in the command function
function callScript(auth, scriptId, channel, command, parameters){
	let script = google.script('v1');
  //create an object for the settings, containing the auth, function, and parameters
  let settings = {
    auth: auth,
    resource: {
      function: command,
      parameters: [parameters]
    },
    scriptId: scriptId
  };
  //make a call to the google api to execute a google apps script function
  script.scripts.run(settings, function(error, res){
    //error connecting to google apps script before the script is executed
    if(error){
      return sendMessage(channel, "error connecting to apps script" + error);
    }else if(res.error){
      //an error "inside" google apps script code
      return sendMessage(channel, "error while executing apps script " + res.error.message);
    }else{
      //if succesful, send a message with the text returned by the function (res.response.result)
      sendMessage(channel, res.response.result);
    }
  });
}
function shortenDate(date){
  let array = date.split(' ');
  let short = [];
  for(let i = 0; i < 4; i++){
    short.push(array[i]);
  }
  short = short.join(' ');
  return short;
}

//export functions to be used in bot.js on events
module.exports.ready = ready;
module.exports.error = errorHandler;
module.exports.message =  message;
