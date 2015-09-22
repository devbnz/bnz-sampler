var synthBox = null;
var pointerDebugging = false;

function testChange(e) {
	console.log("test");
}

function createKnob( id, label, width, x, y, min, max, currentValue, color, onChange ) {
	var container = document.createElement( "div" );
	container.className = "knobContainer";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";

	var knob = document.createElement( "webaudio-knob" );
	knob.id = id;
	knob.setAttribute( "value", "" + currentValue );
	knob.setAttribute( "src", "img/LittlePhatty.png" );
	knob.setAttribute( "min", ""+min );
	knob.setAttribute( "max", ""+max );
	knob.setAttribute( "step", (max-min)/100 );
	knob.setAttribute( "diameter", "64" );
	knob.setAttribute( "sprites", "100" );
	knob.setAttribute( "tooltip", label );
	knob.onchange = onChange;
	container.appendChild( knob );

	var labelText = document.createElement( "div" );
	labelText.className = "knobLabel";
	labelText.style.top = "" + (width* 0.85) + "px";
	labelText.style.width = "" + width + "px";
	labelText.appendChild( document.createTextNode( label ) );
	container.appendChild( labelText );

	return container;
}

function createDropdown( id, label, x, y, values, selectedIndex, onChange ) {
	var container = document.createElement( "div" );
	container.className = "dropdownContainer";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";

	var labelText = document.createElement( "div" );
	labelText.className = "dropdownLabel";
	labelText.appendChild( document.createTextNode( label ) );
	container.appendChild( labelText );

	var select = document.createElement( "select" );
	select.className = "dropdownSelect";
	select.id = id;
	for (var i=0; i<values.length; i++) {
		var opt = document.createElement("option");
		opt.appendChild(document.createTextNode(values[i]));
		select.appendChild(opt);
	}
	select.selectedIndex = selectedIndex;
	select.onchange = onChange;
	container.appendChild( select );

	return container;
}

function createSection( label, x, y, width, height ) {
	var container = document.createElement( "fieldset" );
	container.className = "section";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";
	container.style.width = "" + width + "px";
	container.style.height = "" + height + "px";

	var labelText = document.createElement( "legend" );
	labelText.className = "sectionLabel";
	labelText.appendChild( document.createTextNode( label ) );

	container.appendChild( labelText );
	return container;
}

function setupSynthUI() {
	synthBox = document.getElementById("synthbox");

/*
	var mod = createSection( "mod", 10, 10, 87, 342 );
	mod.appendChild( createDropdown( "modwave", "shape", 12, 15, ["sine","square", "saw", "triangle"], currentModWaveform, onUpdateModWaveform ))
	mod.appendChild( createKnob( "mFreq", "freq", 80, 12, 65, 0, 10, currentModFrequency, "#c10087", onUpdateModFrequency ) );
	mod.appendChild( createKnob( "modOsc1", "osc1 tremolo", 80, 12, 160, 0, 100, currentModOsc1, "#c10087", onUpdateModOsc1 ) );
	mod.appendChild( createKnob( "modOsc2", "osc2 tremolo", 80, 12, 255, 0, 100, currentModOsc2, "#c10087", onUpdateModOsc2 ) );
	synthBox.appendChild( mod );

	var osc1 = createSection( "OSC1", 130, 10, 223, 160 );	
	osc1.appendChild( createDropdown( "osc1wave", "waveform", 10, 15, ["sine","square", "saw", "triangle"], currentOsc1Waveform, onUpdateOsc1Wave ))
	osc1.appendChild( createDropdown( "osc1int", "interval",  140, 15, ["32'","16'", "8'"], currentOsc1Octave, onUpdateOsc1Octave ) );
	osc1.appendChild( createKnob(     "osc1detune", "detune", 100, 10, 65, -1200, 1200, currentOsc1Detune, "blue", onUpdateOsc1Detune ) );
	osc1.appendChild( createKnob(     "osc1mix", "mix",       100, 130, 65, 0, 100, currentOsc1Mix, "blue", onUpdateOsc1Mix ) );
	synthBox.appendChild( osc1 );

	var osc2 = createSection( "OSC2", 130, 192, 223, 160 );	
	osc2.appendChild( createDropdown( "osc2wave", "waveform", 10, 15, ["sine","square", "saw", "triangle"], currentOsc2Waveform, onUpdateOsc2Wave ))
	osc2.appendChild( createDropdown( "osc2int", "interval", 140, 15, ["16'","8'", "4'"], currentOsc2Octave, onUpdateOsc2Octave ) );
	osc2.appendChild( createKnob( "osc2detune", "detune", 100, 10, 65, -1200, 1200, currentOsc2Detune, "blue", onUpdateOsc2Detune ) );
	osc2.appendChild( createKnob( "osc2mix", "mix", 100, 130, 65, 0, 100, currentOsc2Mix, "blue", onUpdateOsc2Mix ) );
	synthBox.appendChild( osc2 );

	var filter = createSection( "filter", 387, 10, 80, 342 );	
	filter.appendChild( createKnob( "fFreq", "cutoff", 75, 12, 15, 0, 100, currentFilterCutoff, "#ffaa00", onUpdateFilterCutoff ) );
	filter.appendChild( createKnob( "fQ", "q",       75, 12, 100, 0, 20, currentFilterQ, "#ffaa00", onUpdateFilterQ ) );
	filter.appendChild( createKnob( "fMod", "mod",   75, 12, 185, 0, 100, currentFilterMod, "#ffaa00", onUpdateFilterMod ) );
	filter.appendChild( createKnob( "fEnv", "env",   75, 12, 270, 0, 100, currentFilterEnv, "#ffaa00", onUpdateFilterEnv ) );
	synthBox.appendChild( filter );

	var filterEnv = createSection( "filter envelope", 501, 10, 355, 98 );	
	filterEnv.appendChild( createKnob( "fA", "attack",  80,   10, 20, 0, 100, currentFilterEnvA, "#bf8f30", onUpdateFilterEnvA ) );
	filterEnv.appendChild( createKnob( "fD", "decay",   80,  100, 20, 0, 100, currentFilterEnvD, "#bf8f30", onUpdateFilterEnvD ) );
	filterEnv.appendChild( createKnob( "fS", "sustain", 80,  190, 20, 0, 100, currentFilterEnvS, "#bf8f30", onUpdateFilterEnvS ) );
	filterEnv.appendChild( createKnob( "fR", "release", 80,  280, 20, 0, 100, currentFilterEnvR, "#bf8f30", onUpdateFilterEnvR ) );
	synthBox.appendChild( filterEnv );

	var volumeEnv = createSection( "volume envelope", 501, 131, 355, 98 );	
	volumeEnv.appendChild( createKnob( "vA", "attack",  80,   10, 20, 0, 100, currentEnvA, "#00b358", onUpdateEnvA ) );
	volumeEnv.appendChild( createKnob( "vD", "decay",   80,  100, 20, 0, 100, currentEnvD, "#00b358", onUpdateEnvD ) );
	volumeEnv.appendChild( createKnob( "vS", "sustain", 80,  190, 20, 0, 100, currentEnvS, "#00b358", onUpdateEnvS ) );
	volumeEnv.appendChild( createKnob( "vR", "release", 80,  280, 20, 0, 100, currentEnvR, "#00b358", onUpdateEnvR ) );
	synthBox.appendChild( volumeEnv );

	var master = createSection( "master", 501, 254, 355, 98 );	
	master.appendChild( createKnob( "drive", "drive",    80,   10, 20, 0, 100, currentDrive, "yellow", onUpdateDrive ) );
	master.appendChild( createKnob( "reverb", "reverb",     80,  100, 20, 0, 100, currentRev, "yellow", onUpdateReverb ) );
	master.appendChild( createKnob( "volume", "volume",     80,  190, 20, 0, 100, currentVol, "yellow", onUpdateVolume ) );
	master.appendChild( createDropdown( "midiIn", "midi_in", 280, 15, ["-no MIDI-"], 0, selectMIDIIn ) );
	master.appendChild( createDropdown( "kbd_oct", "kbd_oct", 280, 60, ["+3", "+2","+1", "normal", "-1", "-2", "-3"], 3, onChangeOctave ) );
	synthBox.appendChild( master );
*/

	keybox = document.getElementById("keybox");
	/*
	keybox.addEventListener('pointerdown', pointerDown);
	keybox.addEventListener('pointermove', pointerMove);
	keybox.addEventListener('pointerup', pointerUp);
	keybox.addEventListener('pointerover', pointerOver);
	keybox.addEventListener('pointerout', pointerOut);
	keybox.addEventListener('pointerenter', pointerEnter);
	keybox.addEventListener('pointerleave', pointerLeave);
	keybox.addEventListener('pointercancel', pointerCancel);
	*/
} 
