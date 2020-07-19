const Frame = require('../models/faceFrame');
const Employee = require('../models/Employee');
const Camera = require('../models/Camera');
const Groups = require('../models/Groups');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');

const url = require('url');
const fs = require('fs');
const path = require('path');

function insertCameraDetails(data) {
  let cameraData = new Intelligence(data)
}

exports.cameraSearch = (req, res) => {

  var query = Camera.aggregate([{
      $match: {
        $or: [{
          "camName": {
            $regex: ".*" + req.query.text + ".*"
          }
        }, {
          "plant": {
            $regex: ".*" + req.query.text + ".*"
          }
        }, {
          "location": {
            $regex: ".*" + req.query.text + ".*"
          }
        }]
      }
    },
    {
      $project: {
        camName: 1,
        _id: 1
      }
    }
  ]).exec();
  query.then(function(doc) {
    return res.json(doc)
  });
}

exports.getActiveCameras = () => {
  return new Promise((resolve, reject) => {
    var query = Camera.aggregate([{
        $match: {
          // $or : [
          //   {status:1, camName: { $in : [/N-1/i]}},
          //   {status:2, camName: { $in : [/N-1/i]}}
          // ]
          $or: [{
              status: 1
            },
            {
              status: 2
            }
          ]
        }
      },
      {
        $project: {
          camName: 1,
          _id: 1
        }
      }
    ]).exec();
    query.then(function(doc) {
      resolve(doc)
    });
  });
}

function getCameraDetails(data) {
  return new Promise((resolve, reject) => {
    var query = Camera.aggregate([{
        $match: data.matchObject
      },
      // {
      //   $project: {
      //     camName: 1,
      //     hardware: 1,
      //     status: 1,
      //     _id: 1,
      //     location: 1,
      //     plant: 1,
      //     aiStats: 1,
      //     mailingList: 1,
      //     deploymentDetails: 1,
      //     login: 1
      //   }
      // }
    ]).exec();
    query.then(function(doc) {
      resolve(doc)
    });
  });
}

exports.cameraDetails = (req, res) => {
  let data = {}
  data['matchObject'] = {}
  if (req.query.camName) {
    data['matchObject']['camName'] = req.query.camName
  }
  if (req.query.camId) {
    data['matchObject']['_id'] = new ObjectId(req.query.camId)
  }
  if (req.query.companyId) {
    data['matchObject']['companyId'] = req.query.companyId
  }
  if (req.query.status) {
    data['matchObject']['status'] = req.query.status
  }
  if (req.query.type) {
    data['matchObject']['deploymentDetails'] = {
      "$elemMatch": {
        "microserviceName": req.query.type
      }
    }
  }

  // if (req.body.infoType) {
  // data['projectObject'] = {
  //   hardware: 1,
  //   status: 1,
  //   _id: 1,
  //   ip: 0,
  //   location: 1,
  //   plant: 1,
  //   aiStats: 1,
  //   mailingList: 1,
  //   deploymentDetails:1
  // }
  // }
  getCameraDetails(data).then(function(value) {
    res.json(value)
  })
};

function updateCameraDetails(data) {
  return new Promise((resolve, reject) => {
    var query = Camera.findOneAndUpdate(
      data.matchObject,
      data.updateObject, {
        new: true
      }
    ).exec();
    query.then(function(doc) {
      console.log("updated cammmmm", doc)
      resolve(doc)
    });
  });
}

exports.updateCameraDetails = (req, res) => {
  console.log("updateCamera", req.body.updateInfo)
  let data = {}
  data['matchObject'] = {}
  if (req.params.id) {
    data['matchObject']['_id'] = new ObjectId(req.params.id)
  }
  if (req.body.updateInfo) {
    data['updateObject'] = req.body.updateInfo
  }
  console.log("matchupdate object", data)
  updateCameraDetails(data).then(function(value) {
    res.json(value)
  })
};

exports.addNewCamera = (req, res) => {
  if (req.body) {
    console.log("camera info", req.body)
    if (req.body.camName) {
      let camera = new Camera(req.body);
      camera.save().then(item => {
        console.log("item saved to database", item._id);
        res.json({
          status: 1
        })
      }).catch(err => {
        console.log("unable to save to database", err);
      });
    }
  }
}

exports.aiReports = (req, res) => {
  let aggPipeline = []

  let matchObject = {
    $match: {}
  }
  if (req.query.camId) {
    matchObject['$match']['camId'] = req.query.camId;
  }
  if (req.query.startDate && req.query.endDate) {
    matchObject['$match']['time'] = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    }
  } else if (req.query.startDate) {
    matchObject['$match']['time'] = {
      $gte: new Date(req.query.startDate)
    }
  }

  matchObject['$match']['aiInfo'] = {
    $exists: true
  }
  aggPipeline.push(matchObject);

  let projectObject = {
    $project: {
      camId: 1,
      // filepath: {
      //   $concat: ["$path", "/", "$fileName"]
      // },
      time: 1,
      _id: 0,
      // aiInfo:1,
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
      precision: {
        $cond: [{
          $eq: ["$aiInfo.actualPersons", 0]
        }, "NA", {
          $divide: [{
            $subtract: ["$aiInfo.actualPersons", "$aiInfo.falseDetections"]
          }, "$aiInfo.actualPersons"]
        }]
      },
      recall: {
        $cond: [{
            $eq: [{
              $add: [{
                $subtract: ["$aiInfo.actualPersons", "$aiInfo.falseDetections"]
              }, "$aiInfo.misDetections"]
            }, 0]
          },
          "NA",
          {
            $divide: [{
              $subtract: ["$aiInfo.actualPersons", "$aiInfo.falseDetections"]
            }, {
              $add: [{
                $subtract: ["$aiInfo.actualPersons", "$aiInfo.falseDetections"]
              }, "$aiInfo.misDetections"]
            }]
          }
        ]
      }
    }
  }
  aggPipeline.push(projectObject)

  aggPipeline.push({
    $match: {
      precision: {
        $not: /NA/i
      },
      recall: {
        $not: /NA/i
      }
    }
  })

  // aggPipeline.push({
  //   $sample: {
  //     size: 3
  //   }
  // })
  //https://docs.mongodb.com/manual/reference/operator/aggregation/sample/

  if (req.query.group) {
    if (req.query.group == 1) {
      let groupObject = {
        $group: {
          _id: "$camId",
          precision: {
            $avg: "$precision"
          },
          recall: {
            $avg: "$recall"
          },
          totalFramesComputed: {
            $sum: 1
          }
        }
      }
      aggPipeline.push(groupObject)
    }
  }

  var query = Frame.aggregate(aggPipeline).exec();
  query.then(function(doc) {
    return res.json(doc)
  });

}

exports.allCamsList = async (req, res) => {

  let frGroupMembers = undefined;
  if (req.query.frGroup) {
    let groupDetails = await Groups.findOne({
      "groupType": req.query.frGroup,
      "groupName": req.query.frGroupName
    })
    if (groupDetails) {
      if (groupDetails.groupMembers.length > 0) {
        frGroupMembers = groupDetails.groupMembers
      }
    }
  }

  let aggPipeline = []

  aggPipeline.push({
    $match: {
      "deploymentDetails": {
        $elemMatch: {
          "microserviceName": "faceRecog"
        }
      },
    }
  });

  if (req.query.companyId) {
    aggPipeline.push({
      $match: {
        companyId: req.query.companyId
      }
    });
  }

  if (frGroupMembers != undefined) {
    if (frGroupMembers.length > 0) {
      let tempMatchObject = {
        $match: {
          $or: []
        }
      }
      for (var fIndex = 0; fIndex < frGroupMembers.length; fIndex++) {
        tempMatchObject["$match"]["$or"].push({
          plant: frGroupMembers[fIndex]
        })
        console.log(tempMatchObject["$match"]["$or"], frGroupMembers[fIndex])
      }
      aggPipeline.push(tempMatchObject)
    }
  } else {
    if (req.query.plantId) {
      aggPipeline.push({
        $match: {
          "plant": req.query.plantId
        }
      })
    }
    if (req.query.camId) {
      aggPipeline.push({
        $match: {
          "camName": req.query.camId
        }
      })
    }
  }

  aggPipeline.push({
    $group: {
      _id: "$plant",
      cameras: {
        $push: {
          camId: "$camName",
          camLoc: "$location",
          usageType: {
            $reduce: {
              input: "$deploymentDetails.usageType",
              initialValue: [],
              in: {
                $concatArrays: ["$$value", "$$this"]
              }
            }
          }
        }
      }
    }
  })

  console.log(aggPipeline)

  var query = Camera.aggregate(aggPipeline).exec();
  query.then(function(doc) {
    return res.json(doc)
  });

}
