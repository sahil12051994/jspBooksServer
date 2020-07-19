const Frame = require('../models/faceFrame');
const Employee = require('../models/Employee');
const Camera = require('../models/Camera');
const SysLogs = require('../models/Logs');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');

const url = require('url');
const fs = require('fs');
const path = require('path');

YAML = require('yamljs');
configObject = YAML.load('./config/server.yml');

let {
  PythonShell
} = require('python-shell')

exports.getEmpAnalytics = (req, res) => {
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

  if (req.query.plant) {
    matchObject["plant"] = req.query.plant
  }

  aggPipeline.push({
    $match: matchObject
  })

  aggPipeline.push({
    $unwind: "$personsDetected"
  })

  aggPipeline.push({
    $sort: {
      "time": 1
    }
  })

  aggPipeline.push({
    $group: {
      _id: "$personsDetected.empId",
      confScores: {
        $push: "$personsDetected.confScore"
      },
      timeInfo: {
        $push: {
          time: "$time",
          camId: "$camId",
          conf: "$personsDetected.confScore"
        }
      }
    }
  })

  aggPipeline.push({
    $match: {
      "_id": req.params.id
    }
  })

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.getEmpAnalyticsFAR = (req, res) => {
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

  if (req.query.plant) {
    matchObject["plant"] = req.query.plant
  }

  aggPipeline.push({
    $match: {
      "aiInfo": {
        $exists: true
      }
    }
  })

  aggPipeline.push({
    $group: {
      _id: "$camId",
      totalFrames: {
        $sum: 1
      },
      totalPersonsInFrames: {
        $sum: "$aiInfo.actualPersons"
      },
      totalFalseDetections: {
        $sum: "$aiInfo.falseDetections"
      },
      totalMisDetections: {
        $sum: "$aiInfo.misDetections"
      }
    }
  })

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.getSysLogAnalytics = (req, res) => {
  let aggPipeline = []

  if (req.query.startDate && req.query.endDate) {
    aggPipeline.push({
      $match: {
        "time": {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        }
      }
    })
  }

  if (req.query.logType) {
    aggPipeline.push({
      $match: {
        "logType": req.query.logType
      }
    })
  }

  if (req.query.logFrom) {
    aggPipeline.push({
      $match: {
        "logFrom": req.query.logFrom
      }
    })
  }

  aggPipeline.push({
    $sort: {
      time: -1
    }
  })

  if (req.query.latest) {
    aggPipeline.push({
      $limit: parseInt(req.query.latest)
    })
  }

  var query = SysLogs.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.getEmpLogAnalytics = (req, res) => {

  let aggPipeline = []

  if (req.query.startDate && req.query.endDate) {
    aggPipeline.push({
      $match: {
        "time": {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        }
      }
    })
  }

  if (req.query.singleCamId) {
    aggPipeline.push({
      $match: {
        "camId": req.query.singleCamId
      }
    })
  }

  aggPipeline.push({
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "camDetails"
    }
  })

  if (req.query.camPlantId) {
    aggPipeline.push({
      $match: {
        "camDetails.plant": req.query.camPlantId
      }
    })
  }

  aggPipeline.push({
    $unwind: "$personsDetected"
  })

  aggPipeline.push({
    $group: {
      _id: "$personsDetected.empId",
      timeStamps: {
        $push: "$time"
      },
      camId: {
        $addToSet: "$camId"
      },
      camPlantId: {
        $addToSet: "$camDetails.plant"
      }
    }
  })

  aggPipeline.push({
    $lookup: {
      from: "employee",
      localField: "_id",
      foreignField: "empId",
      as: "empName"
    }
  }, {
    $unwind: '$empName'
  }, {
    $project: {
      empId: '$empName.empId',
      empName: '$empName.empName',
      companyId: '$empName.company',
      designation: '$empName.designation',
      verfied: '$empName.verfied',
      empPlantId: '$empName.plant',
      groups: '$empName.groups',
      timeStamps: '$timeStamps',
      camId: '$camId',
      camPlantId: '$camPlantId'
    }
  })

  if (req.query.empPlantId) {
    aggPipeline.push({
      $match: {
        "empPlantId": req.query.empPlantId
      }
    })
  }

  if (req.query.companyId) {
    aggPipeline.push({
      $match: {
        "companyId": req.query.companyId
      }
    })
  }

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.getEmpTrendAnalytics = (req, res) => {

  let aggPipeline = []

  if (req.query.startDate && req.query.endDate && req.query.companyId) {
    aggPipeline.push({
      $match: {
        "time": {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        },
        "companyId" : req.query.companyId
      }
    })
  } else if(req.query.startDate && req.query.companyId){
    aggPipeline.push({
      $match: {
        "time": {
          $gte: new Date(req.query.startDate),
        },
        "companyId" : req.query.companyId
      }
    })
  }

  if (req.query.camId) {
    aggPipeline.push({
      $match: {
        "camId": req.query.camId
      }
    })
  }

  aggPipeline.push({
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "camDetails"
    }
  })

  if (req.query.camPlantId) {
    aggPipeline.push({
      $match: {
        "camDetails.plant": req.query.camPlantId
      }
    })
  }

  aggPipeline.push({
    $unwind: "$personsDetected"
  })

  if (req.query.groupBy) {
    aggPipeline.push({
      "$project": {
        "y": {
          "$year": "$time"
        },
        "m": {
          "$month": "$time"
        },
        "d": {
          "$dayOfMonth": "$time"
        },
        "h": {
          "$hour": "$time"
        },
        "empId": "$personsDetected.empId",
        "time": "$time",
        "camId": "$camId",
        "plantId": "$camDetails.plant",
        "fr_computeTime": "$fr_computeTime",
        "asResult_computeTime": "$asResult_computeTime",
        "autoTemp_updationTime": { "$subtract": ["$autoTemp.time", "$time"] }
      }
    })

    let groupFilter = {}
    if (req.query.groupBy == "hour") {
      groupFilter = {
        "year": "$y",
        "month": "$m",
        "day": "$d",
        "hour": "$h"
      }
    } else if (req.query.groupBy == "day") {
      groupFilter = {
        "year": "$y",
        "month": "$m",
        "day": "$d",
      }
    }
    aggPipeline.push({
      "$group": {
        "_id": groupFilter,
        "framesProcessed": {
          "$sum": 1
        },
        "empIds": {
          "$addToSet": "$empId"
        },
        "camIds": {
          "$addToSet": "$camId"
        },
        "plantIds": {
          "$addToSet": "$plantId"
        },
        "fr_computeTime": {
          "$addToSet": "$fr_computeTime"
        },
        "asResult_computeTime": {
          "$addToSet": "$asResult_computeTime"
        },
        "autoTemp_updationTime": {
          "$addToSet": "$autoTemp_updationTime"
        }
      }
    })
  }

  // if(req.query.viewType == "plant") {
  //   aggPipeline.push({
  //     $unwind: "$plantIds"
  //   })
  // } else if(req.query.viewType == "camera") {
  //   aggPipeline.push({
  //     $unwind: "$camIds"
  //   })
  // }

  aggPipeline.push({
    $project: {
         item: 1,
         numberOfUniqueEmpIds: { $cond: { if: { $isArray: "$empIds" }, then: { $size: "$empIds" }, else: "NA"} },
         numberOfUniqueCamIds: { $cond: { if: { $isArray: "$camIds" }, then: { $size: "$camIds" }, else: "NA"} },
         framesProcessed: "$framesProcessed",
         hour: "$_id.hour",
         day: "$_id.day",
         month: "$_id.month",
         year: "$_id.year",
         avgFrTime: { $min: "$fr_computeTime" },
         avgAsAppTime: { $min: "$asResult_computeTime" },
         avgAutoTempTime: { $min: "$autoTemp_updationTime" },
         camIds: "$camIds",
         plantIds: "$plantIds"
      }
  })

  if(req.query.groupBy) {
    if (req.query.groupBy == "hour") {
      aggPipeline.push({
        $sort: {
             "hour": 1,
          }
      })
    } else if (req.query.groupBy == "day") {
      aggPipeline.push({
        $sort: {
             "day": 1,
          }
      })
    }
  }

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

/*
#Number of cameras active during a time period
db.faceFrame.aggregate([{$match: {time : {$gte:ISODate("2020-06-05T00:00:00.546Z"), $lte: ISODate("2020-06-05T23:59:59.546Z")}}}, {$group: {_id: "$camId"}},{ $group: { _id: null, count: { $sum: 1 } } } ])
*/
exports.lightingConditions = (req, res) => {
  let aggPipeline = []

  let matchObject = {}

  if (req.query.companyId) {
    matchObject['companyId'] = req.query.companyId
  }

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

  aggPipeline.push({
    $sort: {
      time: -1
    }
  })

  if (req.query.latest) {
    aggPipeline.push({
      $limit: 1
    })
  }

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    if (doc && doc.length > 0) {
      let frameInfo = doc[0]
      let framePath = frameInfo['framePath']
      let options = {
        mode: 'text',
        pythonPath: configObject['python']['path'],
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: configObject['python']['nodeUtilScriptsPath'],
        args: [
          framePath
        ]
      };
      PythonShell.run('faceHistogram.py', options, function(err, results) {
        if (err) {
          console.log(err)
          // resolve()
          throw err;
        }
        // results is an array consisting of messages collected during execution
        console.log('deleteddddd results: %j', results);
        return res.json({
          lightingConditions: results ? results[0] : null,
          frameInfo: doc
        })
      });
    } else {
      return res.json({
        lightingConditions: null,
        frameInfo: doc
      })
    }
  }).catch(err => {
    console.log("Error: ", err);
  });
}
