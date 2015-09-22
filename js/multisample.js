var patches = [];
var currentPatch = 0;
var testbuffer;

function deconstructMultisample( multi ) {
	for (var sample in multi.samples) {
		sample.multiSample = null;
	}
}

function getSourceForNote( patch, note ) {
	//console.log(patch, note);
	var currentBest = -1;
	var currentBestDelta = 255;

	for (var i=0, end=patch.samples.length; i<end; i++) {
		var thisDelta = Math.abs(note-patch.samples[i].noteNumber);
		if (thisDelta<currentBestDelta) {
			currentBest=i;
			currentBestDelta = thisDelta;
		}
	}
	if (currentBest<0)
		return null;

//	console.log("Choosing note " + patch.samples[currentBest].note + " for note " + note );
	var source = audioContext.createBufferSource();
	source.buffer = testbuffer;
	console.log(note);
	source.playbackRate.value = Math.pow( 2, (note - 60)/12);
//	source.onended = function () {console.log("ended");};
	return source;
}

function kickOffSampleDownload( sample ) {
	console.log(sample.sample, sample.patch.href);
	var url = new URL(sample.sample, sample.patch.href);
  	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";
	request.onload = function() {
  		audioContext.decodeAudioData( request.response,
  			function(buffer) { console.log("sample loaded!"); sample.loaded=true; sample.buffer = buffer;
			},
  			function() { console.log("Decoding error! ");} );
	}
	sample.loaded = false;
	request.send();
}

function SCkickOffSampleDownload( sample ) {
	//sample.sample = sample;
	console.log(sample);
	var url = new URL(sample+ '?client_id=17a992358db64d99e492326797fff3e8');
  	console.log(url);
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";
	request.onload = function() {
		console.log(audioContext);
  		audioContext.decodeAudioData( request.response,
  			function(buffer) { console.log("sample loaded!"); sample.loaded=true; sample.buffer = buffer;
			testbuffer = buffer;
			$('.sample').removeClass('off').addClass('on');
			//startUserMedia();
			},
  			function() { console.log("Decoding error! ");} );
	}
	sample.loaded = false;
	request.send();
}


function noteNumberFromString( str ) {
	var _keylayout = [-3,-1,0,2,4,5,7];
	var keyOffset = 0;
	var octaveStart=1;  // where does the octave start in the string
	var noteName = str.charAt(0).toLowerCase();

	var key = noteName.charCodeAt(0) - 97 /* ='a' */;
	if ((key<0)||(key>7))
		return -1;
	if (str.charAt(1) == '#') {
		keyOffset=1;
		octaveStart++;
	} else if (str.charAt(1) == 'b') {
		keyOffset=-1;
		octaveStart++;
	}
	var octave=parseInt(str.substr(octaveStart),10);
	if (key>=2)
		octave -= 1;
	return (octave*12 + 24 + _keylayout[key] + keyOffset);
}

function downloadSamplesForPatch(patch) {
	var samples = patch.samples;
	for(var i=0, end=samples.length;i<end;i++){
		if (!samples[i].buffer)
			kickOffSampleDownload(samples[i]);
	}
}

function loadPatch( patch, url ) {
	var samples = patch.samples;
	patch.href = url;
	var opt = document.createElement("option");
	opt.appendChild(document.createTextNode(patch.name));
	opt.patch = patch;
	patchSelect.appendChild(opt);

	for(var i=0, end=samples.length;i<end;i++){
		var sample = samples[i];
		sample.noteNumber = noteNumberFromString(sample.note);
		sample.patch = patch;
		sample.buffer = null;
		// don't autoload all the samples!
		// kickOffSampleDownload(sample);
	}

}

function patchLoaded() {

}

function loadMultiPatchJSONObject( url, obj ) {
	patchSelect.options.length=0;
	for (var i=0, end=obj.patches.length; i<end; i++ ) {
		loadPatch( obj.patches[i], url );
		patches.push(obj.patches[i]);
	}
	//console.log('test');
	//downloadSamplesForPatch(patches[0]);
}

function loadMultiPatchFile( url, cb ) {
  	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "text";
	request.onload = function() {
		var jsonObject = null;
		try {
		    jsonObject = JSON.parse(request.response);
		} catch (e) {
		    console.error("JSON parsing error:", e);
		    return;
		}
  		cb( new window.URL(url, window.location.href), jsonObject );
	}
	request.send();
}
