const {
  cv,
  drawBlueRect,
  guid
} = require('./utils');

const loadFacenet = require('./dnn/loadFacenet');
const { extractResults } = require('./dnn/ssdUtils');
const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
const faceBasePath = './public/images/trained/sapan';

function classifyImg(net, img) {
  const imgResized = img.resizeToMax(300);
  const inputBlob = cv.blobFromImage(imgResized);

  net.setInput(inputBlob);
  let outputBlob = net.forward();
  outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3]);

  return extractResults(outputBlob, img);
}

exports.makeRunDetectFacenetSSD = function() {
  const net = loadFacenet();
  return function(img, minConfidence) {
    const predictions = classifyImg(net, img);

    predictions
      .filter(res => res.confidence > minConfidence)
      .forEach(p => drawBlueRect(img, p.rect));

    return img;
  }
}

let delay = 1000;
exports.saveFaceImages = function(frame, detectFaces) {
  const frameResized = frame.resizeToMax(800);
  const faceRects = detectFaces(frameResized);

  if (faceRects.length) {
    delay = delay + delay;
  }

  setTimeout(() => {
    if (faceRects.length) {
      faceRects.forEach(faceRect => {
        cv.imwrite(`${faceBasePath}/${guid()}.jpg`, frameResized.getRegion(faceRect));
        console.log('done')
      });
    }
  }, delay);
}

exports.makeRunVideoFaceDetection = function() {
  return function(frame, detectFaces) {
    console.time('detection time');
    const frameResized = frame.resizeToMax(800);
    const faceRects = detectFaces(frameResized);

    if (faceRects.length) {
      faceRects.forEach(faceRect => {
        return drawBlueRect(frameResized, faceRect);
      });
    }

    console.timeEnd('detection time');
    return frameResized;
  }
}

exports.detectFaces = function (img) {
  const options = {
    minSize: new cv.Size(100, 100),
    scaleFactor: 1.2,
    minNeighbors: 10
  };
  return classifier.detectMultiScaleGpu(img.bgrToGray(), options).objects;
}
