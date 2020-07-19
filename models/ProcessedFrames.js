const mongoose = require('mongoose');
const Camera = require('../models/Camera');
const User = require('../models/User');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const ProcessedSchema = new mongoose.Schema({
  camId: {
    type: String,
    required: true
  },
  camIdRef: {
    type: mongoose.Schema.Types.String,
    ref: 'Camera'
  },
  bboxes: [],
  time: {
    type: Date,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
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
  }
}, {
  collection: 'processedFrames'
});

ProcessedSchema.plugin(deepPopulate, {
  'camIdRef': {
    select: 'status'
  }
});

const Processed = mongoose.model('processedFrames', ProcessedSchema);

module.exports = Processed;
