
//used for manipulating mongodb database (such as by using schemas) [http://mongoosejs.com/]
const mongoose = require('mongoose');
/*
create schema for the authorization token
this information is converted to json ad set as the credentials
to the oauth2Client object before making a google apps script call
access_token contains the token itself,
token_type contains the type of token, which should be the same,
expiry_date contains when the token will expire
refresh_token allows the contents of the token to be updated without going through user authorization if expired
all fields are required when created a tokenSchema except a refresh_token
*/
const tokenSchema = mongoose.Schema({
  access_token: {type: String, required: true},
  token_type: {type: String, required: true},
  expiry_date: {type: String, required: true},
  refresh_token: String
});

/*
create a schema to store entire secret json
some contents of the secret are used when initializing the OAuth2 Object
used fields for creating the OAuth2 object are required
*/
const secretSchema = mongoose.Schema({
  type: String,
  client_id: {type: String, required: true},
  project_id: String,
  auth_uri: String,
  token_uri: String,
  auth_provider_x509_cert_url: String,
  client_secret: {type: String, required: true},
  redirect_uris: [{type: String, required: true}],
});
/*
create an authorization schema which stores
a nested secret and token documents
the authorization schema is actually modeled,
while the secret and the token schema are nested as
subdocuments which cannot be created independently
server stores the discord server id
doc and script store the document and script ids
*/
const authorizationSchema = mongoose.Schema({
  server: {type: String, required: true},
  script: {type: String, required: true},
  doc: {type: String, required: true},
  token: {type: tokenSchema},
  secret: {type: secretSchema, required: true}
});

//export a model based off authorizationSchema called Authorization
//events.js will use to store and retrieve from the mongodb database
module.exports.authDocument = mongoose.model("Authorization",authorizationSchema);
