var express = require('express'),
  http = require('http'),
  multer = require('multer'),
  upload = multer({dest: 'uploads/'}),
  exphbs = require('express-handlebars'),
  easyimg = require('easyimage'),
  _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  cv = require('opencv4nodejs');

const { runVideoFaceDetection } = require('./commons');
const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
const webcamPort = 0;
const port = 3000;
let image;

var app = express();
app.use(express.static(__dirname + '/public'))
app.engine('.hbs', exphbs({extname: '.hbs', defaultLayout: 'default'}));
app.set('view engine', '.hbs');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.get('/', function(req, res, next) {
  return res.render('index');
});

function detectFaces(img) {
  const options = {
    minSize: new cv.Size(100, 100),
    scaleFactor: 1.2,
    minNeighbors: 10
  };
  return classifier.detectMultiScale(img.bgrToGray(), options).objects;
}


http.listen(port, function(server) {
  console.log('Listening on port %d', port);
});

io.on('connection', function(socket){
  runVideoFaceDetection(webcamPort, detectFaces, socket);
});
