
function __log(e, data) {
  log.innerHTML += "\n" + e + " " + (data || '');
}

// var audio_context;

function startUserMedia() {
  //  var input = audio_context.createMediaStreamSource(stream);
  //  __log('Media stream created.');
  //  var input;
  //  input.connect(audioContext.destination);
  //  __log('Input connected to audio context destination.');
  inputPoint = audioContext.createGain();
  recorder = new Recorder(inputPoint);
  __log('Recorder initialised.');
}

function startRecording(button) {
  /*RecNode = audioContext.createGain();
  RecNode.gain.value = 1.0;
  RecNode.connect(audioContext.destination);
*/
  recorder = new Recorder(RecNode);
  recorder && recorder.record();
  button.disabled = true;
  button.nextElementSibling.disabled = false;
  __log('Recording...');
}

function stopRecording(button) {
  recorder && recorder.stop();
  button.disabled = true;
  button.previousElementSibling.disabled = false;
  __log('Stopped recording.');

  // create WAV download link using audio data blob
  createDownloadLink();

  recorder.clear();
}

function createDownloadLink() {
  recorder && recorder.exportWAV(function(blob) {
    var url = URL.createObjectURL(blob);
    var li = document.createElement('li');
    var au = document.createElement('audio');
    var hf = document.createElement('a');

    au.controls = true;
    au.src = url;
    hf.href = url;
    hf.download = new Date().toISOString() + '.wav';
    hf.innerHTML = hf.download;
    li.appendChild(au);
    li.appendChild(hf);
    recordingslist.appendChild(li);
  });
}
