const Manpower = require('../models/PlannedManpower');
const Processed = require('../models/ProcessedFrames');
const Intelligence = require('../models/IntelligenceReport');
const Camera = require('../models/Camera');
const Groups = require('../models/Groups');
const ObjectId = (require('mongoose').Types.ObjectId);

exports.getGroupInfo  = (req, res) => {
  let matchObject = {}
  if(req.query.type){
    matchObject["groupType"] = req.query.type;
  }
  if(req.query.name){
    matchObject["groupName"] = req.query.name;
  }

  if(req.query.plantID){
    matchObject['groupIdentifier'] = {};
    matchObject['groupIdentifier']['value'] = req.query.plantID;
    matchObject['groupIdentifier']['typeOf'] = "plant";
  }
  // if(req.query.identifier){
  //   matchObject["groupIdentifier"] = req.query.name;
  // }
  var query = Groups.aggregate([{
      $match: matchObject
    }
  ]).exec();
  query.then(function(doc) {
    // console.log(doc)
    res.json(doc)
  });
}

exports.updateGroupInfo  = (req, res) => {
  let data = {}
  data.matchObject = {
    _id : new ObjectId(req.params.id)
  }

  data.updateObject = req.body

  var query = Groups.findOneAndUpdate(
    data.matchObject,
    data.updateObject, {
      new: true
    }
  ).exec();
  query.then(function(doc) {
    console.log(doc)
    res.json(doc)
  });
}

exports.addGroup  = (req, res) => {
  if(req.body){
    if(req.body.groupName){
        console.log(req.body)
        let group = new Groups(req.body);
        group.save().then(item => {
          console.log("item saved to database", item._id);
          res.json(item)
        }).catch(err => {
          console.log("unable to save to database", err);
        });
    }
  }
}

exports.deleteGroup  = (req, res) => {

}
