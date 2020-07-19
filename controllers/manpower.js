const Manpower = require('../models/PlannedManpower');
const Processed = require('../models/ProcessedFrames');
const Intelligence = require('../models/IntelligenceReport');
const Camera = require('../models/Camera');
const CameraEfficiency = require('./cameraEff');
const ObjectId = (require('mongoose').Types.ObjectId);
const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const math = require('mathjs');
const moment = require('moment');

function updateManpowerDetails(data) {
  return new Promise((resolve, reject) => {
    var query = Manpower.findOneAndUpdate(
      data.matchObject,
      data.updateObject, {
        new: true
      }
    ).deepPopulate('comments.userId').exec();
    query.then(function(doc) {
      resolve(doc)
    });
  });
}

exports.manpowerUpdate = (req, res) => {
  let data = {}
  data['matchObject'] = {}
  data['matchObject']['camId'] = req.body.camId
  data['matchObject']['date'] = req.body.date
  if (req.body) {
    data['updateObject'] = {}
    if (req.body.updatedPlannedManpower) {
      data['updateObject']['$set'] = {
        data: req.body.updatedPlannedManpower
      }
    }
    if (req.body.comment) {
      // if(req.body.comment.userId){
      //   req.body.comment.userId =
      // }
      data['updateObject']['$push'] = {
        comments: req.body.comment
      }
    }
    updateManpowerDetails(data).then(function(value) {
      res.json(value)
    })
  }
}

exports.addNewManpower = (req, res) => {
  console.log(Object.keys(req.body))
  if(req.body){
    console.log(req.body)
    if(req.body.camId && req.body.date){
      if(req.body.data){
        let manPower = new Manpower(req.body);
        manPower.save().then(item => {
          console.log("item saved to database", item._id);
          res.json({"status" : "1", "_id" : item._id})
        }).catch(err => {
          console.log("unable to save to database", err);
        });
      }
    }
  }
}
