var Sampler = angular.module('Sampler', [
'ngRoute',
'Controllers',
]);

Sampler.config(['$routeProvider',
function($routeProvider) {
  $routeProvider.
  when('/home', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  }).
  otherwise({
    redirectTo: '/home'
  });
}]);

Sampler.factory('myGoogleAnalytics', [
  '$rootScope', '$window', '$location',
  function ($rootScope, $window, $location) {

    var myGoogleAnalytics = {};
    var repoLocation = 'bnz-sampler/#';

    $rootScope.appname = 'bnz sampler';

    myGoogleAnalytics.sendPageview = function() {
      if ($window.ga) {
        $window.ga('set', 'page', repoLocation + $location.path());
        $window.ga('send', 'pageview');
      }
    }

    // subscribe to events
    $rootScope.$on('$viewContentLoaded', myGoogleAnalytics.sendPageview);

    return myGoogleAnalytics;
  }
])
Sampler.run(['myGoogleAnalytics',
  function(myGoogleAnalytics) {
      // inject self
  }]);
