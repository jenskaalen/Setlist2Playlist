angular.module('setlister', ['ngCookies']);

var app = angular.module('setlister');

app.controller('main', function($scope, $cookies){
   $scope.loggedIn = $cookies.get("spotify_access_token") != null;
    
   $scope.test = "nanana" ;
});