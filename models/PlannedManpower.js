const mongoose = require('mongoose');
const Camera = require('../models/Camera');
const User = require('../models/User');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const ManpowerSchema = new mongoose.Schema({
  camId: {
    type: String,
    required: true
  },
  camIdRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera'
  },
  data: [{
    Type: {
      type: Number,
      default: 0
    },
    planned_manpower: {
      type: Number,
      default: 0
    },
    start_time: {
      type: Date,
      required: true
    },
    end_time: {
      type: Date,
      required: true
    }
  }],
  date: {
    type: Date,
    required: true
  },
  modified: {
    type: Date
  },
  upload: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date
    }
  },
  comments: [{
    text: {
      type: String
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date
    }
  }]
}, {
  collection: 'plannedManPower'
});

ManpowerSchema.plugin(deepPopulate, {
  'comments.userId' : {
    select: 'email'
  },
  'upload.userId' : {
    select: 'email'
  }
});
const Manpower = mongoose.model('plannedManPower', ManpowerSchema);

module.exports = Manpower;
