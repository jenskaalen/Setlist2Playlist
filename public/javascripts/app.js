angular.module('setlister', ['ngCookies']);

var app = angular.module('setlister');
 

app.controller('mainController', function($scope, $cookies, $http, spotify, setlistfm){
    $scope.artistInput = "billy talent";
    $scope.foundSongs = [];
   
    spotify.getPlaylists().success(function(playlists){
       $scope.playlists = playlists.items; 
    });
    
    spotify.getProfile().success(function(profile){
       $scope.profile = profile; 
       console.log('fafa');
    });
    
   function addSong(song, artist){
        spotify.searchTrack(artist + " " + song).then(function(data){
           var foundSong = data.data.tracks.items[0].name;
            $scope.foundSongs.push(foundSong);
        });
   } 
   
   function findSongsOnSpotify(){
       for (var index = 0; index < $scope.songs.length; index++) {
           var song = $scope.songs[index];
           findSongOnSpotify(song);
       }
   }
   
   function findSongOnSpotify(song){
       spotify.searchTrack($scope.artistInput + " " + song['@name'])
       .success(function(data){
           song.spotifyData = data.tracks.items[0];
       });
   }
    
   $scope.loggedIn = $cookies.get("spotify_access_token") != null;
   $scope.enteredSongs = [];
   
   if ($scope.loggedIn){
       $scope.authKey = $cookies.get("spotify_access_token");
   }
    
   $scope.test = "nanana" ;
   
   $scope.searchSetlist = function(){
       setlistfm.bandSetLists($scope.artistInput)
       .success(function(data){
            $scope.enteredSongsInput = data;
            $scope.artist = JSON.parse(data);
       });
   }
   
   $scope.addSongsToList = function(){
       $scope.songs.forEach(function(song) {
           spotify.addSongToList(song.spotifyData.uri, $scope.selectedList.id, $scope.profile.id);
       }, this);
   }
   
   $scope.searchArtist = function(){
    setlistfm.getArtist($scope.artistInput).success(function(artist){
        $scope.artist = JSON.parse(artist);  
        
        if ($scope.artist.artists['@total'] > 1)
            $scope.artistId = $scope.artist.artists.artist[0]['@mbid'];
        else
            $scope.artistId = $scope.artist.artists.artist['@mbid'];
            
        setlistfm.getSetlist($scope.artistId, 0)
        .success(function(songs){
            
           //doing this madness because poor api being stupid
           if (songs.setlists.setlist.constructor === Array)
            songs.setlists.setlist = songs.setlists.setlist[0];
           if (songs.setlists.setlist.sets.set.constructor === Array)
            songs.setlists.setlist.sets.set = songs.setlists.setlist.sets.set[0];
           
            $scope.songs = songs.setlists.setlist.sets.set.song;
            
            findSongsOnSpotify();    
        });
    });  
   }
   
   $scope.search = function(){
        if (!$scope.enteredSongsInput){
           return;
       }
       
       $scope.foundSongs.length = 0;
       
      var lines = $scope.enteredSongsInput.split('\n');
      
      $scope.enteredSongs.length = 0;
      
      for(var i=0;i<lines.length;i++){
          $scope.enteredSongs.push(lines[i]);
          
          var song = lines[i];
          addSong(song, $scope.artistInput);
      } 
      
    //   if ($scope.enteredSongs.length > 0 && $scope.artistInput){
    //       searchForSong($scope.enteredSongs[0], $scope.artistInput);
    //   }
   }
});


app.factory('spotify', function($cookies, $http){
    var access_token = $cookies.get("spotify_access_token");
    var req = { headers:  { 'Authorization': 'Bearer ' + access_token } };
            
    return {
        searchTrack: function(searchText){
            searchText = encodeURIComponent(searchText);
            
            var searchUri = "https://api.spotify.com/v1/search?q=[query]&type=track&limit:1";
            searchUri = searchUri.replace("[query]", searchText);
            return $http.get(searchUri, req);
        },
            getPlaylists: function(){
            var requestUrl = "https://api.spotify.com/v1/me/playlists"
            
            return $http.get(requestUrl, req);
        },
        addSongToList(songUri, playlist, user){
            var postUri = "https://api.spotify.com/v1/users/[user]/playlists/[playlist]/tracks?uris="+songUri;
            postUri = postUri.replace("[playlist]", playlist);
            postUri = postUri.replace("[user]", user);
            console.log(songUri);
            
            return $http( {
               method: "POST",
               url: postUri, 
               headers:  { 'Authorization': 'Bearer ' + access_token } 
            });
        },
        getProfile: function(){
            return $http.get("https://api.spotify.com/v1/me", req);
        }
    };
})

app.factory('setlistfm', function($cookies, $http){
    return {
        getArtist: function(bandName){
            bandName = encodeURIComponent(bandName);
            return $http.get('/getArtist?artist=' + bandName);
        },
        getSetlist: function(bandId, setIndex){
            return $http.get('/getSetlist', {  params: { id: bandId, index: setIndex}});
        }
    };
})