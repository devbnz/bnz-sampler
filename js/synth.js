var voices = new Array();
//var audioContext = null;
var isMobile = false;	// we have to disable the convolver on mobile for performance reasons.
var patchSelect = null;

var currentEnvA = 2;
var currentEnvD = 15;
var currentEnvS = 68;
var currentEnvR = 5;

var currentDrive = 38;
var currentRev = 32;
var currentVol = 50;

var keys = new Array( 256 );
keys[65] = 60; // = C4 ("middle C")
keys[87] = 61;
keys[83] = 62;
keys[69] = 63;
keys[68] = 64;
keys[70] = 65; // = F4
keys[84] = 66;
keys[71] = 67;
keys[89] = 68;
keys[72] = 69;
keys[85] = 70;
keys[74] = 71;
keys[75] = 72; // = C5
keys[79] = 73;
keys[76] = 74;
keys[80] = 75;
keys[186] = 76;
keys[222] = 77; // = F5
keys[221] = 78;
keys[13] = 79;
keys[220] = 80;

var effectChain = null;
var waveshaper = null;
var volNode = null;
var revNode = null;
var revGain = null;
var revBypassGain = null;

function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}

function noteOn( note, velocity ) {
	if (voices[note] == null) {
		// Create a new synth node
		voices[note] = new Voice(note, velocity);
		var e = document.getElementById( "k" + note );
		if (e)
			e.classList.add("pressed");
	}
}

function noteOff( note ) {
	if (voices[note] != null) {
		// Shut off the note playing and clear it
		voices[note].noteOff();
		voices[note] = null;
		var e = document.getElementById( "k" + note );
		if (e)
			e.classList.remove("pressed");
	}

}

function $(id) {
	return document.getElementById(id);
}

// 'value' is normalized to 0..1.
function controller( number, value ) {
	switch(number) {
	case 7:
		$("fFreq").setValue(100*value);
		onUpdateFilterCutoff( 100*value );
		return;
	case 0x0a:
	case 2:
		$("fQ").setValue(20*value);
		onUpdateFilterQ( 20*value );
		return;
	case 1:
		//$("fMod").setValue(100*value);
		//onUpdateFilterMod(100*value);
		return;
	case 0x49:
	case 5:
	    $("drive").setValue(100 * value);
	    onUpdateDrive( 100 * value );
	    return;
	case 0x48:
	case 6:
	    $("reverb").setValue(100 * value);
	    onUpdateReverb( 100 * value );
	    return;
	case 0x4a:
	    $("modOsc1").setValue(100 * value);
	    onUpdateModOsc1( 100 * value );
	    return;
	case 0x47:
	    $("modOsc2").setValue(100 * value);
	    onUpdateModOsc2( 100 * value );
	    return;
	case 4:
	    $("mFreq").setValue(10 * value);
	    onUpdateModFrequency( 10 * value );
	    return;
	case 0x5b:
	    $("volume").setValue(100 * value);
	    onUpdateVolume( 100 * value );
	    return;
	case 33: // "x1" button
	case 51:
		moDouble = (value > 0);
		changeModMultiplier();
	    return;
	case 34: // "x2" button
	case 52:
		moQuadruple = (value > 0);
		changeModMultiplier();
	    return;
	}
}

var currentPitchWheel = 0.0;
// 'value' is normalized to [-1,1]
function pitchWheel( value ) {
	var i;

	currentPitchWheel = value;
	for (var i=0; i<255; i++) {
		if (voices[i]) {
			if (voices[i].osc1)
				voices[i].osc1.detune.value = currentOsc1Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
		}
	}
}

function onUpdateEnvA( ev ) {
	currentEnvA = ev.currentTarget.value;
}

function onUpdateEnvD( ev ) {
	currentEnvD = ev.currentTarget.value;
}

function onUpdateEnvS( ev ) {
	currentEnvS = ev.currentTarget.value;
}

function onUpdateEnvR( ev ) {
	currentEnvR = ev.currentTarget.value;
}

function onUpdateDrive( value ) {
	currentDrive = value;
    waveshaper.setDrive( 0.01 + (currentDrive*currentDrive/500.0) );
}

function onUpdateVolume( ev ) {
	volNode.gain.value = (ev.currentTarget ? ev.currentTarget.value : ev)/100;
}

function onUpdateReverb( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	value = value/100;

	// equal-power crossfade
	var gain1 = Math.cos(value * 0.5*Math.PI);
	var gain2 = Math.cos((1.0-value) * 0.5*Math.PI);

	revBypassGain.gain.value = gain1;
	revGain.gain.value = gain2;
}

function filterFrequencyFromCutoff( pitch, cutoff ) {
    var nyquist = 0.5 * audioContext.sampleRate;

    var filterFrequency = Math.pow(2, (9 * cutoff) - 1) * pitch;
    if (filterFrequency > nyquist)
        filterFrequency = nyquist;
	return filterFrequency;
}

function Voice( note, velocity ) {
	this.originalFrequency = frequencyFromNoteNumber( note );

	// create osc 1
	this.source = getSourceForNote(patches[currentPatch], note);

	// create the velocity gain node
	this.velocityGain = audioContext.createGain();
	this.velocityGain.gain.value = velocity;

	this.source.connect( this.velocityGain );

	// create the volume envelope
	this.envelope = audioContext.createGain();
	this.envelope.connect( effectChain );
	this.velocityGain.connect(this.envelope);

	// set up the volume and filter envelopes
	var now = audioContext.currentTime;
	var envAttackEnd = now + (currentEnvA/20.0);

	this.envelope.gain.value = 0.0;
	this.envelope.gain.setValueAtTime( 0.0, now );
	this.envelope.gain.linearRampToValueAtTime( 1.0, envAttackEnd );
	this.envelope.gain.setTargetAtTime( (currentEnvS/100.0), envAttackEnd, (currentEnvD/100.0)+0.001 );

	this.source.start(0);
}


Voice.prototype.setModWaveform = function( value ) {
	this.modOsc.type = value;
}

Voice.prototype.updateModFrequency = function( value ) {
	this.modOsc.frequency.value = value;
}

Voice.prototype.updateModOsc1 = function( value ) {
	this.modOsc1Gain.gain.value = value/10;
}

Voice.prototype.updateModOsc2 = function( value ) {
	this.modOsc2Gain.gain.value = value/10;
}

Voice.prototype.setOsc1Waveform = function( value ) {
	this.osc1.type = value;
}

Voice.prototype.updateOsc1Frequency = function( value ) {
	this.osc1.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc1Octave-2));  // -2 because osc1 is 32', 16', 8'
	this.osc1.detune.value = currentOsc1Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc1Mix = function( value ) {
	this.osc1Gain.gain.value = 0.005 * value;
}

Voice.prototype.setOsc2Waveform = function( value ) {
	this.osc2.type = value;
}

Voice.prototype.updateOsc2Frequency = function( value ) {
	this.osc2.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc2Octave-1));
	this.osc2.detune.value = currentOsc2Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc2Mix = function( value ) {
	this.osc2Gain.gain.value = 0.005 * value;
}

Voice.prototype.setFilterCutoff = function( value ) {
	var now =  audioContext.currentTime;
	var filterFrequency = filterFrequencyFromCutoff( this.originalFrequency, value/100 );
	this.filter1.frequency.cancelScheduledValues( now );
	this.filter1.frequency.setValueAtTime( filterFrequency, now );
	this.filter2.frequency.cancelScheduledValues( now );
	this.filter2.frequency.setValueAtTime( filterFrequency, now );
}

Voice.prototype.setFilterQ = function( value ) {
	this.filter1.Q.value = value;
	this.filter2.Q.value = value;
}

Voice.prototype.setFilterMod = function( value ) {
	this.modFilterGain.gain.value = currentFilterMod*24;
}

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;
	var release = now + (currentEnvR/10.0);

//    console.log("noteoff: now: " + now + " val: " + this.filter1.frequency.value + " initF: " + initFilter + " fR: " + currentFilterEnvR/100 );
	this.envelope.gain.cancelScheduledValues(now);
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );  // this is necessary because of the linear ramp
	this.envelope.gain.setTargetAtTime(0.0, now, (currentEnvR/100));

	this.source.stop( release );
}

var currentOctave = 3;
var modOscFreqMultiplier = 1;
var moDouble = false;
var moQuadruple = false;

function changeModMultiplier() {
	modOscFreqMultiplier = (moDouble?2:1)*(moQuadruple?4:1);
	onUpdateModFrequency( currentModFrequency );
}

function keyDown( ev ) {
	if ((ev.keyCode==49)||(ev.keyCode==50)) {
		if (ev.keyCode==49)
			moDouble = true;
		else if (ev.keyCode==50)
			moQuadruple = true;
		changeModMultiplier();
	}

	var note = keys[ev.keyCode];
	if (note)
		noteOn( note + 12*(3-currentOctave), 0.75 );
//	console.log( "key down: " + ev.keyCode );

	return false;
}

function keyUp( ev ) {
	if ((ev.keyCode==49)||(ev.keyCode==50)) {
		if (ev.keyCode==49)
			moDouble = false;
		else if (ev.keyCode==50)
			moQuadruple = false;
		changeModMultiplier();
	}

	var note = keys[ev.keyCode];
	if (note)
		noteOff( note + 12*(3-currentOctave) );
//	console.log( "key up: " + ev.keyCode );

	return false;
}
var pointers=[];

function touchstart( ev ) {
	for (var i=0; i<ev.targetTouches.length; i++) {
	    var touch = ev.targetTouches[0];
		var element = touch.target;

		var note = parseInt( element.id.substring( 1 ) );
		console.log( "touchstart: id: " + element.id + "identifier: " + touch.identifier + " note:" + note );
		if (!isNaN(note)) {
			noteOn( note + 12*(3-currentOctave), 0.75 );
			var keybox = document.getElementById("keybox")
			pointers[touch.identifier]=note;
		}
	}
	ev.preventDefault();
}

function touchmove( ev ) {
	for (var i=0; i<ev.targetTouches.length; i++) {
	    var touch = ev.targetTouches[0];
		var element = touch.target;

		var note = parseInt( element.id.substring( 1 ) );
		console.log( "touchmove: id: " + element.id + "identifier: " + touch.identifier + " note:" + note );
		if (!isNaN(note) && pointers[touch.identifier] && pointers[touch.identifier]!=note) {
			noteOff(pointers[touch.identifier] + 12*(3-currentOctave));
			noteOn( note + 12*(3-currentOctave), 0.75 );
			var keybox = document.getElementById("keybox")
			pointers[touch.identifier]=note;
		}
	}
	ev.preventDefault();
}

function touchend( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	console.log( "touchend: id: " + ev.target.id + " note:" + note );
	if (note != NaN)
		noteOff( note + 12*(3-currentOctave) );
	pointers[ev.pointerId]=null;
	var keybox = document.getElementById("keybox")
	ev.preventDefault();
}

function touchcancel( ev ) {
	console.log( "touchcancel" );
	ev.preventDefault();
}

function pointerDown( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointer down: id: " + ev.pointerId
			+ " target: " + ev.target.id + " note:" + note );
	if (!isNaN(note)) {
		noteOn( note + 12*(3-currentOctave), 0.75 );
		var keybox = document.getElementById("keybox")
		pointers[ev.pointerId]=note;
	}
	ev.preventDefault();
}

function pointerMove( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointer move: id: " + ev.pointerId
			+ " target: " + ev.target.id + " note:" + note );
	if (!isNaN(note) && pointers[ev.pointerId] && pointers[ev.pointerId]!=note) {
		if (pointers[ev.pointerId])
			noteOff(pointers[ev.pointerId] + 12*(3-currentOctave));
		noteOn( note + 12*(3-currentOctave), 0.75 );
		pointers[ev.pointerId]=note;
	}
	ev.preventDefault();
}

function pointerUp( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointer up: id: " + ev.pointerId + " note:" + note );
	if (note != NaN)
		noteOff( note + 12*(3-currentOctave) );
	pointers[ev.pointerId]=null;
	var keybox = document.getElementById("keybox")
	ev.preventDefault();
}

function pointerOver( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerover: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerOut( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerout: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerEnter( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerenter: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerLeave( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerleave: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerCancel( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointercancel: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}

function onChangeOctave( ev ) {
	currentOctave = ev.target.selectedIndex;
}

var myOscilloscope = null;

// shim layer with setTimeout fallback
window.requestAnimationFrame = window.requestAnimationFrame       ||
  window.webkitRequestAnimationFrame;

function pushme() {
  pwmOsc.stop(0);
  //window.cancelAnimationFrame(rafID);
}
var rafID;
var myOscilloscope = null;

function draw() {
  if (myOscilloscope)
    myOscilloscope.draw(myOscilloscope.canvas.myContext);

  rafID = requestAnimationFrame( draw );
}

function initAudio() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	try {
    	audioContext = new AudioContext();
  	}
  	catch(e) {
    	alert('The Web Audio API is apparently not supported in this browser.');
  	}

	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
	setupSynthUI();
	patchSelect = document.getElementById("patch");
	patchSelect.onchange=function ( ev ) {currentPatch = ev.target.selectedIndex;downloadSamplesForPatch(patches[currentPatch]);};
	$("octave").onchange=onChangeOctave;
	isMobile = (navigator.userAgent.indexOf("Android")!=-1)||(navigator.userAgent.indexOf("iPad")!=-1)||(navigator.userAgent.indexOf("iPhone")!=-1);

	// set up the master effects chain for all voices to connect to.
	effectChain = audioContext.createGain();

	var analyser = audioContext.createAnalyser();
	myOscilloscope = new Oscilloscope(analyser, 512, 256);

	var canvas = document.createElement( 'canvas' );
	canvas.width = 512;
	canvas.height = 256;
	canvas.myContext = canvas.getContext( '2d' );
	myOscilloscope.canvas = canvas;
	document.getElementById("synthbox").appendChild( canvas );

	draw.bind(canvas)();

	effectChain.connect(analyser);

    if (!isMobile)
    	revNode = audioContext.createConvolver();
    else
    	revNode = audioContext.createGain();
	revGain = audioContext.createGain();
	revBypassGain = audioContext.createGain();

    volNode = audioContext.createGain();
    volNode.gain.value = currentVol;
    effectChain.connect( revNode );
    effectChain.connect( revBypassGain );
    revNode.connect( revGain );
    revGain.connect( volNode );
    revBypassGain.connect( volNode );
    onUpdateReverb( {currentTarget:{value:currentRev}} );
    RecNode = audioContext.createGain();
	//RecNode.gain.value = 1.0;
	//RecNode.connect(audioContext.destination);
    volNode.connect( RecNode );
    volNode.connect( audioContext.destination );
	onUpdateVolume( {currentTarget:{value:currentVol}} );

    if (!isMobile) {
	  	var irRRequest = new XMLHttpRequest();
		irRRequest.open("GET", "sounds/irRoom.wav", true);
		irRRequest.responseType = "arraybuffer";
		irRRequest.onload = function() {
	  		audioContext.decodeAudioData( irRRequest.response,
	  			function(buffer) { if (revNode) revNode.buffer = buffer; else console.log("no revNode ready!")} );
		}
		irRRequest.send();
	}
	loadMultiPatchFile( "sounds/samples/Fairlight.json", loadMultiPatchJSONObject );
}

window.onload=initAudio;
