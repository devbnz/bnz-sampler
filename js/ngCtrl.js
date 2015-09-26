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
  $scope.midiInputSelected = null;
  $scope.midiOutputSelected = null;
  $scope.deviceInputs = [];
  $scope.deviceOutputs = [];

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

  function midiMessageReceived( ev ) {
    var cmd = ev.data[0] >> 4;
    var channel = ev.data[0] & 0xf;
    var noteNumber = ev.data[1];
    var velocity = ev.data[2];

    if (channel == 9)
      return
    if ( cmd==8 || ((cmd==9)&&(velocity==0)) ) { // with MIDI, note on with velocity zero is the same as note off
      // note off
      noteOff( noteNumber );
    } else if (cmd == 9) {
      // note on
      noteOn( noteNumber, velocity/127.0);
    } else if (cmd == 11) {
      controller( noteNumber, velocity/127.0);
    } else if (cmd == 14) {
      // pitch wheel
      pitchWheel( ((velocity * 128.0 + noteNumber)-8192)/8192.0 );
    }
  }

  var selectMIDI = null;
  var midi = null;
  var midiIn = null;

  function CreateMidiDevice(id,manufacturer,name,version)
  {
   var Device = {};
   Device['id'] = id;
   Device['name'] = name;
   Device['manufacturer'] = manufacturer;
   Device['version'] = version;
   return Device;
  }

  function listInputsAndOutputs( midiAccess ) {
    midi = midiAccess;
    for (var entry of midiAccess.inputs) {
      var input = entry[1];
        var obj = CreateMidiDevice(input.id,input.manufacturer,input.name, input.version);
        $scope.deviceInputs.push(obj);
    }

    for (var entry of midiAccess.outputs) {
      var output = entry[1];
      var obj = CreateMidiDevice(output.id,output.manufacturer,output.name,output.version);
      $scope.deviceOutputs.push(obj);
    }
  }

    function activateDevice(id){
    inputs = midi.inputs.values();
    for ( var input = inputs.next(); input && !input.done; input = inputs.next()) {
      if (id == input.value.id){
        input.value.onmidimessage = midiMessageReceived;
        $('.midiInput').removeClass('off').addClass('on');
      }
      else{
        input.value.onmidimessage = null;
      }
    }
  }

  function onMIDISystemError( err ) {
  //  document.getElementById("synthbox").className = "error";
    console.log( "MIDI not initialized - error encountered:" + err.code );
  }

navigator.requestMIDIAccess().then( listInputsAndOutputs, onMIDISystemError );

$scope.updateMidiInput = function(){
  activateDevice($scope.midiInputSelected);
  }

$scope.updateMidiOutput = function(){
  console.log('not implemented yet');
  }


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
