const Manpower = require('../models/PlannedManpower');
const Processed = require('../models/ProcessedFrames');
const Intelligence = require('../models/IntelligenceReport')
const CameraEfficiency = require('./cameraEff');
const Camera = require('../models/Camera');
const User = require('../models/User');

const regression = require('regression');
const math = require('mathjs');
const moment = require('moment');
const mongoose = require('mongoose');

const url = require('url');
const fs = require('fs');
const path = require('path');

exports.getUserVideoList = (req, res) => {
  let aggPipeline = [];

  let matchObject = {
    "$match": {}
  }
  if (req.params.id) {
    //camIdRef is userId in this case
    // matchObject["$match"]['camIdRef'] = req.params.id
    matchObject["$match"]['camId'] = {
      "$regex": /upload/i
    }
  }
  aggPipeline.push(matchObject);

  let groupObject = {
    "$group": {
      "_id": "$camId"
    }
  }
  aggPipeline.push(groupObject);

  let query = Processed.aggregate(aggPipeline).exec();

  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to resolve processedStats", err);
  });
};

exports.getFramesInfo = (req, res) => {
  let aggPipeline = [];

  let matchObject = {
    "$match": {}
  }
  if (req.params.id) {
    matchObject["$match"]['camId'] = req.params.id
  }
  // matchObject["$match"]['time'] = {
  //   $gte: new Date(moment().subtract(100000, 'seconds').format().split("+")[0] + 'Z')
  // }
  aggPipeline.push(matchObject);

  let sortObject = {}
  sortObject = {
    "$sort": {
      "time": 1
    }
  }
  aggPipeline.push(sortObject);

  let projectObject = {
    "$project": {
      "camId": 1,
      "time": 1,
      "people_detected": {
        "$cond": {
          "if": {
            "$isArray": "$bboxes"
          },
          "then": {
            "$size": "$bboxes"
          },
          "else": 0
        }
      }
    }
  }
  aggPipeline.push(projectObject);
  console.log(aggPipeline);
  let query = Processed.aggregate(aggPipeline).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to resolve processedStats", err);
  });
};
