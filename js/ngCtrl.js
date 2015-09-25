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
/*
  $scope.project = { title: project.title };

  $scope.milestones = [
        {     id    :   1,
              body  : "project started",
              date  : "2015-03-17"
        },
        {     id    :   2,
              body  : "moved to github",
              date  : "2015-09-20"
        }
        ];
*/

var audioContext;
//	var RecNode;
//	var recorder;

SC.initialize({
  client_id: "17a992358db64d99e492326797fff3e8",
});

$(function() {
    $('#scpatch').on('change', function(){
    SCkickOffSampleDownload(this.value);
  });

  $( "#midiIn" ).on('change', function(e) {
    var optionSelected = $("option:selected", this);
    var valueSelected = this.value;
    activateDevice(valueSelected);
  });

  $('#scloopmasters').on('change', function(){
    DLSamplePack(this.value);
  });
});

function DLSamplePack(url){
  $('#scpatch').empty();
  var track_url = url;
  var input = []
  SC.get('/resolve', { url: track_url }, function(tracks) {
    $('.sampleset').removeClass('off').addClass('on');
    $('#loopsetloaded').append('<a href="' + tracks.permalink_url + '" target="blank">Soundcloud Link</a>');
    input = tracks.tracks;
    var output = [];
    for (var i = 0, l = input.length; i < l; i++) {
      var obj = input[i];
      output.push('<option value="'+ obj.stream_url +'">'+ obj.title +'</option>');
    }
    $('#scpatch').html(output.join(''));
  });
}

}
]);

})();
