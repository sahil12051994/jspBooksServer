const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  camId: {
    ype: String
  },
  recievers: [{
    type: String
  }],
  groupPermissions: [{
    type: String
  }],
  camStatus: {
    type: String
  }
}, {
  collection: 'alerts'
});

const Alert = mongoose.model('alerts', AlertSchema);

module.exports = Alert;
