const User = require('../models/User');
const Book = require('../models/Book');
const bookConverter = require('../controllers/bookConverter');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');
const fs = require('fs');
var path = require("path");
var multer = require('multer');
var glob = require("glob")

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, path.join(__dirname, '../uploads/tempUpload'));
    },
    filename: function(req, file, callback) {
        callback(null, file.originalname);
    }
});

var uploadPlanned = multer({
    storage: storage,
}).single('userBook');

exports.getBookPages = async (req,res) => {
  let pathTemp = path.join(__dirname, '../uploads/' + req.query.bookType + '/' + req.query.bookId)
  glob(pathTemp + "/*.png", function (er, files) {
    for (var i = 0; i < files.length; i++) {
      files[i] = {
        path: files[i].split("uploads")[1],
        number: parseInt(files[i].split("Pic-")[1].split(".")[0])
      }
    }
    res.json({
      status: 1,
      files: files
    })
  })
}

exports.uploadBook = async (req, res) => {
  if (req.body) {
    console.log(req.body)
    if (req.body.bookDetails) {
      let book = await new Book(req.body.bookDetails).save();
      if(book) {
        res.json({
          status: 1,
          book: book
        })
      } else {

      }
    }
  }
}

function mkDirByPathSync(targetDir, {
  isRelativeToScript = false
} = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

exports.uploadPdf = async (req,res) => {
  mkDirByPathSync(path.join(__dirname, '../uploads/' + req.query.bookType + '/' + req.query.bookId));
  uploadPlanned(req, res, function(data, err) {
      if (err) {
        console.log(err, err.field)
          return res.json({status: 0});
      }
      console.log("Uploaded", data);
      fs.copyFileSync(
        path.join(__dirname, '../uploads/tempUpload/' + req.query.fName),
        path.join(__dirname, '../uploads/' + req.query.bookType + '/' + req.query.bookId + '/' + req.query.fName)
      );
      return res.json({status: 1});
  });
  // fs.moveSync(path.join(__dirname, '../uploads/tempUpload'), '/tmp/may/already/exist/somedir', { overwrite: true })
}

exports.getAllBooks = async (req, res) => {
  let aggPipeline = []

  let matchObject = {}
  if(req.query.bookId) {
    matchObject['bookId'] = req.query.bookId
  }

  if(req.query.instituteType) {
    matchObject['instituteType'] = req.query.instituteType
  }

  aggPipeline.push({
    $match: matchObject
  })

  var book = await Book.aggregate(aggPipeline).exec();
  if(book) {
    return res.json(book)
  }
}

exports.subscribeBook = async (req, res) => {
  let aggPipeline = []
  aggPipeline.push({
    $match: {}
  })

  var book = await Book.aggregate(aggPipeline).exec();
  if(book) {
    return res.json(book)
  }
}
