const User = require('../models/User');
const Book = require('../models/Book');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');

exports.uploadBook = async (req, res) => {
  if (req.body) {
    if (req.body.bookDetails) {
      let book = await new Book(req.body.bookDetails).save();
      if(book) {
        res.json({
          status: 1,
          book: book
        })
      }
    }
  }
}

exports.getAllBooks = async (req, res) => {
  let aggPipeline = []
  aggPipeline.push({
    $match: {}
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
