const Frame = require('../models/faceFrame');
const Employee = require('../models/Employee');
const Camera = require('../models/Camera');
const Groups = require('../models/Groups');
const CameraEfficiency = require('./cameraEff');
const ObjectId = (require('mongoose').Types.ObjectId);
const math = require('mathjs');
const moment = require('moment');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const url = require('url');
const fs = require('fs');
const path = require('path');

function insertCameraDetails(data) {
  let cameraData = new Intelligence(data)
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

exports.insertDocs = (req, res) => {
  console.log(req.body)
  console.log("Inserting Documents")
  //ISO Date format for timestamp:"yyyy-mm-ddThh:mm:ss[.mmm]"
  var insertList = [];
  for (let i = 0; i < 25; i++) {
    let mins = Math.floor(Math.random() * 60);
    if ((Math.floor(mins / 10)) == 0) {
      mins = "0" + mins;
    }

    let seconds = Math.floor(Math.random() * 60);
    if ((Math.floor(seconds / 10)) == 0) {
      seconds = "0" + seconds;
    }

    let myobj = {
      camId: "Cam_12345_N-5",
      time: new Date('2019-07-07T06:' + mins + ':' + seconds + '.301Z'),
      personsDetected: [{
          empId: "empid001",
          bbox: [1, 2, 3, 4]
        },
        {
          empId: "empid002",
          bbox: [2, 3, 4, 5]
        },
        {
          empId: "empid003",
          bbox: [3, 4, 5, 6]
        }
      ],
      pathOfFrame: "/home/Documents/face/frame/1.jpg"
    };

    insertList.push(myobj);
  }
  for (let j = 0; j < 25; j++) {

    let mins = Math.floor(Math.random() * 60);
    if ((Math.floor(mins / 10)) == 0) {
      mins = "0" + mins;
    }

    let seconds = Math.floor(Math.random() * 60);
    if ((Math.floor(seconds / 10)) == 0) {
      seconds = "0" + seconds;
    }

    let myobj = {
      camId: "Cam_12345_N-5",
      time: new Date('2019-07-07T19:' + mins + ':' + seconds + '.301Z'),
      personsDetected: [{
        empId: "empid001",
        bbox: [1, 2, 3, 4]
      }, {
        empId: "empid002",
        bbox: [2, 3, 4, 5]
      }, {
        empId: "empid003",
        bbox: [3, 4, 5, 6]
      }],
      pathOfFrame: "/home/Documents/face/frame/1.jpg"
    };

    insertList.push(myobj);
  }

  Employee.insertMany([{
    empName: "Siddharth",
    empId: "empid003"
  }, {
    empName: "Yogesh",
    empId: "empid002"
  }, {
    empName: "Shashank",
    empId: "empid001"
  }])

  return res.json(Frame.insertMany(insertList))
}

exports.getFaceInfo = async (req, res) => {

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

  let aggPipeline = []

  let matchObject = {}

  if(req.query.companyId) {
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

  if(req.query.camId) {
    matchObject["camId"] = req.query.camId
  }

  aggPipeline.push({
    $match: matchObject
  })

  if(req.query.rawframe) {
    console.log("ss")
  } else {

    aggPipeline.push({
      $unwind: "$personsDetected"
    })

    aggPipeline.push({
      $lookup: {
        from: "employee",
        localField: "personsDetected.empId",
        foreignField: "empId",
        as: "empName"
      }
    }, {
      $unwind: '$empName'
    }, {
      $addFields: {
        empId: '$empName.empId',
        empName: '$empName.empName',
        companyId: '$empName.company',
        designation: '$empName.designation',
        verfied: '$empName.verfied',
        empPlantId: '$empName.plant',
      }
    })

    if(frGroupMembers != undefined) {
      if(frGroupMembers.length > 0) {
        let tempMatchObject = {
          $match: {
            $or: []
          }
        }
        for (var fIndex = 0; fIndex < frGroupMembers.length; fIndex++) {
          tempMatchObject["$match"]["$or"].push({
            empPlantId : frGroupMembers[fIndex]
          })
          console.log(tempMatchObject["$match"]["$or"], frGroupMembers[fIndex])
        }
        aggPipeline.push(tempMatchObject)
      }
    } else {
      if (req.query.empPlantId) {
        aggPipeline.push({
          $match: {
            "empPlantId": req.query.empPlantId
          }
        })
      }
    }

    aggPipeline.push({
      $sort: {
        "time": 1
      }
    })

    aggPipeline.push({
      $lookup: {
        from: "cameras",
        localField: "camId",
        foreignField: "camName",
        as: "cam"
      }
    }, {
      $unwind: '$cam'
    }, {
      $addFields: {
        plant: '$cam.plant',
        camType: {
          $filter: {
            input: "$cam.deploymentDetails",
            as: "deploymentDetails",
            cond: {
              $eq: ["$$deploymentDetails.microserviceName", "faceRecog"]
            }
          }
        }
      }
    }, {
      $unwind: '$camType'
    });

    if (req.query.plantId) {
      // matchObject["plant"] = req.query.plantId
      aggPipeline.push({
        $match: {
          "empPlantId": req.query.plantId
        }
      })
    }

    aggPipeline.push({
      $group: {
        _id: "$personsDetected.empId",
        empPlantId: { $push : "$empPlantId" },
        timeInfo: {
          $push: {
            time: "$time",
            camId: "$camId",
            plant: "$plant",
            camType: "$camType.usageType"
          }
        }
      }
    })
  }

  aggPipeline.push({
    $sort : { time : -1}
  })

  if(req.query.latest) {
    aggPipeline.push({
      $limit : parseInt(req.query.latest)
    })
  }

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.generateCSV = (req, res) => {
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
    $lookup: {
      from: "cameras",
      localField: "camId",
      foreignField: "camName",
      as: "cam"
    }
  }, {
    $unwind: '$cam'
  }, {
    $addFields: {
      plant: '$cam.plant',
      camType: {
        $filter: {
          input: "$cam.deploymentDetails",
          as: "deploymentDetails",
          cond: {
            $eq: ["$$deploymentDetails.microserviceName", "faceRecog"]
          }
        }
      }
    }
  }, {
    $unwind: '$camType'
  });

  if (req.query.plantId) {
    // matchObject["plant"] = req.query.plantId
    aggPipeline.push({
      $match: {
        "plant": req.query.plantId
      }
    })
  }

  aggPipeline.push({
    $group: {
      _id: "$personsDetected.empId",
      timeInfo: {
        $push: {
          time: "$time",
          camId: "$camId",
          plant: "$plant",
          camType: "$camType.usageType"
        }
      }
    }
  })

  // aggPipeline.push({
  //   $lookup: {
  //     from: "employee",
  //     localField: "_id",
  //     foreignField: "empId",
  //     as: "empName"
  //   }
  // }, {
  //   $unwind: '$empName'
  // }, {
  //   $project: {
  //     empName: '$empName.empName',
  //     timeInfo: 1,
  //     _id:1
  //   }
  // })

  var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  query.then(function(doc) {
    let csvJsonArray_rawData = []
    let csvJsonArray_webdcStarRawData = []
    let csvJsonArray_tempStarLinkFormat = []
    for (var personIndex = 0; personIndex < doc.length; personIndex++) {
      if(doc[personIndex]['_id'].split("_")[1] == "" || doc[personIndex]['_id'] == "Unknown") {
        continue
      }

      let tempArrayOfTimestamps = []

      let objectToBeInserted_tempStarLinkFormat = {}
      objectToBeInserted_tempStarLinkFormat['EmpCode'] = doc[personIndex]['_id'].split("_")[1]
      objectToBeInserted_tempStarLinkFormat['Date'] = moment(doc[personIndex]['timeInfo'][0]['time']).subtract('hours',5).subtract(30, 'minutes').format("DD-MMM-YYYY")

      if(doc[personIndex]['timeInfo'].length == 1) {
        tempArrayOfTimestamps.push(doc[personIndex]['timeInfo'][0])

        objectToBeInserted_tempStarLinkFormat['InDate'] = moment(doc[personIndex]['timeInfo'][0]['time']).subtract('hours',5).subtract(30, 'minutes').format("DD-MMM-YYYY")
        objectToBeInserted_tempStarLinkFormat['InTime'] = moment(doc[personIndex]['timeInfo'][0]['time']).format("HH:MM")
        objectToBeInserted_tempStarLinkFormat['OutDate'] = moment(doc[personIndex]['timeInfo'][0]['time']).subtract('hours',5).subtract(30, 'minutes').format("DD-MMM-YYYY")
        objectToBeInserted_tempStarLinkFormat['OutTime'] = moment(doc[personIndex]['timeInfo'][0]['time']).format("HH:MM")
      }
      else if(doc[personIndex]['timeInfo'].length > 1){
        let lengthOfTimestamps = doc[personIndex]['timeInfo'].length
        console.log("lengthOfTimestamps:" , lengthOfTimestamps, doc[personIndex]['timeInfo'][0], doc[personIndex]['timeInfo'][lengthOfTimestamps-1])
        tempArrayOfTimestamps.push(doc[personIndex]['timeInfo'][0])
        tempArrayOfTimestamps.push(doc[personIndex]['timeInfo'][lengthOfTimestamps-1])

        objectToBeInserted_tempStarLinkFormat['InDate'] = moment(doc[personIndex]['timeInfo'][0]['time']).subtract('hours',5).subtract(30, 'minutes').format("DD-MMM-YYYY")
        objectToBeInserted_tempStarLinkFormat['InTime'] = moment(doc[personIndex]['timeInfo'][0]['time']).format("HH:MM");
        objectToBeInserted_tempStarLinkFormat['OutDate'] = moment(doc[personIndex]['timeInfo'][lengthOfTimestamps-1]['time']).subtract('hours',5).subtract(30, 'minutes').format("DD-MMM-YYYY")
        objectToBeInserted_tempStarLinkFormat['OutTime'] = moment(doc[personIndex]['timeInfo'][lengthOfTimestamps-1]['time']).format("HH:MM")

        if(objectToBeInserted_tempStarLinkFormat['InTime'] == objectToBeInserted_tempStarLinkFormat['OutTime']) {
          objectToBeInserted_tempStarLinkFormat['OutTime'] = '';
        }
      }

      csvJsonArray_tempStarLinkFormat.push(objectToBeInserted_tempStarLinkFormat)

      for (var tIndex = 0; tIndex < tempArrayOfTimestamps.length; tIndex++) {
        if(doc[personIndex]['_id'] == "Unknown") continue;
        let objectToBeInserted_rawData = {}
        let objectToBeInserted_webdcStarRawData = {}

        let tempTime = tempArrayOfTimestamps[tIndex]['time'].toISOString().split("T")[0] + " " + tempArrayOfTimestamps[tIndex]['time'].toISOString().split("T")[1].split("Z")[0]
        objectToBeInserted_rawData['CARDNO'] = pad(doc[personIndex]['_id'].split("_")[1], 8) + "  "
        objectToBeInserted_rawData['OFFICEPUNCH'] = tempTime
        objectToBeInserted_rawData['P_DAY'] = "NULL"
        objectToBeInserted_rawData['ReasonCode'] = "NULL"
        objectToBeInserted_rawData['ERROR_CODE'] = "NULL"
        objectToBeInserted_rawData['Id_No'] = "   "
        objectToBeInserted_rawData['PROCESS'] = "N"
        objectToBeInserted_rawData['DOOR_TIME'] = "NULL"
        objectToBeInserted_rawData['Inout'] = "I"
        objectToBeInserted_rawData['sss'] = "NULL"
        objectToBeInserted_rawData['lcode'] = "    "
        objectToBeInserted_rawData['Created_Date'] = tempTime
        objectToBeInserted_rawData['FName'] = "SevL-SP"
        objectToBeInserted_rawData['MachineID'] = parseInt(tempArrayOfTimestamps[tIndex]['camId'].split("_")[1])
        objectToBeInserted_rawData['MACHINETYPE'] = "Attendance"
        objectToBeInserted_rawData['PK_ID'] = pad(Math.floor(Math.random() * 1000000000), 9)
        csvJsonArray_rawData.push(objectToBeInserted_rawData)

        objectToBeInserted_webdcStarRawData['CARDNO'] = pad(doc[personIndex]['_id'].split("_")[1], 8);
        objectToBeInserted_webdcStarRawData['OFFICEPUNCH'] = tempTime
        objectToBeInserted_webdcStarRawData['REASONCODE'] = ""
        objectToBeInserted_webdcStarRawData['PROCESS'] = "N"
        objectToBeInserted_webdcStarRawData['PUNCHFLAG'] = "I"
        objectToBeInserted_webdcStarRawData['MACHINEID'] = parseInt(tempArrayOfTimestamps[tIndex]['camId'].split("_")[1])
        objectToBeInserted_webdcStarRawData['EDATE'] = tempTime
        objectToBeInserted_webdcStarRawData['MACHINENO'] = parseInt(tempArrayOfTimestamps[tIndex]['camId'].split("_")[1])
        objectToBeInserted_webdcStarRawData['PUNCHTYPE'] = "NULL"
        objectToBeInserted_webdcStarRawData['Latitude'] = "NULL"
        objectToBeInserted_webdcStarRawData['Longitude'] = "NULL"
        objectToBeInserted_webdcStarRawData['MAIL_Send_Flag'] = "NULL"
        objectToBeInserted_webdcStarRawData['MAIL_Send_Date'] = "NULL"
        objectToBeInserted_webdcStarRawData['SMS_Send_Flag'] = "Y"
        objectToBeInserted_webdcStarRawData['SMS_Send_Date'] = "NULL"
        objectToBeInserted_webdcStarRawData['ID_NO'] = ""
        objectToBeInserted_webdcStarRawData['INOUT'] = "I"
        objectToBeInserted_webdcStarRawData['Fname'] = "SevL-SP"
        objectToBeInserted_webdcStarRawData['MACHINETYPE'] = "Attendance"
        csvJsonArray_webdcStarRawData.push(objectToBeInserted_webdcStarRawData)
      }
    }

    const fields_tempStarLinkFormat = [
      'EmpCode',
      'Date',
      'InDate',
      'InTime',
      'OutDate',
      'OutTime'
    ];
    const fields_rawData = [
      'CARDNO',
      'OFFICEPUNCH',
      'P_DAY',
      'ReasonCode',
      'ERROR_CODE',
      'Id_No',
      'PROCESS',
      'DOOR_TIME',
      'Inout',
      'sss',
      'lcode',
      'Created_Date',
      'FName',
      'MachineID',
      'MACHINETYPE',
      'PK_ID'
    ];
    const fields_webdcStarRawData = [
      'CARDNO',
      'OFFICEPUNCH',
      'REASONCODE',
      'PROCESS',
      'PUNCHFLAG',
      'MACHINEID',
      'EDATE',
      'MACHINENO',
      'PUNCHTYPE',
      'Latitude',
      'Longitude',
      'MAIL_Send_Flag',
      'MAIL_Send_Date',
      'SMS_Send_Flag',
      'SMS_Send_Date',
      'ID_NO',
      'INOUT',
      'Fname',
      'MACHINETYPE'
    ];

    console.log("req.query.startDate", req.query.startDate)
    const csvWriter_tempStarLinkFormat = createCsvWriter({
        path: 'uploads/starlinkCSV/tempStarLinkFormat/'+ req.query.plantId + "_" + req.query.startDate.split("T")[0] +'.csv',
        header: [
            {id: 'EmpCode', title: 'EmpCode'},
            {id: 'Date', title: 'Date'},
            {id: 'InDate', title: 'InDate'},
            {id: 'InTime', title: 'InTime'},
            {id: 'OutDate', title: 'OutDate'},
            {id: 'OutTime', title: 'OutTime'}
        ]
    });

    // const csvWriter_rawData = createCsvWriter({
    //     path: 'uploads/starlinkCSV/rawData/'+ req.query.startDate.split("T")[0] +'.csv',
    //     header: [
    //         {id: 'CARDNO', title: 'CARDNO'},
    //         {id: 'OFFICEPUNCH', title: 'OFFICEPUNCH'},
    //         {id: 'P_DAY', title: 'P_DAY'},
    //         {id: 'ReasonCode', title: 'ReasonCode'},
    //         {id: 'ERROR_CODE', title: 'ERROR_CODE'},
    //         {id: 'Id_No', title: 'Id_No'},
    //         {id: 'PROCESS', title: 'PROCESS'},
    //         {id: 'DOOR_TIME', title: 'DOOR_TIME'},
    //         {id: 'Inout', title: 'Inout'},
    //         {id: 'sss', title: 'sss'},
    //         {id: 'lcode', title: 'lcode'},
    //         {id: 'Created_Date', title: 'Created_Date'},
    //         {id: 'FName', title: 'FName'},
    //         {id: 'MachineID', title: 'MachineID'},
    //         {id: 'MACHINETYPE', title: 'MACHINETYPE'},
    //         {id: 'PK_ID', title: 'PK_ID' }
    //     ]
    // });
    //
    // const csvWriter_webdcStarRawData = createCsvWriter({
    //     path: 'uploads/starlinkCSV/webdcStarRawData/'+ req.query.startDate.split("T")[0] +'.csv',
    //     header: [
    //         {id: 'CARDNO', title: 'CARDNO'},
    //         {id: 'OFFICEPUNCH', title: 'OFFICEPUNCH'},
    //         {id: 'REASONCODE', title: 'REASONCODE'},
    //         {id: 'PROCESS', title: 'PROCESS'},
    //         {id: 'PUNCHFLAG', title: 'PUNCHFLAG'},
    //         {id: 'MACHINEID', title: 'MACHINEID'},
    //         {id: 'EDATE', title: 'EDATE'},
    //         {id: 'MACHINENO', title: 'MACHINENO'},
    //         {id: 'PUNCHTYPE', title: 'PUNCHTYPE'},
    //         {id: 'Latitude', title: 'Latitude'},
    //         {id: 'Longitude', title: 'Longitude'},
    //         {id: 'MAIL_Send_Flag', title: 'MAIL_Send_Flag'},
    //         {id: 'MAIL_Send_Date', title: 'MAIL_Send_Date'},
    //         {id: 'SMS_Send_Flag', title: 'SMS_Send_Flag'},
    //         {id: 'SMS_Send_Date', title: 'SMS_Send_Date'},
    //         {id: 'ID_NO', title: 'ID_NO'},
    //         {id: 'INOUT', title: 'INOUT'},
    //         {id: 'Fname', title: 'Fname'},
    //         {id: 'MACHINETYPE', title: 'MACHINETYPE'}
    //     ]
    // });

    csvWriter_tempStarLinkFormat.writeRecords(csvJsonArray_tempStarLinkFormat)       // returns a promise
    .then(() => {
        console.log('...csvJsonArray_tempStarLinkFormat Done');
    });

    // csvWriter_rawData.writeRecords(csvJsonArray_rawData)       // returns a promise
    // .then(() => {
    //     console.log('...csvJsonArray_rawData Done');
    // });
    // csvWriter_webdcStarRawData.writeRecords(csvJsonArray_webdcStarRawData)       // returns a promise
    // .then(() => {
    //     console.log('...csvJsonArray_webdcStarRawData Done');
    // });

    return res.json(doc)
  }).catch(err => {
    console.log("unable to generate csv", err);
  });
}

exports.updateFrame = (req, res) => {
  try {
    let frameId = req.params.id
    let matchObject = {
      _id: ObjectId(frameId)
    }

    let updateObject = {}
    if (req.body.aiInfo) updateObject['aiInfo'] = req.body.aiInfo
    if (req.body.personsDetected) updateObject['personsDetected'] = req.body.personsDetected

    console.log("\n\n", matchObject, "ff", updateObject, "\n\n")
    var query = Frame.updateOne(matchObject, {
      $set: updateObject
    }).exec();
    query.then(function(doc) {
      console.log(doc)
      return res.json(doc)
    });
  } catch (err) {
    console.log(err)
  }
}
