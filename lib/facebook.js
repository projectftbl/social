var Promise = require('bluebird')
  , restify = require('restify')
  , url = require('url')
  , qs = require('qs')
  , configuration = require('@ftbl/configuration');

var Social = function() {
  if (this instanceof Social === false) return new Social;

  this.appId = configuration('facebook:id');
  this.secret = configuration('facebook:secret');

  this.client = restify.createStringClient({
    url: 'https://graph.facebook.com'
  });
};

var call = function(path) {
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
  return call.call(this, [ path, qs.stringify(parameters) ].join('?'));
};

var paged = function(path, parameters, data) {
  var url = parameters == null ? path : [ path, qs.stringify(parameters) ].join('?');

  if (data == null) data = [];

  return call.call(this, url).then(function(result) {
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

Social.prototype.user = function(accessToken) {
  var path = '/v2.0/me'
    , parameters = {
      access_token: accessToken
    , fields: configuration('facebook:fields').join(',') 
    };

  return request.call(this, path, parameters);
};

Social.prototype.friends = function(networkId, accessToken) {
  var path = '/v2.0/me/friends'
    , parameters = {
      fields: 'id'
    , access_token: accessToken 
    };

  return paged.call(this, path, parameters);
};

module.exports = new Social;