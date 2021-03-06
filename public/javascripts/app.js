angular.module('setlister', ['ngCookies']);

var app = angular.module('setlister');
 

app.controller('mainController', function($scope, $cookies, $http, spotify, setlistfm){
    $scope.artistInput = null;
    $scope.foundSongs = [];
    $scope.artists = [];
    $scope.setlists = [];
    $scope.readyToAddSongs = true;
    $scope.artist = null;
    $scope.setlistIndex = 0;
    $scope.artistIndex = 0;
    $scope.searching = false;
   $scope.spotifyAuthed = $cookies.get("spotify_access_token") && $cookies.get("spotify_access_token") != null? true : false;
   $scope.enteredSongs = [];
    
    function findSongOnSpotify(song) {
        var indexOfSong = $scope.setlist.songs.indexOf(song);
        
        spotify.searchTrack($scope.artist.name + " " + song.name).then(function (spotifySong) {
            song.spotifyData = spotifySong;
            
            if (indexOfSong === ($scope.songs.length - 1)) {
                $scope.readyToAddSongs = true;
                return;
            }
            
            findSongOnSpotify($scope.setlist.songs[indexOfSong + 1]);
        });
    }
    
    function findSongsOnSpotify() {
        if ($scope.setlist.songs.length <= 0){
            return;
        }
        
        var song = $scope.setlist.songs[0];
        findSongOnSpotify(song);
    }

    $scope.$watch('artistIndex', function(){
        if ($scope.artists && $scope.artists.length > 0) {
            $scope.artist = $scope.artists[$scope.artistIndex]; 
            $scope.loadArtistSetlists();
        }
    });
    
   function addSongToSpotifyList(song){
        var indexOfSong = $scope.songs.indexOf(song);
        
        if (!song.spotifyData || !song.spotifyData.uri) {
            addSongToSpotifyList($scope.songs[indexOfSong + 1]);
        }

       spotify.addSongToList(song.spotifyData.uri, $scope.selectedList.id, $scope.profile.id).success(function() {
            song.addedToList = true;

            if (indexOfSong === ($scope.songs.length - 1)) {
                return;
            }

            addSongToSpotifyList($scope.songs[indexOfSong + 1]);
       });
   }
    
    $scope.addSongsToList = function () {
        $scope.readyToAddSongs = false;
        var song = $scope.songs[0];
        addSongToSpotifyList(song);
    }
    
    function initSpotify(){
        spotify.getPlaylists().success(function(playlists){
        $scope.playlists = playlists.items; 
        });
        
        spotify.getProfile().success(function(profile){
        $scope.profile = profile;
        });
    }
   
   if ($scope.spotifyAuthed){
       $scope.authKey = $cookies.get("spotify_access_token");
       initSpotify();
   
   } else if ($cookies.get("spotify_refresh_token") ? true : false){
        spotify.refreshToken().then(function(){
            $scope.spotifyAuthed = $cookies.get("spotify_access_token") ? true : false;
            initSpotify();
        });
   }
   
    $scope.updateSetlistForArtist = function(){
        if ($scope.setlists && $scope.setlists.length > 0) {
            $scope.setlist = $scope.setlists[$scope.setlistIndex];
            $scope.songs = $scope.setlist.songs;
            
            if ($scope.setlist.songs.length > 0 && $scope.spotifyAuthed){
                findSongsOnSpotify();
            }
        }
    }
    
   $scope.loadArtistSetlists = function(){
       $scope.searching = true;
       setlistfm.getSetlist($scope.artist.setlistfmId,0)
        .success(function (setlists) {
            $scope.setlists = setlists;
            $scope.setlist = setlists[0];
            
            if ($scope.setlistIndex == 0){
                $scope.updateSetlistForArtist();  
            }
            
                //updateSetlistForArtist();  
            $scope.setlistIndex = 0;
            $scope.searching = false;
       });
    }
    
    $scope.$watch('setlistIndex', function () {
        $scope.updateSetlistForArtist();
    });
    
   $scope.searchArtist = function(){
       if ($scope.artistInput == $scope.lastSearch)
        return;
       
       $scope.lastSearch = $scope.artistInput;
    
        setlistfm.getArtists($scope.artistInput).success(function (artists) {
            $scope.artistIndex = 0;
            $scope.artists = artists;
            $scope.artist = artists[0];
            $scope.artistId = $scope.artist.setlistfmId;
            $scope.loadArtistSetlists();
        });  
    }
});

app.factory('spotify', function($cookies, $http) {
    var headers = function() { 
        return { headers: { 'Authorization': 'Bearer ' + $cookies.get("spotify_access_token") } };
    }

    return {
        refreshToken: function(){
            return $http.get('/refreshToken');
        },
        searchTrack: function(searchText) {
            searchText = encodeURIComponent(searchText);

            var searchUri = "https://api.spotify.com/v1/search?q=[query]&type=track&limit:1";
            searchUri = searchUri.replace("[query]", searchText);
            var promise = $http.get(searchUri, headers()).then(function (result) {
                return result.data.tracks.items[0];
            });

            return promise;
        },
        //TODO: delete?
        findTrack: function (searchText) {
            searchText = encodeURIComponent(searchText);
            
            var searchUri = "https://api.spotify.com/v1/search?q=[query]&type=track&limit:1";
            searchUri = searchUri.replace("[query]", searchText);
            $http.get(searchUri, headers()).then(function (data) {
                
            });
        },
        getPlaylists: function() {
            var requestUrl = "https://api.spotify.com/v1/me/playlists";

            return $http.get(requestUrl, headers());
        },
        addSongToList: function(songUri, playlist, user) {
            var postUri = "https://api.spotify.com/v1/users/[user]/playlists/[playlist]/tracks?uris=" + songUri;
            postUri = postUri.replace("[playlist]", playlist);
            postUri = postUri.replace("[user]", user);

            return $http({
                method: "POST",
                url: postUri,
                headers:  { 'Authorization': 'Bearer ' + $cookies.get("spotify_access_token") }
            });
        },
        getProfile: function() {
            return $http.get("https://api.spotify.com/v1/me", headers());
        }
    };
});

app.factory('setlistfm', function($cookies, $http) {
    return {
        getArtist: function(bandName) {
            bandName = encodeURIComponent(bandName);
            return $http.get('/getArtist?artist=' + bandName);
        },
        getArtists: function(bandName) {
            bandName = encodeURIComponent(bandName);
            return $http.get('/searchSetlistfmArtist?artist=' + bandName);
        },
        getSetlist: function(bandId, setIndex) {
            return $http.get('/getSetlist', { params: { id: bandId, index: setIndex } });
        }
    };
});