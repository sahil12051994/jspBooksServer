const Frame = require('../models/faceFrame');
const Employee = require('../models/Employee');
const Camera = require('../models/Camera');
const Groups = require('../models/Groups');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');
var Jimp = require('jimp');

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

function deleteAllFolder(targetDir) {
  return new Promise(function(resolve, reject) {
    let options = {
      mode: 'text',
      pythonPath: configObject['python']['path'],
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: configObject['python']['nodeUtilScriptsPath'],
      args: [
        targetDir
      ]
    };
    PythonShell.run('deleteDir.py', options, function(err, results) {
      if (err) {
        console.log(err)
        resolve()
        throw err;
      }
      // results is an array consisting of messages collected during execution
      console.log('deleteddddd results: %j', results);
      resolve(results)
    });
  })
}

exports.getAllEmpInfo = async (req, res) => {

  let frGroupMembers = undefined;
  if(req.query.frGroup) {
    let groupDetails = await Groups.findOne({
      "groupType": req.query.frGroup,
      "groupName": req.query.frGroupName
    })
    if(groupDetails) {
      if(groupDetails.groupMembers.length > 0) {
        frGroupMembers = groupDetails.groupMembers
      }
    }
  }

  let data_out = {};
  let aggPipeline = []

  let companyId = req.query.companyId;

  if(frGroupMembers != undefined) {
    if(frGroupMembers.length > 0) {
      let tempMatchObject = {
        $match: {
          $or: []
        }
      }
      for (var fIndex = 0; fIndex < frGroupMembers.length; fIndex++) {
        tempMatchObject["$match"]["$or"].push({
          plant : frGroupMembers[fIndex]
        })
      }
      aggPipeline.push(tempMatchObject)
    }
  } else {
    if (req.query.plantId) {
      aggPipeline.push({
        $match: {
          plant: req.query.plantId
        }
      })
    }
  }

  if (companyId) {
    aggPipeline.push({
      $match: {
        company: companyId
      }
    })
  }

  if (req.query.onlyId) {
    // aggPipeline.push({
    //   $project: {
    //     empId: 1,
    //     _id: 0
    //   }
    // })
  }

  let query = Employee.aggregate(aggPipeline).allowDiskUse(true).exec();

  query.then(function(doc) {
    let ouputObj = {
      totalEmployeesInDB: doc.length,
      employeeInfo: doc
    }
    return res.json(ouputObj)
  }).catch(err => {
    console.log("unable to resolve manpower query", err);
  });
}

exports.updateEmpInfo = (req, res) => {

  console.log("Employeeeee update\n\n\n\n")

  let matchObject = {
    "empId": req.params.id
  }

  console.log(req.body.empInfo)

  let updateObject = req.body.empInfo

  var query = Employee.findOneAndUpdate(
    matchObject, {
      $set: updateObject
    }, {
      upsert: true
    }
  ).exec();

  query.then(function(doc) {
    console.log("updated Employee\n", doc)
    return res.json(doc)
  });
}

exports.deleteEmpInfo = (req, res) => {
  console.log("Delete Employee From Database Called");
  let aggPipeline = []

  aggPipeline.push({
    $match: {
      "empId": req.params.id
    }
  });
  let findQuery = Employee.aggregate(aggPipeline).exec();
  findQuery.then(function(doc) {
    console.log("Delete From DB, Now removing folders");
    doc = doc[0]
    // if(doc['trainingImages'].length > 0) {
      let imagePath = doc['folderPath'] + doc['empId'] + "/"
      let pathArr = imagePath.split("/")
      pathArr.splice(pathArr.length -1 , 1);
      let targetDir = pathArr.join("/")

      deleteAllFolder(targetDir).then(function(v, err) {
        if(err) {
          console.log("error in deletion of folder", err)
        }
        let deleteQuery = Employee.deleteOne(
          {
            "empId": req.params.id
          }
        ).exec();

        deleteQuery.then(function(doc, err) {
          if(err) {
            console.log("error in emp delete querry",err)
          }
          console.log("Deleted Employee\n", doc)
          return res.json({status: 1})
        });
      })
    // }
  }).catch(err => {
    console.log("unable to resolve deletion query", err);
  });
}

exports.getEmpInfo = (req, res) => {
  let data_out = {};
  let aggPipeline = []

  let matchObject = {
    $match: {
      empId: req.params.id
    },
  }
  aggPipeline.push(matchObject);

  aggPipeline.push({
      "$unwind": { path: "$groups", preserveNullAndEmptyArrays: true }
    },
    // Do the lookup matching
    {
      "$lookup": {
        "from": "groups",
        "localField": "groups",
        "foreignField": "groupName",
        "as": "groupsObjects"
      }
    },
    // Unwind the result arrays ( likely one or none )
    {
      "$unwind": { path: "$groupsObjects", preserveNullAndEmptyArrays: true }
    },
    // Group back to arrays
    {
      "$group": {
        "_id": "$_id",
        "empName": {
          $first: "$empName"
        },
        "empId": {
          $first: "$empId"
        },
        "folderPath": {
          $first: "$folderPath"
        },
        "plant": {
          $first: "$plant"
        },
        "trainingImages": {
          $first: "$trainingImages"
        },
        "aiData": {
          $first: "$aiData"
        },
        "designation": {
          $first: "$designation"
        },
        "workDetails": {
          $first: "$workDetails"
        },
        "groups": {
          "$push": "$groupsObjects"
        },
      }
    }
  )

  if (req.query.onlyData) {
    if (req.query.onlyData == 1) {
      aggPipeline.push({
        $project: {
          empName: 1,
          empId: 1,
          folderPath: 1,
          plant: 1,
          trainingImages: 1,
          aiData: 1,
          designation: 1,
          workDetails: 1,
          groups: 1
        }
      });
    }
  }

  let query = Employee.aggregate(aggPipeline).exec();

  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to resolve manpower query", err);
  });
}

exports.getImage = (req, res) => {
  let pathname = req.query.path
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
        res.setHeader('Content-type', mimeType[ext] || 'text/plain');
        // if the file is found, set Content-type and send data
        // Jimp.read(pathname)
        //   .then(lenna => {
        //     console.log(lenna)
        //     res.setHeader('Content-type', mimeType[ext] || 'text/plain');
        //     console.log(lenna
        //       .resize(256, 256) // resize
        //       .quality(60))
        //   })
        res.end(data);
      }
    });
  });
}
