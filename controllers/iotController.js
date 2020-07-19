var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

function getManpowerCameras() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("jbmDB");
      dbo.collection("cameras").find({}).toArray(function(err, result) {
        if (err) throw err;
        resolve(result);
        db.close();
      });
    });
  });
}

function getFRCameras() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("facialRecogntionDB");
      dbo.collection("cameras").find({}).toArray(function(err, result) {
        if (err) throw err;
        resolve(result);
        db.close();
      });
    });
  });
}

exports.infoFromHardware = async (req, res) => {
  console.log("PPPPPPARAMS", req.query)
}

exports.getdetail = async (req, res) => {
  let iotId = req.query.iotId;
  let companyId = req.query.companyId;
  let iotPassword = req.query.iotPassword;

  let mpCamera = await getManpowerCameras();
  let frCamera = await getFRCameras();

  let combinedArray = []

  //check from faceRecog DB
  for (var i = 0; i < frCamera.length; i++) {
    if (frCamera[i]['companyId'] == companyId) {
      if (frCamera[i]['iotDeviceIds']) {
        if (frCamera[i]['iotDeviceIds'].includes(iotId)) {
          console.log(frCamera[i])
          let tempObj2 = {}
          tempObj2['camId'] = frCamera[i]['camName']
          tempObj2['make'] = frCamera[i]['hardware']['make']
          let username = frCamera[i]['login']['username']
          let password = frCamera[i]['login']['password'].replace(/@/g, "%40");
          let ipAddr = frCamera[i]['hardware']['ip']
          tempObj2['companyId'] = frCamera[i]['companyId']
          console.log(tempObj2['make'], 'hikvision', typeof(tempObj2['make']), typeof('hikvision'), tempObj2['make'] == 'hikvision')
          if (tempObj2['make'] == 'hikvision') {
            tempObj2['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/Streaming/Channels/101"
          } else if (tempObj2['make'] == 'samsung') {
            tempObj2['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/onvif/profile2/media.smp"
          } else if (tempObj2['make'] == 'covert') {
            tempObj2['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/live/0/MAIN"
          } else if (tempObj2['make'] == 'wbox') {
            tempObj2['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/live/0/MAIN"
          } else if (tempObj2['make'] == 'cpplus') {
            tempObj2['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/cam/realmonitor?channel=1&subtype=0"
          } else {
            tempObj2['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/Streaming/Channels/101"
          }
          tempObj2['cameraType'] = frCamera[i]['deploymentDetails'][0]['microserviceName']
          if (tempObj2['cameraType'] == 'faceRecog') {
            tempObj2['kafkaTopic'] = 'video-stream-event'
            tempObj2['kafkaPartition'] = 0
            tempObj2['kafkaBrokerIP'] = '192.168.1.0'
            tempObj2['kafkaBrokerPort'] = '9092'
            tempObj2['delay'] = frCamera[i]['fps']
            tempObj2['height'] = "0.5"
            tempObj2['width'] = "0.5"
            tempObj2['bootstrapServer'] = "3.7.152.162:9092"
          }
          console.log("frrr", tempObj2)
          combinedArray.push(tempObj2)
        }
      }
    }
  }

  //check from manpowerDB
  for (var i = 0; i < mpCamera.length; i++) {
    if(mpCamera[i]['companyId'] == companyId) {
      if (mpCamera[i]['iotDeviceIds']) {
        if (mpCamera[i]['iotDeviceIds'].includes(iotId)) {
          let tempObj = {}
          tempObj['camId'] = mpCamera[i]['camName']
          tempObj['make'] = mpCamera[i]['hardware']['make']
          let username = mpCamera[i]['login']['username']
          let password = mpCamera[i]['login']['password'].replace(/@/g, "%40");
          let ipAddr = mpCamera[i]['hardware']['ip']
          let type = mpCamera[i]['hardware']['type']
          let channel = mpCamera[i]['hardware']['channel']
          tempObj['companyId'] = mpCamera[i]['companyId']
          // tempObj['companyId'] = "JBM Group"
          if (tempObj['make'] == 'hikvision') {
            if(type == "nvr") {
              tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/Streaming/Channels/101"
            } else if(type == "dvr") {
              tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/Streaming/Channels/" + channel + "01"
            }
          } else if (tempObj['make'] == 'samsung') {
            tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/onvif/profile2/media.smp"
          } else if (tempObj['make'] == 'covert') {
            tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/live/0/MAIN"
          } else if (tempObj['make'] == 'wbox') {
            tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/live/0/MAIN"
          } else if (tempObj['make'] == 'cpplus') {
            if(type == "nvr") {
              tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/cam/realmonitor?channel=1&subtype=0"
            } else if(type == "dvr") {
              tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/cam/realmonitor?channel=" + channel + "&subtype=0"
            }
          } else {
            tempObj['rtsp'] = "rtsp://" + username + ":" + password + "@" + ipAddr + ":554/Streaming/Channels/101"
          }
          tempObj['cameraType'] = mpCamera[i]['deploymentDetails'][0]['microserviceName']
          if (tempObj['cameraType'] == 'socialDistance') {
            tempObj['kafkaTopic'] = 'videoAcqJava'
            tempObj['kafkaPartition'] = 0
            tempObj['kafkaBrokerIP'] = '192.168.1.0'
            tempObj['kafkaBrokerPort'] = '9092'
            tempObj['delay'] = mpCamera[i]['fps']
            tempObj['height'] = "0.75"
            tempObj['width'] = "0.75"
            tempObj['bootstrapServer'] = "3.7.85.13:9092"
          }
          // console.log("mppp",tempObj)
          combinedArray.push(tempObj)
        }
      }
    }
  }

  let doc = {
    cameraArray: combinedArray
  }

  // doc = {
  //   cameraArray: [
  //     {
  //       camId: "camera_19211023_home3",
  //       rtsp: "rtsp://admin:Sahil12051994%40@192.168.1.64:554/Streaming/Channels/301",
  //       // rtsp: "0",
  //       make: "Hikvision",
  //       delay: 2000,
  //       cameraType: "socialDistance",
  //       kafkaTopic: "videoAcqJava",
  //       kafkaPartition: 0
  //     },
  //     {
  //       camId: "camera_19211023_home2",
  //       rtsp: "rtsp://admin:Sahil12051994%40@192.168.1.64:554/Streaming/Channels/201",
  //       make: "Hikvision",
  //       delay: 2000,
  //       cameraType: "socialDistance",
  //       kafkaTopic: "videoAcqJava",
  //       kafkaPartition: 0
  //     },
  //     {
  //       camId: "camera_19211023_home4",
  //       rtsp: "rtsp://admin:Sahil12051994%40@192.168.1.64:554/Streaming/Channels/401",
  //       make: "Hikvision",
  //       delay: 2000,
  //       cameraType: "socialDistance",
  //       kafkaTopic: "videoAcqJava",
  //       kafkaPartition: 0
  //     },
  //     {
  //       camId: "camera_19211023_home1",
  //       rtsp: "rtsp://admin:Sahil12051994%40@192.168.1.64:554/Streaming/Channels/101",
  //       make: "Hikvision",
  //       delay: 2000,
  //       cameraType: "socialDistance",
  //       kafkaTopic: "videoAcqJava",
  //       kafkaPartition: 0
  //     },
  //     // {
  //     //   camId: "webcam",
  //     //   rtsp: "0",
  //     //   make: "Hikvision",
  //     //   delay: 1000,
  //     //   cameraType: "faceRecog",
  //     //   kafkaTopic: "video-stream-event",
  //     //   kafkaPartition: 0
  //     // }
  //   ]
  // }

  return res.json(doc)
}
