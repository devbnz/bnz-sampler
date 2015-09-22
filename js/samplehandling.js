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
