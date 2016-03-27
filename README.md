#Setlist2Playlist 

Simple webapp that allows you to add songs from an artists setlist to a Spotify playlist.  
http://setlist2playlist.me

## How to set up 
Besides the usual npm install, you need a config.js in the root folder of the project. 
It must contain your spotify app credentials and look like this. 

```javascript
var config = {};
config.spotifyClientId = '1230998123clientIdHere'; // Your client id
config.spotifySecret = '23423423424spotifySecretHere'; // Your client secret
module.exports = config;
```
