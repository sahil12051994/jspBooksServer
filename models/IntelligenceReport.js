const mongoose = require('mongoose');
const Camera = require('../models/Camera');
const User = require('../models/User');

const IntelligenceSchema = new mongoose.Schema({
  camId: {
    type: String,
    required: true
  },
  camIdRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera'
  },
  date: {
    type: Date,
    required: true
  },
  efficiency: {
    total: {
      type: Number,
      default: 0
    },
    hourly: [{
      hour: {
        type: String,
        default: 0
      },
      efficiency: {
        type: Number,
        default: 0
      },
      frames_computed: {
        type: Number,
        default: 0
      }
    }]
  },
  shift_analysis: {
    shift_time_array: [{
      start_time: {
        type: Date
      },
      extra_time_after_shift: {
        type: Number
      },
      frames_computed: {
        type: Number
      },
      comments: {
        type: String
      }
    }],
    shift_overall_comments: {
      type: String
    }
  },
  break_analysis: {
    break_intervals: [{
      start_time: {
        type: Date,
        required: true
      },
      end_time: {
        type: Date,
        required: true
      },
      extra_time_after_break: {
        type: Number
      },
      extra_time_before_break: {
        type: Number
      },
      frames_computed: {
        type: Number
      },
      mode_persons: {
        type: Number
      },
      comments: {
        type: String
      }
    }],
    total_break_mins: {
      type: Number
    },
    extra_break_mins: {
      type: Number
    },
    break_overall_comments: {
      type: String
    },
    zero_overall_comments: {
      type: String
    },
    zero_workforce: [{
      start_time: {
        type: Date,
        required: true
      },
      end_time: {
        type: Date,
        required: true
      },
      link: {
        type: String,
        default: 'None'
      },
      comments: {
        type: String
      }
    }]
  }
}, {
  collection: 'intelligenceData'
});

IntelligenceSchema.index({
  camId: 1,
  date: -1
}, {
  unique: true
});
const Intelligence = mongoose.model('intelligenceData', IntelligenceSchema);

module.exports = Intelligence;
