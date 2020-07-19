const mongoose = require('mongoose');

/*
{
	"_id" : ObjectId("5d6e76461e6b3b2020516662"),
	"login" : {
		"username" : "admin",
		"password" : "password123"
	},
	"hardware" : {
		"ip" : "192.1.13.223",
		"make" : "WBOX"
	},
	"status" : 1,
	"aiStats" : {
		"threshold" : 0.1,
		"precision" : 0.96,
		"recall" : 0.86
	},
	"plant" : "CORP",
	"camName" : "camera_192113223_CORP",
	"location" : "Biometrics Entry",
	"deploymentDetails" : [
		{
			"microserviceName" : "faceRecog",
			"usageType" : [
				0,
				1
			]
		}
	]
}
*/

const UsageTypeSchema = new mongoose.Schema({
  microserviceName: {
    type: String,
    required: true,
    default: "manpower"
  },
  usageType: {
    type: [Number] //0->exit 1->entry
  }
});

const CameraSchema = new mongoose.Schema({
  camName: {
    type: String,
    required: true
  },
  plant: {
    type: String,
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  iotDeviceIds: [{
    type: String
  }],
  mailingList : [{
    type: String
  }],
  location: {
    type: String,
    required: true
  },
  login:{
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  },
  hardware:{
    make: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      required: true
    },
    serverConn: {
      type: Number
    },
    hardwareNumber: {
      type: Number
    }
  },
  status: {
    type: Number,
    default: 0
  },
  fps: {
    type: Number,
    default: 2500
  },
  brokerIp: {
    type: String,
    default: "0.0.0.0"
  },
  usageType: {
    type: String,
    default: "fr"
  },
  IoTDevices: [{
    ip: {
      type: String
    },
    type: {
      type: String
    },
    usageType: {
      type: String
    }
  }],
  aiStats: {
    threshold: {
      type: Number,
      default: 0.8
    },
    precision: {
      type: Number,
      default: 0.8
    },
    recall: {
      type: Number,
      default: 0.8
    }
  },
  deploymentDetails:{
    type: [UsageTypeSchema],
    required: true
  }
}, {
  collection: 'cameras'
});

const Camera = mongoose.model('cameras', CameraSchema);

module.exports = Camera;
