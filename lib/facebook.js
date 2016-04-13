var Promise = require('bluebird')
  , restify = require('restify')
  , url = require('url')
  , qs = require('qs')
  , configuration = require('@ftbl/configuration');

var VERSION = 'v2.5';

var Social = function() {
  if (this instanceof Social === false) return new Social;

  this.appId = configuration('facebook:id');
  this.secret = configuration('facebook:secret');

  this.client = restify.createStringClient({
    url: 'https://graph.facebook.com'
  });
};

var get = function(path) {
  return new Promise(function(resolve, reject) {
    this.client.get(path, function(err, req, res, data) {
      if (err) return reject(err);
      try { data = JSON.parse(data); }
      catch(e) { data = url.parse('?' + data, true).query }
      return resolve(data);
    });

  }.bind(this));
};

var request = function(path, parameters) {
  return get.call(this, [ path, qs.stringify(parameters) ].join('?'));
};

var paged = function(path, parameters, data) {
  var url = parameters == null ? path : [ path, qs.stringify(parameters) ].join('?');

  if (data == null) data = [];

  return get.call(this, url).then(function(result) {
    if (result.data && result.data.length) {
      data = data.concat(result.data);
      if (result.paging) return paged.call(this, result.paging.next, null, data);
    }

    return data;
  }.bind(this));
};

Social.prototype.accessToken = function(authentication) {
  var path = '/oauth/access_token'
    , parameters = {
        client_id: this.appId
      , client_secret: this.secret
      , code: authentication.authorizationCode
      , redirect_uri: authentication.redirectUri 
      };

  return request.call(this, path, parameters);
};

var constructPath = function() {
  var args = Array.prototype.slice.call(arguments);
  return [ '', VERSION ].concat(args).join('/')
};

Social.prototype.user = function(networkId, accessToken) {
  if (accessToken == null) {
    accessToken = networkId;
    networkId = 'me';
  }

  var path = constructPath(networkId)
    , parameters = {
        access_token: accessToken
      , fields: configuration('facebook:fields').join(',') 
      };

  return request.call(this, path, parameters);
};

Social.prototype.friends = function(networkId, accessToken) {
  if (accessToken == null) {
    accessToken = networkId;
    networkId = 'me';
  }

  var path = constructPath(networkId, 'friends')
    , parameters = {
        fields: 'id'
      , access_token: accessToken 
      };

  return paged.call(this, path, parameters);
};

Social.prototype.feed = function(networkId, accessToken) {
  var path = constructPath(networkId, 'feed')
    , parameters = {
        fields: 'id,description,link,message,picture,source,created_time'
      , access_token: accessToken 
      };

  return request.call(this, path, parameters);
};

module.exports = new Social;