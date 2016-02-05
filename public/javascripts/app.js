angular.module('setlister', ['ngCookies']);

var app = angular.module('setlister');
 

app.controller('mainController', function($scope, $cookies, $http, spotify){
    $scope.artistInput = "amon amarth";
    $scope.enteredSongsInput = "father of the wolf";
    $scope.foundSongs = [];
    
   function addSong(song, artist){
        spotify.searchTrack(artist + " " + song).then(function(data){
           var foundSong = data.data.tracks.items[0].name;
            $scope.foundSongs.push(foundSong);
        });
   } 
    
   $scope.loggedIn = $cookies.get("spotify_access_token") != null;
   $scope.enteredSongs = [];
   
   if ($scope.loggedIn){
       $scope.authKey = $cookies.get("spotify_access_token");
   }
    
   $scope.test = "nanana" ;
   
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
    return {
        searchTrack: function(searchText){
            searchText = encodeURIComponent(searchText);
            
            var searchUri = "https://api.spotify.com/v1/search?q=[query]&type=track&limit:1";
            searchUri = searchUri.replace("[query]", searchText);
            var access_token = $cookies.get("spotify_access_token");
            var req = { headers:  { 'Authorization': 'Bearer ' + access_token } };
            return $http.get(searchUri, req);
        }
    };
})

app.factory('setlistfm', function($cookies, $http){
    return {
            bandSetLists: function(bandName){
            bandName = encodeURIComponent(bandName);
            
            var bandUriTemplate = "http://api.setlist.fm/rest/0.1/search/artists.json?artistName=[band]"
            var bandQuery = bandUriTemplate.replace("[band]", bandName);
            // 
            // var searchUri = "https://api.spotify.com/v1/search?q=[query]&type=track&limit:1";
            // searchUri = searchUri.replace("[query]", searchText);
            // var access_token = $cookies.get("spotify_access_token");
            // var req = { headers:  { 'Authorization': 'Bearer ' + access_token } };
            // return $http.get(searchUri, req);
        }
    };
})