const Manpower = require('../models/PlannedManpower');
const Processed = require('../models/ProcessedFrames');
const Intelligence = require('../models/IntelligenceReport')
const CameraEfficiency = require('./cameraEff');
const Camera = require('../models/Camera');
const User = require('../models/User');
const Groups = require('../models/Groups');
const gifCreator = require('../utils/gifEncoder');
const cameraController = require('../controllers/camera');
const regression = require('regression');
const math = require('mathjs');
const moment = require('moment');
const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
// const getPixels = require('get-pixels')
// const GifEncoder = require('gif-encoder');

const url = require('url');
const fs = require('fs');
const path = require('path');
var base64Img = require('base64-img');
let {
  PythonShell
} = require('python-shell')
//http://195.134.76.37/applets/AppletSmooth/Appl_Smooth2.html
//https://en.wikipedia.org/wiki/Savitzky%E2%80%93Golay_filter
// const SG = require('ml-savitzky-golay');

//https://www.npmjs.com/package/timeseries-analysis
const timeseries = require("timeseries-analysis");

/*
db.processedFrames.createIndex( { time: -1 } )
db.processedFrames.getIndexes()
db.plannedManPower.find({"date" : ISODate("2019-03-24T00:00:00Z")}).pretty()
db.intelligenceData.find({"date" : ISODate("2019-03-23T00:00:00Z")}).pretty()
db.intelligenceData.deleteMany({"date" : ISODate("2019-03-24T00:00:00Z")})
sudo mongodump --db facialRecogntion --authenticationDatabase admin -u jbmTest3 -p jbm@234 --out /var/backups/mongobackups/`date +"%m-%d-%y"`
*/

// maps file extention to MIME types
const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.eot': 'appliaction/vnd.ms-fontobject',
  '.ttf': 'aplication/font-sfnt'
};

var ObjectId = (require('mongoose').Types.ObjectId);

var cameras_list_temp = [];
cameraController.getActiveCameras().then(function(value) {
  for (let index = 0; index < value.length; index++) {
    cameras_list_temp.push(value[index].camName)
  }
})

// function generateHourlyDayTimestamps(){
//   let time_stamps_array = []
//   for (var index = 0; index < 24; index++) {
//     time_stamps_array.push([("T00:00:00.000Z"),("T00:59:59.000Z")])
//   }
// }

let time_stamps = [
  ["T00:00:00.000Z", "T00:59:59.000Z"],
  ["T01:00:00.000Z", "T01:59:59.000Z"],
  ["T02:00:00.000Z", "T02:59:59.000Z"],
  ["T03:00:00.000Z", "T03:59:59.000Z"],
  ["T04:00:00.000Z", "T04:59:59.000Z"],
  ["T05:00:00.000Z", "T05:59:59.000Z"],
  ["T06:00:00.000Z", "T06:59:59.000Z"],
  ["T07:00:00.000Z", "T07:59:59.000Z"],
  ["T08:00:00.000Z", "T08:59:59.000Z"],
  ["T09:00:00.000Z", "T09:59:59.000Z"],
  ["T10:00:00.000Z", "T10:59:59.000Z"],
  ["T11:00:00.000Z", "T11:59:59.000Z"],
  ["T12:00:00.000Z", "T12:59:59.000Z"],
  ["T13:00:00.000Z", "T13:59:59.000Z"],
  ["T14:00:00.000Z", "T14:59:59.000Z"],
  ["T15:00:00.000Z", "T15:59:59.000Z"],
  ["T16:00:00.000Z", "T16:59:59.000Z"],
  ["T17:00:00.000Z", "T17:59:59.000Z"],
  ["T18:00:00.000Z", "T18:59:59.000Z"],
  ["T19:00:00.000Z", "T19:59:59.000Z"],
  ["T20:00:00.000Z", "T20:59:59.000Z"],
  ["T21:00:00.000Z", "T21:59:59.000Z"],
  ["T22:00:00.000Z", "T22:59:59.000Z"],
  ["T23:00:00.000Z", "T23:59:59.000Z"]
]

function cameraEfficiencyReports(data) {
  let hourly_cam_eff = []
  return new Promise((resolve, reject) => {
    let requests = time_stamps.map((item) => {
      return new Promise((resolve, reject) => {
        let startTime = data['start_time'].split("T")[0] + item[0]
        let endTime = data['end_time'].split("T")[0] + item[1]
        let camID = data['camId']
        return CameraEfficiency.getEfficiencySpan({
          'start_time': startTime,
          'end_time': endTime,
          'camId': camID
        }).then(function(value) {
          // console.log("frames: ", value.number_of_frames)
          resolve(hourly_cam_eff.push({
            hour: item[0].split("T")[1].split(".")[0],
            efficiency: value.efficiency,
            frames_computed: value.number_of_frames
          }));
        })
      });
    })
    Promise.all(requests).then(() => {
      resolve(hourly_cam_eff)
    }).catch(err => {
      console.log("unable to resolve cameraEfficiencyReports", err);
    });
  })
}

exports.manpower = (req, res) => {
  let data_out = {}

  let aggPipeline = [];
  aggPipeline.push({
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "plant"
    }
  }, {
    $unwind: '$plant'
  }, {
    $project: {
      plant: '$plant.plant',
      data: 1,
      date: 1,
      upload: 1,
      comments: 1,
      modified: 1,
      camId: 1
    }
  });

  let matchObject = {}
  if (req.query.startDate && req.query.endDate) {
    matchObject['date'] = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    }
  } else if (req.query.startDate) {
    matchObject['date'] = new Date(req.query.startDate)
  }
  if (req.query.camId) {
    matchObject['camId'] = req.query.camId
  }
  if (req.query.plant) {
    matchObject["plant"] = req.query.plant
  }

  aggPipeline.push({
    $match: matchObject
  });

  let query = Manpower.aggregate(aggPipeline).exec();

  query.then(function(doc) {
    User.populate(doc, [{
        path: "upload.userId"
      },
      {
        path: "comments.userId"
      }
    ], function(err, manpower) {
      if (err) {
        console.log("error - ", err)
      }
      console.log(manpower)
      data_out["total_planned_data"] = manpower;
      data_out["camera_count"] = manpower.length;
      data_out["total_workers_count"] = 0;
      for (var i = 0; i < manpower.length; i++) {
        var per_camera_data = manpower[i].data;
        var camera_data = [];
        var lunch_break = 0;
        for (j = 0; j < per_camera_data.length; j++) {
          camera_data.push(per_camera_data[j]["planned_manpower"]);
        }
        var camera_data = camera_data.filter(function(value, index, arr) {
          return value > 0;
        });
        data_out["total_workers_count"] = data_out["total_workers_count"] + (camera_data == 0 ? 0 : math.mean(camera_data));
      }
      data_out["total_workers_count"] = math.floor(data_out["total_workers_count"])
      data_out["all_cameras"] = cameras_list_temp;
      // data_out["userId"] = req.session.passport.user;
      return res.json(data_out)
    });
  }).catch(err => {
    console.log("unable to resolve manpower query", err);
  });
};

exports.cameraStats = (req, res) => {
  // console.log("camstat api", moment().subtract(600, 'seconds').format().split("+")[0] + 'Z')
  let aggPipeline = [];
  aggPipeline.push({
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "plant"
    }
  }, {
    $unwind: '$plant'
  }, {
    $project: {
      plant: '$plant.plant',
      bboxes: 1,
      time: 1,
      path: 1,
      camId: 1
    }
  })
  let matchObject = {}
  matchObject['time'] = {
    $gte: new Date(moment().subtract(3000, 'seconds').format().split("+")[0] + 'Z')
  }
  if (req.query.camId) {
    matchObject['camId'] = req.query.camId
  }
  if (req.query.plant) {
    matchObject["plant"] = req.query.plant
  }

  aggPipeline.push({
    $match: matchObject
  });

  aggPipeline.push({
    $group: {
      _id: "$camId",
      count: {
        $sum: 1
      }
    }
  })

  aggPipeline.push({
    $sort: {
      count: -1
    }
  })

  let query = Processed.aggregate(aggPipeline).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to resolve cameraStats", err);
  });
}

exports.processedStats = (req, res) => {
  let aggPipeline = [];
  aggPipeline.push({
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "plant"
    }
  }, {
    $unwind: '$plant'
  }, {
    $project: {
      plant: '$plant.plant',
      bboxes: 1,
      time: 1,
      path: 1,
      camId: 1,
      camIdRef: 1
    }
  })

  let matchObject = {
    $match: {}
  }
  if (req.query.camId) {
    matchObject["$match"]["camId"] = req.query.camId;
  }
  if (req.query.start && req.query.end) {
    matchObject["$match"]["time"] = {
      $gte: new Date(req.query.start),
      $lte: new Date(req.query.end)
    }
  }
  if (req.query.plant) {
    matchObject["$match"]["plant"] = req.query.plant;
  }
  aggPipeline.push(matchObject);

  let projectObject = {
    $project: {
      camId: 1,
      plant: 1,
      time: 1,
      camIdRef: 1,
      people_detected: {
        $cond: {
          if: {
            $isArray: "$bboxes"
          },
          then: {
            $size: "$bboxes"
          },
          else: 0
        }
      }
    }
  }
  aggPipeline.push(projectObject);

  let query = Processed.aggregate(aggPipeline).exec();

  query.then(function(doc) {
    Camera.populate(doc, {
      path: "camIdRef"
    }, function(err, populatedFrames) {
      if (err) {
        console.log("error - ", err)
      }
      return res.json(populatedFrames)
    });
  }).catch(err => {
    console.log("unable to resolve processedStats", err);
  });
};

exports.getGif = (req, res) => {
  try {
    let pathname = "/home/hercules/ext2tb/IntelligenceReportData/" + req.query.link;
    fs.exists(pathname, function(exist) {
      if (!exist) {
        // if the file is not found, return 404
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }

      // read file from file system
      fs.readFile(pathname, function(err, data) {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          // based on the URL path, extract the file extention. e.g. .js, .doc, ...
          const ext = path.parse(pathname).ext;
          // if the file is found, set Content-type and send data
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    });
  } catch (err) {
    console.log(err)
  }
};

exports.getMask = (req, res) => {
  try {
    let pathname = "/home/hercules/aiProject/dashboard/JBM_Dashboard/utils/masks/filtered_roi/" + req.query.camId + ".png";
    console.log(pathname)
    fs.exists(pathname, function(exist) {
      if (!exist) {
        // if the file is not found, return 404
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }

      // read file from file system
      fs.readFile(pathname, function(err, data) {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          // based on the URL path, extract the file extention. e.g. .js, .doc, ...
          const ext = path.parse(pathname).ext;
          // if the file is found, set Content-type and send data
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    });
  } catch (err) {
    console.log(err)
  }
}

exports.updateMask = (req, res) => {
  try {
    // console.log("asdas",req.body)
    let path = '/home/hercules/Code_files/masks_cameras/filtered/req.body.camId'
    base64Img.img(req.body.base64Img, '/home/hercules/Code_files/masks_cameras/filtered', req.body.camId, function(err, filepath) {
      console.log("Success")
      let options = {
        mode: 'text',
        pythonPath: '/home/hercules/anaconda3/bin/python',
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: './pythonScripts/',
        args: []
      };
      PythonShell.run('maskingConv.py', options, function(err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
        return res.json({
          status: 1
        });
      });
      // return res.json({status: 1});
    });
  } catch (err) {
    console.log(err)
  }
}

exports.updateFrameInfo = (req, res) => {
  try {
    let frameId = req.params.id
    let matchObject = {
      _id: ObjectId(frameId)
    }

    let updateObject = {}
    if(req.body.aiInfo) updateObject['aiInfo'] = req.body.aiInfo

    console.log(matchObject, updateObject)
    var query = Processed.updateOne(matchObject, updateObject).exec();
    query.then(function(doc) {
      return res.json(doc)
    });
  } catch (err) {
    console.log(err)
  }
}

exports.getFrame = (req, res) => {
  let data_out = {};
  // console.log(new Date(req.query.time), req.query.camId)
  let aggPipeline = []

  let matchObject = {
    $match: {
      time: new Date(req.query.time),
      camId: req.query.camId
    }
  }
  aggPipeline.push(matchObject);

  if (req.query.random) {
    if (req.query.random == 1) {
      aggPipeline = []
      matchObject['$match'] = {}
      matchObject['$match'] = {
        camId: req.query.camId
      }
      aggPipeline.push(matchObject);
      aggPipeline.push({
        $sort: {
          time: -1
        }
      });
      aggPipeline.push({
        $limit: 1
      })
    }
  }

  let projectObject = {
    $project: {
      camId: 1,
      filepath: {
        $concat: ["$path", "/", "$fileName"]
      },
      time: 1,
      _id: 0,
      aiInfo:1,
      people_detected: {
        $cond: {
          if: {
            $isArray: "$bboxes"
          },
          then: {
            $size: "$bboxes"
          },
          else: 0
        }
      }
    }
  }

  if (req.query.onlyData) {
    if (req.query.onlyData == 1) {
      projectObject['$project'] = {
        bboxes: 1,
        aiInfo:1
      }
    }
  }

  aggPipeline.push(projectObject);

  Processed.aggregate(aggPipeline,
    (err, processed) => {
      if (err) {
        return next(err);
      }
      //as this will always return only 1 object in array
      // data_out["image_detail"] = processed[0];
      // let pathname = data_out["image_detail"].filepath;
      // let pathname = "/home/jbmai/VideoAnalyticsImageData/2019-03-06/camera_225/13:13:14.jpg"
      try {
        data_out["image_detail"] = processed[0];
        let pathname = data_out["image_detail"].filepath;
        if (req.query.onlyData) {
          if (req.query.onlyData == 1) {
            res.json(processed);
            return;
          }
        }
        fs.exists(pathname, function(exist) {
          if (!exist) {
            // if the file is not found, return 404
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
          }

          // read file from file system
          fs.readFile(pathname, function(err, data) {
            if (err) {
              res.statusCode = 500;
              res.end(`Error getting the file: ${err}.`);
            } else {
              // based on the URL path, extract the file extention. e.g. .js, .doc, ...
              const ext = path.parse(pathname).ext;
              // if the file is found, set Content-type and send data
              res.setHeader('Content-type', mimeType[ext] || 'text/plain');
              res.end(data);
            }
          });
        });
      } catch (err) {
        console.log(err)
      }
    });
}

function diff_hours(dt2, dt1) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return Math.abs(Math.round(diff));
}

function historyCumulatedData(doc) {

  let output_object = {}
  output_object['stats_object_array'] = []

  let extra_break_mins_reg_data = []
  let extra_shift_mins_reg_data = []
  let zero_mins_reg_data = []
  for (var index = 0; index < doc.length; index++) {
    let stats_per_day = {}
    stats_per_day['date'] = doc[index]['date']
    stats_per_day['total_extra_break'] = 0;
    if (doc[index]['break_analysis']) {
      if (doc[index]['break_analysis']['extra_break_mins']) {
        stats_per_day['total_extra_break'] = doc[index]['break_analysis']['extra_break_mins']
      }
    }
    extra_break_mins_reg_data.push([index, stats_per_day['total_extra_break']])

    stats_per_day['total_extra_shift'] = 0;
    if (doc[index]['shift_analysis']) {
      if (doc[index]['shift_analysis']['shift_time_array']) {
        let shift_array = doc[index]['shift_analysis']['shift_time_array'];
        for (var shiftIndex = 0; shiftIndex < shift_array.length; shiftIndex++) {
          stats_per_day['total_extra_shift'] = stats_per_day['total_extra_shift'] + shift_array[shiftIndex]['extra_time_after_shift']
        }
      }
    }
    extra_shift_mins_reg_data.push([index, stats_per_day['total_extra_shift']])

    stats_per_day['total_zero_workforce'] = 0
    if (doc[index]['break_analysis']) {
      if (doc[index]['break_analysis']['zero_workforce']) {
        let zero_workforce_array = doc[index]['break_analysis']['zero_workforce'];
        for (var shiftIndex = 0; shiftIndex < zero_workforce_array.length; shiftIndex++) {
          stats_per_day['total_zero_workforce'] = stats_per_day['total_zero_workforce'] + (((new Date(zero_workforce_array[shiftIndex]['end_time']) - new Date(zero_workforce_array[shiftIndex]['start_time'])) / 1000) / 60)
        }
      }
    }
    zero_mins_reg_data.push([index, stats_per_day['total_zero_workforce']])

    output_object['stats_object_array'].push(stats_per_day)
  }
  const break_line = regression.linear(extra_break_mins_reg_data);
  const shift_line = regression.linear(extra_shift_mins_reg_data);
  const zero_line = regression.linear(zero_mins_reg_data);
  if (extra_break_mins_reg_data != undefined) {
    if (extra_break_mins_reg_data[0] != undefined) {
      if (extra_break_mins_reg_data[0][0] != undefined) {
        output_object['break_regression'] = [
          [extra_break_mins_reg_data[0][0], getYfromXregression(break_line.equation[0], break_line.equation[1], extra_break_mins_reg_data[0][0])],
          [extra_break_mins_reg_data[extra_break_mins_reg_data.length - 1][0], getYfromXregression(break_line.equation[0], break_line.equation[1], extra_break_mins_reg_data[extra_break_mins_reg_data.length - 1][0])]
        ]
      }
    }
  }
  if (extra_shift_mins_reg_data != undefined) {
    if (extra_shift_mins_reg_data[0] != undefined) {
      if (extra_shift_mins_reg_data[0][0] != undefined) {
        output_object['shift_regression'] = [
          [extra_shift_mins_reg_data[0][0], getYfromXregression(shift_line.equation[0], shift_line.equation[1], extra_shift_mins_reg_data[0][0])],
          [extra_shift_mins_reg_data[extra_shift_mins_reg_data.length - 1][0], getYfromXregression(shift_line.equation[0], shift_line.equation[1], extra_shift_mins_reg_data[extra_shift_mins_reg_data.length - 1][0])]
        ]
      }
    }
  }
  if (zero_mins_reg_data != undefined) {
    if (zero_mins_reg_data[0] != undefined) {
      if (zero_mins_reg_data[0][0] != undefined) {
        output_object['zero_manpower_regression'] = [
          [zero_mins_reg_data[0][0], getYfromXregression(zero_line.equation[0], zero_line.equation[1], zero_mins_reg_data[0][0])],
          [zero_mins_reg_data[zero_mins_reg_data.length - 1][0], getYfromXregression(zero_line.equation[0], zero_line.equation[1], zero_mins_reg_data[zero_mins_reg_data.length - 1][0])]
        ]
      }
    }
  }
  console.log(output_object)
  return output_object;
}

function getYfromXregression(grad, yInter, x) {
  return (x * grad) + yInter;
}

function returnCombinedIntervals(value) {
  return new Promise((resolve, reject) => {
    let newIntervals = []
    for (let index = 0; index < value.length - 1; index++) {
      console.log("compare dates", new Date(value[index]['end_time']).getTime(), new Date(value[index + 1]['start_time']).getTime())
      if (new Date(value[index]['end_time']).getTime() >= new Date(value[index + 1]['start_time']).getTime()) {
        console.log("Insidee")
        value[index]['end_time'] = value[index + 1]['end_time'];
        // newIntervals.push(value[index]);
        value.splice(index + 1, 1);
        index = 0;
        // break;
      }
    }
    resolve(value)
  })
}

function checkIfThisTimeIntervalHasBreak(startCustom, endCustom, data) {
  return new Promise((resolve, reject) => {
    let query = Manpower.aggregate([{
      $match: {
        camId: data['camId'],
        date: new Date(data['start_time'])
      }
    }, {
      $sort: {
        date: 1
      }
    }, {
      $project: {
        _id: 0,
        data: {
          $filter: {
            input: "$data",
            as: "plan",
            cond: {
              $eq: ["$$plan.planned_manpower", 0]
            }
          }
        }
      }
    }]).exec();
    query.then(function(doc) {
      if (doc[0]) {
        if (doc[0]['data']) {
          let value = doc[0]['data'];
          // console.log("0 Planned Initially: ",value.length, value)
          returnCombinedIntervals(value).then(function(value) {
            // console.log("0 Planned After: ",value.length, value)
            let clearTillEnd = 1;
            for (let index = 0; index < value.length; index++) {
              // console.log("start", value[index]['start_time'],new Date(value[index]['start_time']), startCustom)
              // console.log("end", value[index]['end_time'],new Date(value[index]['end_time']), endCustom)
              // console.log("1st condn : ", (new Date(value[index]['start_time']) > new Date(startCustom)) && (new Date(value[index]['end_time']) < new Date(endCustom)))
              // console.log("2nd condn: ", (new Date(value[index]['start_time']) < new Date(startCustom)) && (new Date(value[index]['end_time']) < new Date(endCustom)) && ((new Date(value[index]['start_time']) < new Date(startCustom)) && (new Date(startCustom) < new Date(value[index]['end_time']))))
              // console.log("3rd condn: ", (new Date(value[index]['start_time']) > new Date(startCustom)) && (new Date(value[index]['end_time']) > new Date(endCustom)) && ((new Date(value[index]['start_time']) < new Date(endCustom)) && (new Date(endCustom) < new Date(value[index]['end_time']))))
              if (
                (new Date(value[index]['start_time']) > new Date(startCustom)) && (new Date(value[index]['end_time']) < new Date(endCustom)) ||
                (new Date(value[index]['start_time']) < new Date(startCustom)) && (new Date(value[index]['end_time']) < new Date(endCustom)) && ((new Date(value[index]['start_time']) < new Date(startCustom)) && (new Date(startCustom) < new Date(value[index]['end_time']))) ||
                (new Date(value[index]['start_time']) > new Date(startCustom)) && (new Date(value[index]['end_time']) > new Date(endCustom)) && ((new Date(value[index]['start_time']) < new Date(endCustom)) && (new Date(endCustom) < new Date(value[index]['end_time'])))
              ) {
                let customTimeSpan = new Date(endCustom) - new Date(startCustom);
                let breakTimeSpan = new Date(value[index]['end_time']) - new Date(value[index]['start_time']);
                // console.log("Custom time span: ",customTimeSpan/100/60, "\tBreak time span:" ,breakTimeSpan/1000/60)
                // console.log("Diff Minutes: ", (((customTimeSpan - breakTimeSpan) / 1000) / 60))
                if ((((customTimeSpan - breakTimeSpan) / 1000) / 60) < 10) {
                  console.log("False small interval")
                  clearTillEnd = clearTillEnd * 0;
                } else {
                  console.log("Truee large interval")
                  clearTillEnd = clearTillEnd * 1;
                }
              } else if ((new Date(value[index]['start_time']) < new Date(startCustom)) && (new Date(value[index]['end_time']) > new Date(endCustom))) {
                console.log("False interval inside 0 planned")
                clearTillEnd = clearTillEnd * 0;
              } else {
                console.log("Truee no issue")
                clearTillEnd = clearTillEnd * 1;
              }
            }
            resolve(clearTillEnd);
          }).catch(err => {
            console.log("unable to resolve returnCombinedIntervals", err);
            reject(new Error('False'))
          })
        } else {
          reject(new Error('False'))
        }
      } else {
        reject(new Error('False'))
      }
    }).catch(err => {
      console.log("unable to fetch checkIfThisTimeIntervalHasBreak", err);
      reject(new Error('False'))
    });
  }).catch(err => {
    console.log("unable to resolve checkIfThisTimeIntervalHasBreak", err);
    reject(new Error('False'));
  });
}

function findZeroPeronsTimeStamps(data) {
  return new Promise((resolve, reject) => {
    console.log("zeroperson analysis started")
    findZeroPeronsFrame(data).then(function(result) {
      zeroPersonTimegaps = []
      zeroPersonTimeStamps = []
      let start_time, end_time;
      let noOfFramesForMode = 15

      let modeDataLine = []
      if (result.length > noOfFramesForMode) {
        for (let index = 0; index < result.length - noOfFramesForMode; index++) {
          //30 because of 5 minute window
          let modeValueArray = []
          for (let inc = 0; inc < noOfFramesForMode; inc++) {
            modeValueArray.push(result[index + inc].people_detected)
          }
          let mode = math.mode(modeValueArray)
          modeDataLine.push({
            mode: mode.length == 1 ? mode[0] : Math.max.apply(null, mode),
            time: result[index].time
          })
        }
      }

      let goAhead = true;
      // for(let index=0; index < modeDataLine.length -2; index++){
      //   // console.log(modeDataLine[index].mode, modeDataLine[index].time, modeDataLine[index+1].mode, modeDataLine[index+2].mode)
      //   if(goAhead == true && modeDataLine[index].mode == 0 && modeDataLine[index+1].mode == 0 && modeDataLine[index+2].mode == 0){
      //     start_time = modeDataLine[index].time;
      //     goAhead = false;
      //   } else if (goAhead == false && modeDataLine[index].mode == 0 && modeDataLine[index+1].mode != 0) {
      //     end_time = modeDataLine[index].time
      //     goAhead = true;
      //     if(Math.floor((new Date(end_time) - new Date(start_time)) /1000 /60) > 10){
      //       gifCreator.createGifOfTimeInterval(start_time, end_time, data['camId']).then(function(link){
      //         console.log("gif created link", link)
      //         zeroPersonTimeStamps.push({
      //           'start_time': start_time,
      //           'end_time': end_time,
      //           'link': link
      //         })
      //         Promise.resolve()
      //       })
      //     }
      //   }
      //   if(index == modeDataLine.length -2){
      //     Promise.resolve(zeroPersonTimeStamps)
      //   }
      // }

      //compute array in sequence
      let indexCount = 0;
      let requests = modeDataLine.reduce((promiseChain, item) => {
        return promiseChain.then(() => new Promise((resolve) => {
          // console.log("Index of frame- ", indexCount,item)
          if (indexCount < modeDataLine.length - 2) {
            if (goAhead == true && modeDataLine[indexCount].mode == 0 && modeDataLine[indexCount + 1].mode == 0 && modeDataLine[indexCount + 2].mode == 0) {
              start_time = modeDataLine[indexCount].time;
              goAhead = false;
              // console.log("inside if")
              resolve()
            } else if (goAhead == false && modeDataLine[indexCount].mode == 0 && modeDataLine[indexCount + 1].mode != 0) {
              end_time = modeDataLine[indexCount].time
              goAhead = true;
              // console.log("inside else")
              if (Math.floor((new Date(end_time) - new Date(start_time)) / 1000 / 60) > 10) {
                checkIfThisTimeIntervalHasBreak(start_time, end_time, data).then(function(result, err) {
                  console.log("Will generate gif or not", result)
                  if (result) {
                    gifCreator.createGifOfTimeInterval(start_time, end_time, data['camId']).then(function(link) {
                      console.log("GIF Actually finished", link)
                      zeroPersonTimeStamps.push({
                        'start_time': start_time,
                        'end_time': end_time,
                        'link': link
                      });
                      resolve();
                    }).catch(err => {
                      console.log("unable to resolve createGifOfTimeInterval", err);
                    });
                    // zeroPersonTimeStamps.push({
                    //   'start_time': start_time,
                    //   'end_time': end_time,
                    // })
                    // resolve()
                  } else {
                    resolve()
                  }
                }).catch(err => {
                  console.log("unable to resolve checkIfThisTimeIntervalHasBreak promise", err);
                  resolve()
                });
              } else {
                resolve()
              }
            } else {
              resolve()
            }
          } else {
            resolve()
          }
          indexCount++;
        }));
      }, Promise.resolve());

      requests.then(() => {
        console.log("before resolving", zeroPersonTimeStamps)
        if (zeroPersonTimeStamps.length > 0) {
          console.log('Done computing the zeromanpower reports')
          resolve(zeroPersonTimeStamps)
        } else {
          reject(new Error('False'));
        }
      }).catch(err => {
        console.log("unable to resolve findZeroPeronsTimeStamps", err);
        reject(new Error('False'));
      });
    }).catch(err => {
      console.log("unable to resolve findZeroPeronsFrame", err);
      reject(new Error('False'));
    });
  }).catch(err => {
    console.log("unable to resolve zeromanpower calculation promise", err);
    reject(new Error('False'));
  });
}

exports.computeIntelligenceReports = (data) => {
  /*
    findZeroPeronsFrame -> find frames with 0 persons in them
    breakTimeEvaluation -> break time analysis
    CameraEfficiency.getEfficiencySpan -> get efficiency value
    cameraEfficiencyReports -> hourly efficiency calculation
  */
  return (Promise.all([breakTimeEvaluation(data), CameraEfficiency.getEfficiencySpan(data), cameraEfficiencyReports(data), findZeroPeronsTimeStamps(data), evaluateShiftChange(data)]).then(function(values) {
    let breakData = values[0];
    let efficiency = values[1].efficiency;
    let data_out = {}
    console.log(values)
    data_out['camId'] = data['camId']
    data_out['camIdRef'] = data['camMongoId']
    data_out['date'] = data['start_time']
    data_out['efficiency'] = {}
    data_out['efficiency']['total'] = efficiency
    data_out['efficiency']['hourly'] = values[2];
    data_out['break_analysis'] = {}
    if (breakData) {
      data_out['break_analysis']['break_intervals'] = breakData['breaks']
      data_out['break_analysis']['total_break_mins'] = breakData['total_stats']['total_break_mins']
      data_out['break_analysis']['extra_break_mins'] = breakData['total_stats']['extra_break_mins']
    }
    data_out['break_analysis']['zero_workforce'] = values[3];
    data_out['shift_analysis'] = {}
    data_out['shift_analysis']['shift_time_array'] = values[4];
    console.log(data_out)
    let intelligenceData = new Intelligence(data_out)
    intelligenceData.save().then(item => {
      console.log("item saved to database", item._id);
    }).catch(err => {
      console.log("unable to save to database", err);
    });
  })).catch(err => {
    console.log("unable to resolve promise on whole computation", err);
  })
}

function findZeroPeronsFrame(data) {
  return new Promise((resolve, reject) => {

    var query = Processed.aggregate([{
        $match: {
          time: {
            $gte: new Date(data['start_time']),
            $lte: new Date(data['end_time'])
          },
          camId: data['camId']
          // bboxes: {
          //   "$exists": false
          // }
        }
      },
      {
        $sort: {
          time: 1
        }
      },
      {
        $project: {
          camId: 1,
          time: 1,
          _id: 0,
          people_detected: {
            $cond: {
              if: {
                $isArray: "$bboxes"
              },
              then: {
                $size: "$bboxes"
              },
              else: 0
            }
          },
          filepath: {
            $concat: ["$path", "/", "$fileName"]
          }
        }
      }
    ]).exec();
    query.then(function(doc) {
      resolve(doc)
    }).catch(err => {
      console.log("unable to resolve zeroperson frame promises", err);
    });
  });
}

function breakTimeEvaluation(data) {
  data_break_time = {}
  return new Promise((resolve, reject) => {
    var promises = [
      Manpower.aggregate([{
        $match: {
          camId: data['camId'],
          date: new Date(data['start_time'])
        }
      }, {
        $project: {
          _id: 0,
          data: {
            $filter: {
              input: "$data",
              as: "plan",
              cond: {
                $eq: ["$$plan.Type", 1]
              }
            }
          }
        }
      }]).exec(),
      Processed.aggregate([{
          $match: {
            time: {
              $gte: new Date(data['start_time']),
              $lte: new Date(data['end_time'])
            },
            camId: data['camId']
          }
        },
        {
          $project: {
            camId: 1,
            time: 1,
            _id: 0,
            people_detected: {
              $cond: {
                if: {
                  $isArray: "$bboxes"
                },
                then: {
                  $size: "$bboxes"
                },
                else: 0
              }
            }
          }
        }
      ]).exec()
    ];

    Promise.all(promises).then(function(values) {
      // console.log("Break Time Query :",values)
      if (values) {
        // console.log("values : ",values)
        if (values[0]) {
          if (values[0][0]) {
            if (values[0][0]['data']) {
              data_break_time['breakTimings'] = values[0][0]['data'];
              // console.log("data[0][0] ; ", data_break_time)
            } else {
              // console.log("Inside else 1")
              resolve()
            }
          } else {
            // console.log("Inside else 2")
            resolve()
          }
        } else {
          // console.log("Inside else 3")
          resolve()
        }
        if (values[1]) {
          data_break_time['processedStats'] = values[1]
          // console.log("Values 2 :", data_break_time)
        } else {
          // console.log("inside else 4")
          resolve()
        }
        if ((values[1].length > 0) && (values[0].length > 0)) {
          console.log("Breaktime and processed frames processed")
          resolve(evaluateBreakMetrics(data_break_time))
        }
      } else {
        // console.log("inside else 5")
        resolve()
      }
    }).catch(err => {
      console.log("unable to resolve Breaktime analysis function promise", err);
    })
  })
}

exports.intelligenceReportUpdate = (req, res) => {

  let matchObject = {}

  if (req.params.id) {
    matchObject["_id"] = ObjectId(req.params.id);
  }

  let updateObject = {}

  if (req.body.zeroWorkforce) {
    if (req.body.zeroWorkforce.arrayElem) {
      if (req.body.zeroWorkforce.arrayElem.mId) {
        matchObject["break_analysis.zero_workforce._id"] = ObjectId(req.body.zeroWorkforce.arrayElem.mId);
        updateObject["$set"] = {
          "break_analysis.zero_workforce.$.comments": req.body.zeroWorkforce.arrayElem.comment
        }
      }
    }
    if (req.body.zeroWorkforce.overallComment) {
      updateObject["$set"] = {
        "break_analysis.zero_overall_comments": req.body.zeroWorkforce.overallComment
      }
    }
  }

  if (req.body.breakWorkforce) {
    if (req.body.breakWorkforce.overallComment) {
      updateObject["$set"] = {
        "break_analysis.break_overall_comments": req.body.breakWorkforce.overallComment
      }
    }
  }

  if (req.body.shiftWorkforce) {
    if (req.body.shiftWorkforce.arrayElem) {
      if (req.body.shiftWorkforce.arrayElem.mId) {
        matchObject["shift_analysis.shift_time_array._id"] = ObjectId(req.body.shiftWorkforce.arrayElem.mId);
        updateObject["$set"] = {
          "shift_analysis.shift_time_array.$.comments": req.body.shiftWorkforce.arrayElem.comment
        }
      }
    }
    if (req.body.shiftWorkforce.overallComment) {
      updateObject["$set"] = {
        "shift_analysis.shift_overall_comments": req.body.shiftWorkforce.overallComment
      }
    }
  }

  console.log(matchObject, updateObject)
  var query = Intelligence.updateOne(matchObject, updateObject).exec();
  query.then(function(doc) {
    return res.json(doc)
  });
}

exports.evalBreaks = (req, res) => {
  let pipelineArray = []

  pipelineArray.push({
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "plant"
    }
  }, {
    $unwind: '$plant'
  }, {
    $project: {
      plant: '$plant.plant',
      zero_workforce: 1,
      extra_break_mins: 1,
      total_break_mins: 1,
      break_analysis: 1,
      date: 1,
      camIdRef: 1,
      camId: 1,
      efficiency: 1,
      shift_analysis: 1
    }
  })

  let matchObject = {}
  if (req.query.camId) {
    let camIdFormed = req.query.camId
    matchObject["camId"] = camIdFormed
    // matchObject["camId"] = "camera_192110221_N-5"
  }
  if (req.query.date) {
    matchObject["date"] = new Date(req.query.date)
  } else if (req.query.gtdate && req.query.ltdate) {
    matchObject["date"] = {
      "$gte": new Date(req.query.gtdate),
      "$lte": new Date(req.query.ltdate)
    }
  }

  if (req.query.plant) {
    matchObject["plant"] = req.query.plant
  }
  pipelineArray.push({
    $match: matchObject
  })

  let unwindObject = {
    $unwind: '$plant'
  }
  pipelineArray.push(unwindObject)

  let projectObject = {
    $project: {
      plant: 1,
      zero_workforce: 1,
      extra_break_mins: 1,
      total_break_mins: 1,
      break_analysis: 1,
      date: 1,
      camIdRef: 1,
      camId: 1,
      efficiency: 1,
      shift_analysis: 1
    }
  }
  pipelineArray.push(projectObject)

  var query = Intelligence.aggregate(pipelineArray).exec();
  query.then(function(doc) {
    Camera.populate(doc, {
      path: "camIdRef"
    }, function(err, populatedFrames) {
      if (err) {
        console.log("error - ", err)
      }

      if(req.query.group) {
        let aggPipelineGroups = []
        let matchObjectGroups = {}
        if(req.query.group != "all") {
          matchObjectGroups['groupName'] = req.query.group
        }

        aggPipelineGroups.push({
          $match: matchObjectGroups
        })

        var grpQuery = Groups.aggregate(aggPipelineGroups).exec();
        grpQuery.then(function(groups) {
          for (var gIndex = 0; gIndex < groups.length; gIndex++) {
            for (var dIndex = 0; dIndex < doc.length; dIndex++) {
              if(groups[gIndex].groupMembers) {
                for (var gmIndex = 0; gmIndex < groups[gIndex].groupMembers.length; gmIndex++) {
                  if(groups[gIndex].groupMembers[gmIndex] == doc[dIndex].camId) {
                    doc[dIndex]['group'] = groups[gIndex].groupName
                  }
                }
              }
            }
          }
          try {
            doc = doc.filter(obj => Object.keys(obj).includes("group"));
            return res.json(doc)
          } catch (err) {
            console.log(err)
          }
        });
      } else {
        if (req.query.histStats) {
          let stats = historyCumulatedData(doc);
          return res.json(stats);
        } else {
          return res.json(doc)
        }
      }
    });
  });
}

function addMinsToDateObj(dateObj, mins) {
  var dt = dateObj
  dt.setMinutes(dt.getMinutes() + mins);
  return dt;
}

function subMinsToDateObj(dateObj, mins) {
  var dt = dateObj
  dt.setMinutes(dt.getMinutes() - mins);
  return dt;
}

function signalSmoothing() {
  return (new Promise((resolve, reject) => {
    //savitzky-golay algorithm
    // var data = [0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1];
    // var options = {
    //   derivative: 1
    // };
    // var ans = SG(data, 1, options);
    // // console.log(ans); // smoothed data
    // resolve(ans)

    var query = Processed.aggregate([{
        $match: {
          time: {
            $gte: new Date('2019-03-19T00:00:00.000Z'),
            $lte: new Date('2019-03-19T23:59:00.000Z')
          },
          camId: "camera_80"
        }
      },
      {
        $project: {
          camId: 1,
          time: 1,
          _id: 0,
          people_detected: {
            $cond: {
              if: {
                $isArray: "$bboxes"
              },
              then: {
                $size: "$bboxes"
              },
              else: 0
            }
          }
        }
      }
    ]).exec();
    query.then(function(doc) {
      //time-series npm
      var t = new timeseries.main(timeseries.adapter.fromDB(doc, {
        date: 'time', // Name of the property containing the Date (must be compatible with new Date(date) )
        value: 'people_detected' // Name of the property containign the value. here we'll use the "people_detected".
      }));
      var processed = t.ma({
        period: 6
      }).smoother({
        period: 10
      }).output();
      var cleanedArray = []
      for (datapoint = 0; datapoint < processed.length - 3; datapoint++) {
        if (datapoint != processed.length - 4) {
          // if(Math.floor(processed[datapoint][1]) == Math.floor(processed[datapoint+1][1]) && Math.floor(processed[datapoint][1]) == Math.floor(processed[datapoint+2][1]) && Math.floor(processed[datapoint][1]) == Math.floor(processed[datapoint+3][1])){
          //   cleanedArray.push([processed[datapoint][0].toISOString(),Math.floor(processed[datapoint][1]])
          // }
        }
      }
      resolve(processed)
    });
  }));
}

function evaluateShiftChange(data) {

  return (new Promise((resolve, reject) => {
    let cameraId = data['camId'];
    var query = Processed.aggregate([{
        $match: {
          time: {
            $gte: new Date(data['start_time']),
            $lte: new Date(data['end_time'])
          },
          camId: cameraId
        }
      },
      {
        $project: {
          camId: 1,
          time: 1,
          _id: 0,
          people_detected: {
            $cond: {
              if: {
                $isArray: "$bboxes"
              },
              then: {
                $size: "$bboxes"
              },
              else: 0
            }
          }
        }
      }
    ]).exec();

    query.then(function(processedStats) {
      let noOfFramesForMode = 10
      let modeDataLine = []
      if (processedStats.length > noOfFramesForMode) {
        for (let index = 0; index < processedStats.length - noOfFramesForMode; index++) {
          //10 because of 2 minute window
          let modeValueArray = []
          for (let inc = 0; inc < noOfFramesForMode; inc++) {
            modeValueArray.push(processedStats[index + inc].people_detected)
          }
          let mode = math.mode(modeValueArray)
          modeDataLine.push({
            mode: mode.length == 1 ? mode[0] : Math.max.apply(null, mode),
            time: processedStats[index].time
          })
        }
      }

      let shiftTimings = [
        "T07:00:00.000Z",
        "T19:00:00.000Z"
      ]
      let shiftChangeArray = []
      for (shiftTime = 0; shiftTime < shiftTimings.length; shiftTime++) {
        let shift_time_stats_object = {};
        shift_time_stats_object['start_time'] = data['end_time'].split("T")[0] + shiftTimings[shiftTime]
        shift_time_stats_object['extra_time_after_shift'] = 0
        shift_time_stats_object['frames_computed'] = 0
        let array_of_people_detected = []
        let found_person_after_shift = true;
        let start_time = new Date(shift_time_stats_object['start_time'])
        for (let index = 0; index < modeDataLine.length; index++) {
          if (start_time <= new Date(modeDataLine[index].time)) {
            array_of_people_detected.push(modeDataLine[index].mode);
            found_person_after_shift = false;
          }

          if (!found_person_after_shift) {
            if (modeDataLine[index + 1]) {
              if (modeDataLine[index].mode != 0 && modeDataLine[index + 1].mode != 0) {
                shift_time_stats_object['frames_computed']++;
                found_person_after_break = true;
                let extra_mins = Math.floor(((new Date(modeDataLine[index].time) - start_time) / 1000) / 60)
                shift_time_stats_object['extra_time_after_shift'] = extra_mins > 0 ? extra_mins : 0;
                break;
              }
            } else {
              if (modeDataLine[index].mode != 0) {
                shift_time_stats_object['frames_computed']++;
                found_person_after_break = true;
                let extra_mins = Math.floor(((new Date(modeDataLine[index].time) - start_time) / 1000) / 60)
                shift_time_stats_object['extra_time_after_shift'] = extra_mins > 0 ? extra_mins : 0;
                break;
              }
            }
          }
        }
        if (shift_time_stats_object['frames_computed'] == 1) {
          shift_time_stats_object['extra_time_after_shift'] = 0;
        }
        shiftChangeArray.push(shift_time_stats_object);
        found_person_after_shift = true;
      }
      resolve(shiftChangeArray)
    })
  }));
}

function evaluateBreakMetrics(data_break_time) {
  let data_to_return = {}
  let break_time_object_array = [];
  let processedStats = data_break_time['processedStats'];
  let breakTimings = data_break_time['breakTimings'];
  // console.log("Break Intervals : ", breakTimings, "Total Frames", processedStats.length)

  //////////////////////////////////////////////////////////////////////////////////////////////////

  let noOfFramesForMode = 10
  let modeDataLine = []
  if (processedStats.length > noOfFramesForMode) {
    for (let index = 0; index < processedStats.length - noOfFramesForMode; index++) {
      //10 because of 2 minute window
      let modeValueArray = []
      for (let inc = 0; inc < noOfFramesForMode; inc++) {
        modeValueArray.push(processedStats[index + inc].people_detected)
      }
      let mode = math.mode(modeValueArray)
      modeDataLine.push({
        mode: mode.length == 1 ? mode[0] : Math.max.apply(null, mode),
        time: processedStats[index].time
      })
    }
  }
  for (breakTime = 0; breakTime < breakTimings.length; breakTime++) {
    break_time_stats_object = {};
    break_time_stats_object['start_time'] = breakTimings[breakTime].start_time;
    break_time_stats_object['end_time'] = breakTimings[breakTime].end_time;
    array_of_people_detected = [];
    found_person_after_break = true;
    break_time_stats_object['extra_time_after_break'] = 0
    break_time_stats_object['extra_time_before_break'] = 0
    break_time_stats_object['frames_computed'] = 0
    start_time = subMinsToDateObj(new Date(breakTimings[breakTime].start_time), 0);
    end_time = addMinsToDateObj(new Date(breakTimings[breakTime].end_time), 0);
    for (let index = 0; index < modeDataLine.length; index++) {
      if ((start_time <= new Date(modeDataLine[index].time)) && (new Date(modeDataLine[index].time) <= end_time)) {
        array_of_people_detected.push(modeDataLine[index].mode);
        found_person_after_break = false;
      }

      if (!found_person_after_break) {
        if (modeDataLine[index + 1]) {
          if (modeDataLine[index].mode != 0 && modeDataLine[index + 1].mode != 0) {
            found_person_after_break = true;
            let extra_mins = Math.floor(((new Date(modeDataLine[index].time) - new Date(break_time_stats_object['end_time'])) / 1000) / 60)
            break_time_stats_object['extra_time_after_break'] = extra_mins > 0 ? extra_mins : 0;
          }
        } else {
          if (modeDataLine[index].mode != 0) {
            found_person_after_break = true;
            let extra_mins = Math.floor(((new Date(modeDataLine[index].time) - new Date(break_time_stats_object['end_time'])) / 1000) / 60)
            break_time_stats_object['extra_time_after_break'] = extra_mins > 0 ? extra_mins : 0;
          }
        }
      }

      break_time_stats_object['frames_computed']++;
    }
    break_time_stats_object['mode_persons'] = (array_of_people_detected.length != 0) ? math.mode(array_of_people_detected)[0] : 0;
    break_time_object_array.push(break_time_stats_object);
    found_person_after_break = true;
  }
  // console.log("Analytis object: ", break_time_object_array)
  //////////////////////////////////////////////////////////////////////////////////////////////////
  data_to_return['breaks'] = break_time_object_array
  data_to_return['total_stats'] = {}
  data_to_return['total_stats']['total_break_mins'] = 0
  data_to_return['total_stats']['extra_break_mins'] = 0
  for (index = 0; index < data_to_return['breaks'].length; index++) {
    data_to_return['total_stats']['total_break_mins'] = data_to_return['total_stats']['total_break_mins'] + Math.floor(((new Date(data_to_return['breaks'][index].end_time) - new Date(data_to_return['breaks'][index].start_time)) / 1000) / 60);
    data_to_return['total_stats']['extra_break_mins'] = data_to_return['total_stats']['extra_break_mins'] + data_to_return['breaks'][index].extra_time_after_break
  }
  return data_to_return
}

// function makeGifOfFrames(data){
//   var gif = new GifEncoder(1280, 720);
//   var file = require('fs').createWriteStream('img.gif');
//   var pics = ['./pics/1.jpg', './pics/2.jpg', './pics/3.jpg'];
// }
