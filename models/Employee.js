const mongoose = require('mongoose');
const Group = require('../models/Groups');

const EmployeeSchema = new mongoose.Schema({
  empName: {
    type: String,
  },
  empId: {
    type: String,
    required: true
  },
  folderPath: {
    type: String
  },
  plant: {
    type: String
  },
  trainingImages: [{
    type: String
  }],
  aiData: {
    encodingData : [{
      type: String
    }]
  },
  designation : {
    type: String
  },
  groups : [{
    type: mongoose.Schema.Types.String,
    ref: 'Group'
  }],
  workDetails: {
    areaAssigned : {
      camId : {
        type: String
      },
      type : {
        type: String
      }
    }
  }
}, {
  collection: 'employee'
});

const Employee = mongoose.model('employee', EmployeeSchema);

EmployeeSchema.index({ empId: 1})

module.exports = Employee;
