const mongoose = require('mongoose');
const Camera = require('../models/Camera');
const User = require('../models/User');

const CommentsSchema = new mongoose.Schema({
  camId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

}, {
  collection: 'comments'
});

const Camera = mongoose.model('cameras', CameraSchema);

module.exports = Camera;
