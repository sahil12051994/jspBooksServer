const mongoose = require('mongoose');
const Camera = require('../models/Camera');
const User = require('../models/User');

const PersonSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true
  },
  bbox: {
    type: [Number],
    required: true
  },
  confScore: {
    type: Number,
  },
  trueFace: {
    type: String,
  }
});

const FrameSchema = new mongoose.Schema({
  camId: {
    type: String,
    required: true
  },
  personsDetected:{
    type: [PersonSchema],
    required: true
  },
  time: {
    type: Date,
    required: true
  },
  pathOfFrame: {
    type: String,
    required: true
  },
  camIdRef: {
    type: mongoose.Schema.Types.String,
    ref: 'Camera'
  },
  fileName: {
    type: String,
    // required: true
  },
  confScores: [],
  aiInfo: {
    actualPersons: {
      type: Number
    },
    falseDetections: {
      type: Number
    },
    misDetections: {
      type: Number
    },
    fitForTagging: {
      type: Number
    }
  },
  autoTemp: {
    temp: {
      type: String
    },
    time: {
      type: Date
    }
  },
  asResult: {
    type: String
  },
  asResult_computeTime: {
    type: Number
  },
  fr_computeTime: {
    type: Number
  }
}, {
  collection: 'faceFrame'
});

const Frame = mongoose.model('faceFrame', FrameSchema);

FrameSchema.index({ time: 1, camId: 1 })
FrameSchema.index({ time: 1})

module.exports = Frame;
