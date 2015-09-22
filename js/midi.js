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
var midiAccess = null;
var midiIn = null;

function onMIDIInit( midi ) {
  midiAccess = midi;
  for (var input of midiAccess.inputs.values()){
    var opt = document.createElement("option");
    opt.text = input.name;
    opt.value = input.id;
    document.getElementById("midiIn").add(opt);
  }

  for (var input of midiAccess.outputs.values()){
    var opt = document.createElement("option");
    opt.text = input.name;
    opt.value = input.id;
    document.getElementById("midiOut").add(opt);
  }
}

  function activateDevice(id){
  inputs = midiAccess.inputs.values();
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

//init: start up MIDI
window.addEventListener('load', function() {
  if (navigator.requestMIDIAccess)
    navigator.requestMIDIAccess().then( onMIDIInit, onMIDISystemError );

});
