var Promise = require('bluebird')
  , oauth = require('oauth')
  , configuration = require('@ftbl/configuration');

var Social = function() {
  if (this instanceof Social === false) return new Social;

  this.id = configuration('twitter:id');
  this.secret = configuration('twitter:secret');

  this.baseUrl = 'https://api.twitter.com/1.1';

  this.client = new oauth.OAuth(
    'https://twitter.com/oauth/request_token'
  , 'https://twitter.com/oauth/access_token'
  , this.id
  , this.secret
  , '1.0A'
  , null
  , 'HMAC-SHA1');
};

var call = function(path, token, secret) {
  return new Promise(function(resolve, reject) {
    this.client.get(this.url(path), token, secret, function(err, data, response) {
      if (err) return reject(err);
      try { data = JSON.parse(data); }
      catch(e) { reject(e) }
      return resolve(data);
    });

  }.bind(this));
};

Social.prototype.url = function(url) {
  return this.baseUrl + url;
};

Social.prototype.verify = function(token, secret) {
  return call.call(this, '/account/verify_credentials.json', token, secret);
};

module.exports = new Social;