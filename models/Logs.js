const mongoose = require('mongoose');

const LogsSchema = new mongoose.Schema({
  logType: {
    type: String,
    required: true
  },
  logFrom:{
    type: String,
    required: true
  },
  time: {
    type: Date,
    required: true
  },
  queueSize: {
    type: Number
  }
}, {
  collection: 'syslogs'
});

const Logs = mongoose.model('syslogs', LogsSchema);

module.exports = Logs;

/*
{
	"_id" : ObjectId("5eddf0116c4d34532a0c719b"),
	"queueSize" : 1,
	"time" : ISODate("2020-06-08T08:00:17.316Z"),
	"logFrom" : "server1",
	"logType" : "frAiEngine"
}
*/
