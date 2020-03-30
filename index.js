const path = require('path');

const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const bodyParser = require('body-parser');

const app = express();
const rootDir = require('./util/path');

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(rootDir, 'public')));

app.get('/', (req, res, next) => {
  res.render('index.ejs');
});

const upload = multer({
  limits: {
    fileSize: 5000000
  },
  fileFilter(req, file, cb) {
    if (file.originalname.search(/\.(doc|docx)$/i)) {
      return cb(undefined, true);
    } else {
      const err = new Error('File must be a word doc');
      return cb(err);
    }
  }
});

app.post('/', upload.single('docInput'), async (req, res, next) => {
  try {
    const usePlaceholderImages = req.body.usePlaceholderImages === 'true';
    let toHtml;
    if (usePlaceholderImages) {
      toHtml = await mammoth.convertToHtml(
        {
          buffer: req.file.buffer
        },
        {
          convertImage: mammoth.images.imgElement(image => {
            return image.read("base64")
              .then(() => {
                return {
                  src: "https://source.unsplash.com/400x225/?japan,flower"
                };
              });
          })
        }
      );
    } else {
      toHtml = await mammoth.convertToHtml({ buffer: req.file.buffer });
    }
    const html = toHtml.value.replace(/\<\/p\>/g, '</p>\n\n');
    res.render('htmlOutput.ejs', { html });
  } catch (err) {
    res.status(400).send({ "error": err.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, (err) => {
  if (!err) {
    console.log(`App is running on port ${port}`);
  }
});