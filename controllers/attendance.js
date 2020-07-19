const Frame = require('../models/faceFrame');
const Employee = require('../models/Employee');
const Camera = require('../models/Camera');
const CameraEfficiency = require('./cameraEff');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');
let {
  PythonShell
} = require('python-shell')

const url = require('url');
const fs = require('fs');
const path = require('path');
YAML = require('yamljs');
configObject = YAML.load('./config/server.yml');

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

exports.getAttendance = (req, res) => {
  let aggPipeline = []

  let matchObject = {}
  if (req.query.startDate && req.query.endDate) {
    matchObject['time'] = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    }
  } else if (req.query.startDate) {
    matchObject['time'] = new Date(req.query.startDate)
  }

  if (req.query.camId) {
    matchObject["camId"] = req.query.camId
  }

  aggPipeline.push({
    $match: matchObject
  })

  if (req.query.empId) {
    //Attendance for particular employee
    aggPipeline.push({
      $project: {
        camId: 1,
        _id: 1,
        time: 1,
        personsDetected: {
          $filter: {
               input: "$personsDetected",
               as: "personsDetected",
               cond: { $eq: ["$$personsDetected.empId",req.query.empId]}
            }
        }
      }
    })
  }

  aggPipeline.push({
    $project: {
      camId: 1,
      _id: 1,
      time: 1,
      personsDetected: { $size: "$personsDetected" }
    }
  })

  //adding plant field
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
    $addFields: {
      plant: '$plant.plant'
    }
  });

  if (req.query.plantId) {
    aggPipeline.push({
      $match : {
        "plant" : req.query.plantId
      }
    })
  }

  aggPipeline.push({
    $sort: {
      "time" : 1
    }
  })

  aggPipeline.push({
    $match : {
      personsDetected: {
        $gte: 1
      }
    }
  },{
    $limit: 1000
  })

  var query = Frame.aggregate(aggPipeline).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.getBlurMeasure = (req, res) => {
  let data_out = {};
  let aggPipeline = []

  let matchObject = {
    $match: {
        _id: ObjectId(req.params.id)
    }
  }
  aggPipeline.push(matchObject);

  aggPipeline.push({
    $project: {
      camId: 1,
      framePath: 1
    }
  });

  var query = Frame.aggregate(aggPipeline).exec();
  query.then(function(doc) {
      data_out["image_detail"] = doc[0];
      let pathname = data_out["image_detail"].framePath;
      let options = {
        mode: 'text',
        pythonPath: configObject['python']['path'],
        // pythonPath: '/home/jbmai/anaconda3/bin/python',
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: './pythonScripts/',
        args: [pathname]
      };
      PythonShell.run('blur-detection.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
        return res.json(results);
      });
  }).catch(err => {
    console.log("unable to calc blur measure", err);
  });
}

exports.getFrame = (req, res) => {
  let data_out = {};
  let aggPipeline = []

  if(req.query.fId) {
    let matchObject = {
      $match: {
          _id: ObjectId(req.query.fId)
      }
    }
    aggPipeline.push(matchObject);
  }

  if(req.query.camId && req.query.time) {
    let matchObject = {
      $match: {
          time: new Date(req.query.time),
          camId: req.query.camId
      }
    }
    aggPipeline.push(matchObject);
  }

  if (req.query.random) {
    if (req.query.random == 1) {
      aggPipeline = []
      aggPipeline.push({
        $match : {
          camId: req.query.camId
        }
      });
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

  if (req.query.onlyData) {
    if (req.query.onlyData == 1) {
      aggPipeline.push({
        $project: {
          camId: 1,
          personsDetected: 1,
          time: 1,
          confScores: 1,
          aiInfo: 1,
        }
      });
    }
  }

  Frame.aggregate(aggPipeline,
    (err, processed) => {
      if (err) {
        return next(err);
      }
      try {
        data_out["image_detail"] = processed[0];
        let pathname = data_out["image_detail"].framePath;
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
