var express = require('express');
var router = express.Router();
var request = require('request'); // "Request" library
var cookieParser = require('cookie-parser');

var client_id = '16841a7e5a4440148404342c6f804e50'; // Your client id
var client_secret = 'eca955deae774a06a0c0191595b2b28d'; // Your client secret
var redirect_uri = 'http://localhost:3000/setlister'; // Your redirect uri
var stateKey = 'spotify_auth_state';
var cookieParser = require('cookie-parser');
var querystring = require('querystring');

//we store dis
var access_token;

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};


/* GET home page. */
router.get('/', function(req, res, next) {
    console.log(req.body);
    console.log(res.body);
  res.render('index');
});

router.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-follow-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


router.get('/playLists', function(req, res){
    console.log('trying to get cookies from these playlists: ' + req.cookies);
    
    var access_token = req.cookies["spotify_access_token"];
    
    var options = {
        url: 'https://api.spotify.com/v1/me/following?type=artist',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    
    request.get(options, function(error, response, body) {
          res.send(body);
        });
});

router.get('/setlister', function(req, res) {
   console.log(req.cookies);  

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
      console.log('clearing cookie');
    // res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token,
            refresh_token = body.refresh_token;
            
        res.cookie('spotify_access_token', access_token);

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
  
  
});

module.exports = router;
