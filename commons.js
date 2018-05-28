const {
  cv,
  grabFrames,
  drawBlueRect
} = require('./utils');


function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

const faceBasePath = './public/images/trained/sapan';
let maxFaceImageCount = 5;
exports.runVideoFaceDetection = (src, detectFaces, socket) => {
  const callback = (frame, socket) => {
    console.time('detection time');
    const frameResized = frame.resizeToMax(800);

    const faceRects = detectFaces(frameResized);
    if (faceRects.length) {
      faceRects.forEach(faceRect => {

        if (maxFaceImageCount > 0) {
          (function() {
            console.log(maxFaceImageCount);
            cv.imwrite(`${faceBasePath}/${guid()}.jpg`, frameResized.getRegion(faceRect));
            maxFaceImageCount--;
          })()
        }

        return drawBlueRect(frameResized, faceRect);
      });
    }
    const outBase64 = cv.imencode('.jpg', frameResized).toString('base64');
    var buf = Buffer.from(outBase64, 'base64');
    socket.emit('frame', { buffer: buf });

    // cv.imshow('face detection', frameResized);
    console.timeEnd('detection time');
  };

  return grabFrames(src, 1, callback, socket)
};
