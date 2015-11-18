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
            if (sourceInfo.kind === 'video') {
              var option = document.createElement('option');
              option.value = sourceInfo.id;
              option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
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
          $window.localMediaStream = stream;
          $window.stream = stream;
          scope.video = video;
          video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
          video.src = window.URL.createObjectURL(stream);
          video.play();
          stopScan = $interval(scan, 300);
        }


        var errorCallback = function(error) {
          scope.ngVideoError({error: error});
        }

        function startVideo() {
          if (window.stream) {
            video.src = null;
            window.stream.stop();
          }
          var videoSource = videoSelect.value;
          var constraints = {
            video: {
              optional: [{
                sourceId: videoSource
              }]
            }
          };
          navigator.getUserMedia(constraints, successCallback, errorCallback);
        }

        videoSelect.onchange = startVideo;
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