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

var exts = {'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif'
}

var port = 3000;
let image;
var app = express();
app.use(express.static(__dirname + '/public'))
app.engine('.hbs', exphbs({extname: '.hbs', defaultLayout: 'default'}));
app.set('view engine', '.hbs');

app.get('/', function(req, res, next) {
  return res.render('index');
});

app.post('/upload', upload.single('file'), function(req, res, next) {
  var filename = req.file.filename + exts[req.file.mimetype]
  var file = __dirname + '/public/images/' + filename;
  fs.rename(req.file.path, file, function(err) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {

      const predictionImg = cv.imread(file);

      classifier.detectMultiScaleAsync(predictionImg).then(({objects}) => {
        if (!objects || objects.length === 0)
          throw new Error('No objects found');

        let found = [];

        // for each found face let's predict if is Eleven
        objects.forEach((rect, i) => {
          const faceImage = (predictionImg.getRegion(rect)).bgrToGray().resize(size, size);

          const result = eigenRecognizer.predict(faceImage);
          console.log(result);
          // the more prediction confidence is near 0, the more efficient prediction is
          // if ((!found || found.prediction.confidence > result.confidence)) {
          //   found = {
          //     prediction: result,
          //     rect,
          //   }
          // }

          found.push({prediction: result, rect})
        });

        console.timeEnd('Face recognition');

        return found;
      }).then((found) => {
        found.forEach((te) => {
          if (!te)
            throw new Error('No face found');
          const {rect, prediction} = te;


          // let's draw a rectangle on found face
          const point1 = new cv.Point(rect.x, rect.y);
          const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
          const vector = new cv.Vec(rect.x, rect.y, .5);
          const thickness = 2;

          predictionImg.drawRectangle(point1, point2, vector, cv.LINE_4, thickness);
          const alpha = 0.4;

          cv.drawTextBox(predictionImg, new cv.Point(rect.x, rect.y + rect.height + 10), [
            {
              text: prediction.label.toString()
            }
          ], alpha);


        })

        const outBase64 =  cv.imencode('.jpg', predictionImg).toString('base64'); // Perform base64 encoding
        console.log(outBase64);
        const htmlImg='<img src=data:image/jpeg;base64,'+outBase64 + '>';

        res.render('result', { filename: filename, faces: outBase64 })
        // cv.imshowWait('Eleven', predictionImg);
      }).catch((err) => console.error(err));



      // res.json({message: 'File uploaded successfully', filename: req.file.filename});
    }
  });
});

const size = 120;
// CascadeClassifier class is used to detect faces in a video stream or image.
const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT);
let dataDir = "./face-recognition/trainIt/Rahul";

const getFaceImage = (image) => {
  const detectedFaces = classifier.detectMultiScale(image).objects;
  if (!detectedFaces.length)
    throw new Error('no faces found');

  // prediction should be done on greyscale images of the same sizes
  return image.getRegion(detectedFaces[0]).bgrToGray().resize(size, size);
};

console.time('Face recognition');

const imagesPaths = [
  path.join(__dirname, 'face-recognition/trainIt/Rahul', 'R1.jpg'),
  path.join(__dirname, 'face-recognition/trainIt/Rahul', 'R2.jpg'),
  path.join(__dirname, 'face-recognition/trainIt/Rahul', 'R3.jpg')
];

const images = imagesPaths.map((path) => cv.imread(path)).map(getFaceImage);

const eigenRecognizer = new cv.EigenFaceRecognizer(3, 3000);
eigenRecognizer.train(images, [11, 11, 11]);

http.createServer(app).listen(port, function(server) {
  console.log('Listening on port %d', port);
});
