/**
* Created by Erik Woitschig
* http://www.bnz-power.com
*/

(function(){

var Controllers = angular.module('Controllers', []);

// project defaults
Controllers.value('project', {
  title: 'BNZ-Sampler',
});

Controllers.controller('HomeCtrl', ['$scope', '$routeParams', '$location', 'project',
function($scope, $routeParams, $location, project) {

  var audioContext;
  //	var RecNode;
  //	var recorder;

  $scope.sampleset = null;
  $scope.samplesetCss = "fa fa-circle sample off";
  $scope.sampleSelected = null;

  $scope.samplepacks = [
        {     id    :   1,
              url   : "https://soundcloud.com/loopmasters/sets/download-free-classic-synth",
              name  : "Classic Synth"
        },
        {     id    :   2,
              url   : "https://soundcloud.com/loopmasters/sets/mad-professor-reel-to-reel-reggae-vol2",
              name  : "Reggae"
        },
        {     id    :   3,
              url   : "https://soundcloud.com/loopmasters/sets/download-free-bass-house",
              name  : "Bass House"
        }
        ];

SC.initialize({
  client_id: "17a992358db64d99e492326797fff3e8",
});

$(function() {
//    $('#scpatch').on('change', function(){
//    SCkickOffSampleDownload(this.value);
//  });

  $( "#midiIn" ).on('change', function(e) {
    var optionSelected = $("option:selected", this);
    var valueSelected = this.value;
    activateDevice(valueSelected);
  });

  //$('#scloopmasters').on('change', function(){
  //  DLSamplePack(this.value);
  //});
});

$scope.updateSamples = function(){
  SC.get('/resolve', { url: $scope.sampleset }, function(tracks) {
    $scope.results = tracks.tracks;
  });
}

$scope.loadSample = function(){
  SCkickOffSampleDownload($scope.sampleSelected);
}

}
]);

})();
