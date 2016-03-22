var Promise = require('bluebird')
  , qs = require('qs')
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

Social.prototype.request = function(path, parameters, options) {
  var url = parameters == null ? path : [ path, qs.stringify(parameters) ].join('?');

  return new Promise(function(resolve, reject) {
    this.client.get(this.url(path), options.token, options.secret, function(err, data, response) {
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

Social.prototype.verify = function(options) {
  return this.request('/account/verify_credentials.json', null, options);
};

Social.prototype.timeline = function(id, options) {
  return this.request('/statuses/user_timeline.json', { exclude_replies: true, id: id }, options);
};

Social.prototype.following = function(id, options) {
  return this.request('/friends/ids.json', { id: id }, options);
};

module.exports = new Social;