const mongoose = require('mongoose');
const Camera = require('../models/Camera');
const Employee = require('../models/Employee');
const Frame = require('../models/faceFrame');

const CovidSchema = new mongoose.Schema({
  camId: {
    type: String,
  },
  time: {
    type: Date,
    required: true
  },
  bodyTemp: {
    type: String,
    required: true
  },
  empId: {
    type: mongoose.Schema.Types.String,
    ref: 'Employee'
  },
  asAppStatus: {
    type: String
  },
  frameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Frame'
  },
  frameIdString: {
    type: String
  }
}, {
  collection: 'covidData'
});

const Covid = mongoose.model('covidData', CovidSchema);
CovidSchema.index({ empId: 1})
module.exports = Covid;
