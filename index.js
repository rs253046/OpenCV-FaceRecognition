import express from 'express';
import http from 'http';
import exphbs from 'express-handlebars';
import fs from 'fs';
import path from 'path';
import cv from 'opencv4nodejs';
import io from 'socket.io';
import  { grabFrames } from './lib/utils';
import  { makeRunVideoFaceDetection, saveFaceImages, detectFaces } from './lib/commons';

const webcamPort = 0;
const port = 3000;
const app = express();

app.use(express.static(__dirname + '/public'))
app.engine('.hbs', exphbs({extname: '.hbs', defaultLayout: 'default'}));
app.set('views', 'src/views');
app.set('view engine', '.hbs');

app.get('/', function(req, res, next) {
  return res.render('index');
});


const httpServer = http.Server(app);
const ioSocket = io(httpServer);

httpServer.listen(port, function(server) {
  console.log('Listening on port %d', port);
});

const runDetection = makeRunVideoFaceDetection();
let maxFaceImageCount = 5;
ioSocket.on('connection', function(socket) {
  grabFrames(webcamPort, 1, function(frame) {
    if (maxFaceImageCount > 0) {
      saveFaceImages(frame, detectFaces);
      maxFaceImageCount--;
    }

    const outBase64 = cv.imencode('.jpg', runDetection(frame, detectFaces)).toString('base64');
    const buf = Buffer.from(outBase64, 'base64');
    socket.emit('frame', {buffer: buf});
  });
});

// const { makeRunDetectFacenetSSD } = require('./commons');
// const runDetection = makeRunDetectFacenetSSD();
//
// ioSocket.on('connection', function(socket){
//   grabFrames(webcamPort, 1, function(frame) {
//     const outBase64 = cv.imencode('.jpg', runDetection(frame, 0.7)).toString('base64');
//     var buf = Buffer.from(outBase64, 'base64');
//     socket.emit('frame', { buffer: buf });
//   });
// });
