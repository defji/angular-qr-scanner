(function() {
'use strict';

angular.module('qrScanner', ["ng"]).directive('qrScanner', ['$interval', '$window', function($interval, $window) {
  return {
    restrict: 'E',
    scope: {
      ngSuccess: '&ngSuccess',
      ngError: '&ngError',
      ngVideoError: '&ngVideoError'
    },
    link: function(scope, element, attrs) {
    
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;


      function gotSources(sourceInfos) {
        for (var i = 0; i !== sourceInfos.length; ++i) {
          var sourceInfo = sourceInfos[i];
          var option = document.createElement('option');
          option.value = sourceInfo.id;
          if (sourceInfo.kind === 'video') {
            option.text = sourceInfo.label || 'Kamera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
          } else {
            console.log('Some other kind of source: ', sourceInfo);
          }
        }
      }

      MediaStreamTrack.getSources(gotSources);


      var height = attrs.height || 300;
      var width = attrs.width || 250;
    
      var video = $window.document.createElement('video');

      video.setAttribute('width', width);
      video.setAttribute('height', height);
      video.setAttribute('autoplay', '');
      video.setAttribute('style', '-moz-transform:rotateY(-180deg);-webkit-transform:rotateY(-180deg);transform:rotateY(-180deg);');
      var canvas = $window.document.createElement('canvas');
      canvas.setAttribute('id', 'qr-canvas');
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      canvas.setAttribute('style', 'display:none;');
      var videoSelect = $window.document.createElement('select');
      videoSelect.setAttribute('id','videoSource');

      angular.element(element).append(video);
      angular.element(element).append(canvas);
      angular.element(element).append(videoSelect);
      var context = canvas.getContext('2d');
      var stopScan;
    
      var scan = function() {
        if ($window.localMediaStream) {
          context.drawImage(video, 0, 0, 307,250);
          try {
            qrcode.decode();
          } catch(e) {
            scope.ngError({error: e});
          }
        }
      }

      var successCallback = function(stream) {
        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
        $window.localMediaStream = stream;

        scope.video = video;
        video.play();
        stopScan = $interval(scan, 500);
      }

      // Call the getUserMedia method with our callback functions
      var videoSelect = document.querySelector('select#videoSource');

      function startVideo() {
        var videoSource = videoSelect.value;

        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: {
               optional: [{
                 sourceId: videoSource
               }]
              }}, successCallback, function(e) {
              scope.ngVideoError({error: e});
            });
          } else {
            scope.ngVideoError({error: 'Native web camera streaming (getUserMedia) not supported in this browser.'});
          }
      }

      startVideo();

      qrcode.callback = function(data) {
        scope.ngSuccess({data: data});
      };

      element.bind('$destroy', function() {
        if ($window.localMediaStream) {
          $window.localMediaStream.stop();
        }
        if (stopScan) {
          $interval.cancel(stopScan);
        }
      });
    }
  }
}]);
})();
