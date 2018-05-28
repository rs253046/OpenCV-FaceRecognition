const path = require('path');
const cv = require('opencv4nodejs');
exports.cv = cv;

exports.grabFrames = (videoFile, delay, onFrame) => {
  const cap = new cv.VideoCapture(videoFile);
  let done = false;
  const intvl = setInterval(() => {
    let frame = cap.read();
    if (frame.empty) {
      cap.reset();
      frame = cap.read();
    }
    onFrame(frame);

    const key = cv.waitKey(delay);
    done = key !== -1 && key !== 255;
    if (done) {
      clearInterval(intvl);
      console.log('Key pressed, exiting.');
    }
  }, 0);
};

const drawRect = (image, rect, color, opts = { thickness: 2 }) =>
  image.drawRectangle(
    rect,
    color,
    opts.thickness,
    cv.LINE_8
  );

const guid = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
exports.guid = guid;
exports.drawRect = drawRect;
exports.drawBlueRect = (image, rect, opts = { thickness: 2 }) =>
  drawRect(image, rect, new cv.Vec(255, 0, 0), opts);
exports.drawGreenRect = (image, rect, opts = { thickness: 2 }) =>
  drawRect(image, rect, new cv.Vec(0, 255, 0), opts);
exports.drawRedRect = (image, rect, opts = { thickness: 2 }) =>
  drawRect(image, rect, new cv.Vec(0, 0, 255), opts);
