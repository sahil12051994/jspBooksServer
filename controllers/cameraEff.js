const MongoClient = require('mongodb')
const Json2csvParser = require('json2csv').Parser;
const Manpower = require('../models/PlannedManpower');
const Processed = require('../models/ProcessedFrames');
const Intelligence = require('../models/IntelligenceReport')
const CameraEfficiency = require('./cameraEff')
const math = require('mathjs');
const moment = require('moment');
var fs = require('fs');

// let url = "mongodb://jbmTest3:jbm%40234@localhost:27017/facialRecogntion?authMechanism=SCRAM-SHA-1&authSource=admin";

function fetchFrameDataCamId(startTime,endTime,camID){
    return new Promise(function(resolve, reject) {
      var query = Processed.find({
          time: {
              "$gte": startTime,
              "$lte": endTime,
          },
          camId:camID
      }).exec();
      query.then(function(doc) {
        resolve(doc);
      }).catch(err => {
        console.log(err);
      });
    })
}

function fetchManPowerFromDBCamId(date,camId) {
    return new Promise(function(resolve, reject) {
      var query = Manpower.find({
          date: {$in : date},
          camId:camId
      }).exec();
      query.then(function(doc) {
        resolve(doc);
      }).catch(err => {
        console.log(err);
      });
    })
}

function getEfficiencySpan(data) {
    let startTime = (typeof data['start_time'] == "string") ? new Date(data['start_time']) : data['start_time']
    let endTime = (typeof data['end_time'] == "string") ? new Date(data['end_time']) : data['end_time']
    let camID = data['camId']
    // console.log(startTime, endTime, camID)
    let p1 = fetchFrameDataCamId(startTime,endTime,camID);
    let dates = getDates(startTime,endTime);
    let p2 = fetchManPowerFromDBCamId(dates,camID);
    return (Promise.all([p1, p2]).then(function(values) {
      return {"efficiency":calcEfficiencySpan(values[0], values[1]), "number_of_frames":values[0].length};
    }).catch(err => {
      console.log(err);
    }))
}

exports.getEfficiencySpan = getEfficiencySpan;

function getNumberFromAString(string){
  return string.match(/\d+/)[0];
}


function getDates(startDate, stopDate) {
  let dateArray = [];
  let midNightTime = "T00:00:00.000Z";

  startDate = new Date(startDate.toISOString().split("T")[0] + midNightTime);
  stopDate = new Date(stopDate.toISOString().split("T")[0] + midNightTime);

  let tempDate = startDate;
  if(startDate.toISOString().split("T")[0] === stopDate.toISOString().split("T")[0]){
    dateArray.push(tempDate);
  }else if(startDate.getTime()<stopDate.getTime()){
    dateArray.push(tempDate);
    while(tempDate.getTime()<stopDate.getTime()){
      tempDate = new Date(tempDate.getTime()+24*3600*1000);
      dateArray.push(tempDate);
    }
  }
  return dateArray;
}


function calcEfficiencySpan(p1,p2){
  let peopleDetected = 0;
  let peoplePlanned = 0;
  let time;
  let avgEffi = 0;
  let count = 0;
  for(let i = 0;i<p1.length;i++){
      if(p1[i]["bboxes"] == undefined){
        p1[i]["bboxes"] = [];
      }
      if(p1[i]["bboxes"] && p1[i]["time"] ){
        peopleDetected = p1[i]["bboxes"].length;
        time = p1[i]["time"];
        peoplePlanned = getInstancePlannedManPower(p2,time);
        if(peoplePlanned){
          if(peoplePlanned["Type"] == 0 && peoplePlanned["planned_manpower"] != 0){
            avgEffi = (count*avgEffi + peopleDetected/peoplePlanned["planned_manpower"])/(count + 1);
            count++;
          }else{
            continue;
          }
        }
      }
  }
  // console.log("calculated eff", avgEffi)
  return avgEffi;
}

function getInstancePlannedManPower(plannedManPower,timeStamp){
  let plannedManPowerDay = undefined;
  for(let i = 0;i<plannedManPower.length;i++){
    let t1 = (new Date(plannedManPower[i]["date"])).toISOString();
    let t2 = (new Date(timeStamp.toISOString().split("T")[0])).toISOString();
    if(t1 == t2){
      plannedManPowerDay = plannedManPower[i]["data"];
      break;
    }

  }
  if(!plannedManPowerDay){
    return;
  }
  let plannedManPowerInstance = undefined;
  for(let i = 0;i<plannedManPowerDay.length;i++){
    let startTime = plannedManPowerDay[i]["start_time"];
    let endTime = plannedManPowerDay[i]["end_time"];
    if(startTime < timeStamp && endTime >timeStamp){
      plannedManPowerInstance = plannedManPowerDay[i];
      break;
    }
  }
  return plannedManPowerInstance;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////
// app.get('/chartserver/getManSecondLoss', function(req, res) {
//     let startTime = new Date(req.query.startTime);
//     let endTime = new Date(req.query.endTime);
//     let camID = req.query.camID;
//
//     dbClient.getManSecondLoss(startTime, endTime, camID).then(function(value) {
//         console.log("calculating msl...");
//         res.json({
//             value
//         });
//     });
// })
// import MongoClient from 'mongodb'
// const Json2csvParser = require('json2csv').Parser;
// var fs = require('fs');
// var fsExtra = require('fs-extra');
// var pFS = require('../utils/common.js');
// var mathJS = require('mathjs');
// var pDates = require('../pDates/pDates.js');
// var Request = require("request");
//
// let url = "mongodb://jbmTest3:jbm%40234@localhost:27017/facialRecogntionDB?authMechanism=SCRAM-SHA-1&authSource=admin";
// let fields = ["People Detected", "Camera ID", "Time", "Planned Manpower", "Camera Effieciency","Schedule"];
// var upper = "<!doctype html><html><head><title>grpah</title></head><body><div id='app'></div><script src='https://cdn.plot.ly/plotly-latest.min.js'></script><script>var peopleDetected = {x: [],y: [],mode: 'lines+markers'};var plannedManPower = {x: [],y: [],mode: 'lines+markers'};"
// var lower = "data = [peopleDetected,plannedManPower];let layout = {};Plotly.newPlot('app', data, layout, {showSendToCloud: true});</script></body></html>"
//
//
//
// function exportCSV(fields, json, name, dirName, central, averageEffi) {
//     const json2csvParser = new Json2csvParser({
//         fields
//     });
//     const csv = json2csvParser.parse(json);
//     fs.writeFile(dirName + '/' + name + '.csv', csv, 'utf8', function(err) {
//         if (err) {
//             console.log('Some error occured - file either not saved or corrupted file saved.');
//         } else {
//             console.log("File saved");
//         }
//     });
//
//      let upper = "<!doctype html><html><head><title>grpah</title></head><body><div id='app'></div><h1>Average Effieciency =" + averageEffi * 100 + "%" + "</h1><script src='https://cdn.plot.ly/plotly-latest.min.js'></script><script>var peopleDetected = {x: [],y: [],mode: 'lines+markers',name: 'People Detected'};var plannedManPower = {x: [],y: [],mode: 'lines+markers',name: 'Planned Manpower'};"
//      let lower = "data = [peopleDetected,plannedManPower];let layout = {};Plotly.newPlot('app', data, layout, {showSendToCloud: true});</script></body></html>"
//     //
//      let finalHTML = upper + central + lower;
//      fs.writeFile(dirName + '/' + name + '.html', finalHTML, function(err, data) {
//          if (err) console.log(err);
//          console.log("Successfully Written to File.", averageEffi);
//      });
// }
//
// function exportCSVSync(fields, json, name, dirName, central, averageEffi) {
//     const json2csvParser = new Json2csvParser({
//         fields
//     });
//     const csv = json2csvParser.parse(json);
//     fsExtra.writeFileSync(dirName + '/' + name + '.csv', csv, 'utf8');
//
//     let upper = "<!doctype html><html><head><title>grpah</title></head><body><div id='app'></div><h1>Average Effieciency =" + averageEffi * 100 + "%" + "</h1><script src='https://cdn.plot.ly/plotly-latest.min.js'></script><script>var peopleDetected = {x: [],y: [],mode: 'lines+markers',name: 'People Detected'};var plannedManPower = {x: [],y: [],mode: 'lines+markers',name: 'Planned Manpower'};"
//     let lower = "data = [peopleDetected,plannedManPower];let layout = {};Plotly.newPlot('app', data, layout, {showSendToCloud: true});</script></body></html>"
//
//     let finalHTML = upper + central + lower;
//     fsExtra.writeFileSync(dirName + '/' + name + '.html', finalHTML);
// }
//
// //inserting a single doc in db
// export function insertSingleDocInDB(doc) {
//     MongoClient.connect(url, function(err, db) {
//         if (err) throw err;
//         var dbo = db.db("facialRecogntionDB");
//         dbo.collection("alerts").insertOne(doc, function(err, res) {
//             if (err) throw err;
//             console.log("1 document inserted");
//             db.close();
//         });
//     });
// }
//
//
// //view a collection
// export function viewPastAlert(startTime, endTime, camID) {
//     return new Promise(function(resolve, reject) {
//         MongoClient.connect(url, function(err, db) {
//             if (err) {
//                 console.log("\nFailure:Error establishing connection with database...\n");
//                 throw err;
//             }
//             console.log("\nSuccess:Connection established with the database...\n");
//             var dbo = db.db("facialRecogntionDB");
//
//             if (camID != undefined) {
//                 dbo.collection("alerts").find({
//                     time: {
//                         "$gte": startTime,
//                         "$lte": endTime,
//                     },
//                     camId: camID
//                 }).toArray(function(err, result) {
//                     if (err) {
//                         console.log("\nFailure:Error fetching data from database2...\n");
//                         throw err;
//                     }
//                     console.log("\nSuccess:Data fetched from database(fetchManPowerFromDB)...\n");
//                     resolve(result);
//                     db.close();
//                 });
//             } else {
//                 dbo.collection("alerts").find({
//                     time: {
//                         "$gte": startTime,
//                         "$lte": endTime,
//                     }
//                 }).toArray(function(err, result) {
//                     if (err) {
//                         console.log("\nFailure:Error fetching data from database2...\n");
//                         throw err;
//                     }
//                     console.log("\nSuccess:Data fetched from database(fetchManPowerFromDB)...\n");
//                     resolve(result);
//                     db.close();
//                 });
//             }
//
//         });
//     })
// }
// //setTimeout(viewCollection,120000);
//
//
// export function fetchManPowerFromDB(date) {
//     return new Promise(function(resolve, reject) {
//         MongoClient.connect(url, function(err, db) {
//             if (err) {
//                 console.log("\nFailure:Error establishing connection with database...\n");
//                 throw err;
//             }
//             console.log("\nSuccess:Connection established with the database...\n");
//             var dbo = db.db("facialRecogntionDB");
//             dbo.collection("plannedManPower").find({
//                 date: date,
//             }).toArray(function(err, result) {
//                 if (err) {
//                     console.log("\nFailure:Error fetching data from database2...\n");
//                     throw err;
//                 }
//                 console.log("\nSuccess:Data fetched from database(fetchManPowerFromDB)...\n");
//                 //console.log("fetchManPowerFromDB",result);
//                 resolve(result);
//                 db.close();
//             });
//         });
//     })
// }
//
//
// function fetchFrameData(startTime, endTime) {
//     return new Promise(function(resolve, reject) {
//         MongoClient.connect(url, function(err, db) {
//             if (err) {
//                 console.log("\nFailure:Error establishing connection with database...\n");
//                 throw err;
//             }
//             console.log("\nSuccess:Connection established with the database...\n");
//             var dbo = db.db("facialRecogntionDB");
//             dbo.collection("processedFrames").find({
//                 time: {
//                     "$gte": startTime,
//                     "$lte": endTime,
//                 }
//             }).toArray(function(err, result) {
//                 if (err) {
//                     console.log("\nFailure:Error fetching data from database...\n");
//                     throw err;
//                 }
//                 console.log("\nSuccess:Data fetched from database(fetchFrameData)...\n");
//                 //console.log("fetchFrameData = ",result);
//                 resolve(result);
//                 db.close();
//             });
//         });
//     })
// }
//
// export function generateReport(startTime,endTime,todaysDate) {
//     let p1 = fetchFrameData(startTime,endTime);
//     let p2 = fetchManPowerFromDB(todaysDate);
//     return (Promise.all([p1, p2]).then(function(values) {
//       return runAnalysis(values[0], values[1]);
//     }).catch(err => {
//       console.log(err);
//     }))
// }
//
//
// function runAnalysis(processedFramesData, plannedManPowerData) {
//     let camIDs = {};
//
//     //create a directory to generate report
//
//     let dirName = pFS.getDirPath(1,__dirname) + '/data/hourlyCameraReports/' + 'report'
//     if (!fs.existsSync(dirName)) {
//         fs.mkdirSync(dirName);
//     }else if(fs.existsSync(dirName)){
//         fsExtra.removeSync(dirName);
//         fs.mkdirSync(dirName);
//     }
//     //from processedFrames data we list out all the availble camera Ids
//     for (let i = 0; i < processedFramesData.length; i++) {
//         camIDs[processedFramesData[i]["camId"]] = processedFramesData[i]["camId"];
//     }
//
//     for (var key in camIDs) {
//         let camNumber = key;//getNumberFromAString(key);
//         //filter out the plannedManPower of current camera
//         let currentCamPlannedManPowerData;
//         for (let i = 0; i < plannedManPowerData.length; i++) {
//             if (plannedManPowerData[i]["camId"] == camNumber) {
//                 currentCamPlannedManPowerData = plannedManPowerData[i]["data"];
//                 break;
//             }
//         }
//
//         //making a json array of  current cam that will be exported to csv
//         let arr = [];
//         let count = 1;
//         let cameraEfficiency = 0;
//         let centralTrace1y = "peopleDetected.y.push(";
//         let centralTrace1x = "peopleDetected.x.push(";
//         let centralTrace2y = "plannedManPower.y.push(";
//         let centralTrace2x = "plannedManPower.x.push(";
//         for (let i = 0; i < processedFramesData.length; i++) {
//             if (processedFramesData[i]["camId"] == key) {
//
//                 let tempBlob = {};
//                 if (processedFramesData[i]["bboxes"]) {
//                     tempBlob["People Detected"] = processedFramesData[i]["bboxes"].length;
//                 } else {
//                     tempBlob["People Detected"] = 0;
//                 }
//                 tempBlob["Camera ID"] = key;
//                 tempBlob["Time"] = processedFramesData[i]["time"];
//                 if (currentCamPlannedManPowerData) {
//                     let plannedManPowerInstance = undefined;
//                     let i;
//                     //console.log(currentCamPlannedManPowerData.length);
//                     for (i = 0; i < currentCamPlannedManPowerData.length; i++) {
//                         //console.log("xxxxxxxxxxxxx");
//                         let t1 = new Date(currentCamPlannedManPowerData[i]["start_time"]);
//                         let t2 = new Date(currentCamPlannedManPowerData[i]["end_time"]);
//                         let t3 = new Date(tempBlob["Time"]);
//                         //console.log("yyyyyyyyyy");
//                         if (t3 < t2 && t3 > t1) {
//                             plannedManPowerInstance = currentCamPlannedManPowerData[i]["planned_manpower"];
//                             break;
//                         }
//                     }
//                     if (plannedManPowerInstance != undefined) {
//                         tempBlob["Planned Manpower"] = plannedManPowerInstance;
//
//                         if (currentCamPlannedManPowerData[i]["Type"] == 1) {
//                             tempBlob["Schedule"] = "break"
//                         } else if (currentCamPlannedManPowerData[i]["Type"] == 0) {
//                             tempBlob["Schedule"] = "work"
//                         }else{
//                             tempBlob["Schedule"] = "unspecified"
//                         }
//                     }else{
//                         tempBlob["Planned Manpower"] = "NA"
//                     }
//                     if(tempBlob["Planned Manpower"] != 0){
//                       tempBlob["Camera Effieciency"] = 100 * (tempBlob["People Detected"] / tempBlob["Planned Manpower"]) + '%';
//                       cameraEfficiency = cameraEfficiency + tempBlob["People Detected"] / tempBlob["Planned Manpower"];
//                       count++;
//                     }else if(tempBlob["Planned Manpower"] == 0 && tempBlob["People Detected"] == 0){
//                       tempBlob["Camera Effieciency"] = 0;
//                     }else if(tempBlob["Planned Manpower"] == 0 && tempBlob["People Detected"] != 0) {
//                       tempBlob["Camera Effieciency"] = "Infinity"
//                     }else{
//                       tempBlob["Camera Effieciency"] = "NA"
//                     }
//                     //cameraEfficiency = cameraEfficiency + tempBlob["People Detected"] / tempBlob["Planned Manpower"];
//
//                 } else {
//                     tempBlob["Planned Manpower"] = "NA";
//                     tempBlob["Camera Effieciency"] = "NA";
//                     tempBlob["Schedule"] = "NA"
//                     //cameraEfficiency = "NA";
//                 }
//                 arr.push(tempBlob);
//
//                 let tyme = new Date(tempBlob['Time']);
//                 tyme = tyme.getTime(); // + '-' + tyme.getMinutes();
//                 centralTrace1y = centralTrace1y + tempBlob['People Detected'];
//                 centralTrace1x = centralTrace1x + tyme;
//
//                 if (tempBlob["Planned Manpower"] != "NA") {
//                     centralTrace2y = centralTrace2y + tempBlob['Planned Manpower'];
//                     centralTrace2x = centralTrace2x + tyme;
//                 }
//
//                 centralTrace1y = centralTrace1y + ",";
//                 centralTrace1x = centralTrace1x + ",";
//                 if (tempBlob["Planned Manpower"] != "NA") {
//                     centralTrace2y = centralTrace2y + ",";
//                     centralTrace2x = centralTrace2x + ",";
//                 }
//             }
//         }
//         let averageEffi = cameraEfficiency / count;
//
//         centralTrace1y = centralTrace1y.slice(0, -1);
//         centralTrace1x = centralTrace1x.slice(0, -1);
//         centralTrace2y = centralTrace2y.slice(0, -1);
//         centralTrace2x = centralTrace2x.slice(0, -1);
//         let central = centralTrace1y + ");" + centralTrace1x + ");" + centralTrace2y + ");" + centralTrace2x + ");";
//         exportCSVSync(fields, arr, key, dirName, central, averageEffi);
//     }
//     console.log("runAnalysis done");
//     //return "Analysis Done";
// }
//
//
// export function fetchFrameDataCamId(startTime,endTime,camID){
//     return new Promise(function(resolve, reject) {
//         MongoClient.connect(url, function(err, db) {
//             if (err) {
//                 console.log("\nFailure:Error establishing connection with database...\n");
//                 throw err;
//             }
//             console.log("\nSuccess:Connection established with the database...\n");
//             var dbo = db.db("facialRecogntionDB");
//             dbo.collection("processedFrames").find({
//                 time: {
//                     "$gte": startTime,
//                     "$lte": endTime,
//                 },
//                 camId:camID
//             }).toArray(function(err, result) {
//                 if (err) {
//                     console.log("\nFailure:Error fetching data from database...\n");
//                     throw err;
//                 }
//                 console.log("\nSuccess:Data fetched from database(fetchFrameDataCamId)...\n");
//                 //console.log("fetchFrameDataCamId = ",result);
//                 resolve(result);
//                 db.close();
//             });
//         });
//     })
// }
//
// function fetchManPowerFromDBCamId(date,camId) {
//     return new Promise(function(resolve, reject) {
//         MongoClient.connect(url, function(err, db) {
//             if (err) {
//                 console.log("\nFailure:Error establishing connection with database...\n");
//                 throw err;
//             }
//             console.log("\nSuccess:Connection established with the database...\n");
//             var dbo = db.db("facialRecogntionDB");
//             dbo.collection("plannedManPower").find({
//                 date: {$in : date},
//                 camId:camId
//             }).toArray(function(err, result) {
//                 if (err) {
//                     console.log("\nFailure:Error fetching data from database...\n");
//                     reject();
//                     throw err;
//                 }
//                 console.log("\nSuccess:Data fetched from database(fetchManPowerFromDBCamId)...\n");
//                 //console.log("fetchManPowerFromDB",result);
//                 resolve(result);
//                 db.close();
//             });
//         });
//     })
// }
//
//
// export function getCamDetailsFromDB() {
//     return new Promise(function(resolve, reject) {
//         MongoClient.connect(url, function(err, db) {
//             if (err) {
//                 console.log("\nFailure:Error establishing connection with database...\n");
//                 throw err;
//             }
//             console.log("\nSuccess:Connection established with the database...\n");
//             var dbo = db.db("facialRecogntionDB");
//             dbo.collection("cameras").find({}).toArray(function(err, result) {
//                 if (err) {
//                     console.log("\nFailure:Error fetching data from cameras...\n");
//                     throw err;
//                 }
//                 console.log("\nSuccess:Data fetched from database(getCamDetailsFromDB)...\n");
//                 resolve(result);
//                 db.close();
//             });
//         });
//     })
// }
//
// //fetchManPowerFromDBCamId(new Date("2019-03-19"),"camera_50")
// //getEfficiencySpan(new Date("2019-03-24T14:00:00.000Z"),new Date("2019-03-24T14:59:59.000Z"),"camera_50");
//
// export function getEfficiencySpan(startTime,endTime,camID) {
//     if(!startTime || !endTime || !camID){
//        //throw new Error("Invalid Parameters");
//        return {};
//     }
//     let p1 = fetchFrameDataCamId(startTime,endTime,camID);
//     let dates = getDates(startTime,endTime);
//     let p2 = fetchManPowerFromDBCamId(dates,camID);
//     return (Promise.all([p1, p2]).then(function(values) {
//       return calcEfficiencySpan(values[0], values[1]);
//     }).catch(err => {
//       console.log(err);
//     }))
// }
//
// export function getManSecondLoss(startTime,endTime,camID) {
//     if(!startTime || !endTime || !camID){
//        //throw new Error("Invalid Parameters");
//        return {};
//     }
//     let p1 = fetchFrameDataCamId(startTime,endTime,camID);
//     let dates = getDates(startTime,endTime);
//     let p2 = fetchManPowerFromDBCamId(dates,camID);
//     return (Promise.all([p1, p2]).then(function(values) {
//       return calcManSecLoss(values[0], values[1]);
//     }).catch(err => {
//       console.log(err);
//     }))
// }
//
//
// function getDates(startDate, stopDate) {
//   let dateArray = [];
//   let midNightTime = "T00:00:00.000Z";
//
//   startDate = new Date(startDate.toISOString().split("T")[0] + midNightTime);
//   stopDate = new Date(stopDate.toISOString().split("T")[0] + midNightTime);
//
//   let tempDate = startDate;
//   if(startDate.toISOString().split("T")[0] === stopDate.toISOString().split("T")[0]){
//     dateArray.push(tempDate);
//   }else if(startDate.getTime()<stopDate.getTime()){
//     dateArray.push(tempDate);
//     while(tempDate.getTime()<stopDate.getTime()){
//       tempDate = new Date(tempDate.getTime()+24*3600*1000);
//       dateArray.push(tempDate);
//     }
//   }
//   return dateArray;
// }
//
//
// //biggest Effieciency drop
// export function calcManSecLoss(p1, p2) {
//     let time;
//     let deltaTthreshold = 25;
//     let peoplePlanned;
//     let peopleDetected;
//     let peopleDetectedMode;
//     let modeArray = [];
//     let previous_msl = 0;
//     let span_man_seconds_lost;
//     let tempBlob = {};
//     let finalReport = [];
//     let counter_1 = 0;
//     for (let i = 0; i < p1.length-1; i++) {
//         if (p1[i]["bboxes"] == undefined) {
//             p1[i]["bboxes"] = [];
//         };
//         if (p1[i]["bboxes"] && p1[i]["time"]) {
//             time = p1[i]["time"];
//             peopleDetected = p1[i]["bboxes"].length;
//             modeArray.push(peopleDetected);
//             if (modeArray.length > 12) {
//                 modeArray.shift();
//             }
//             peopleDetectedMode = mathJS.mode(modeArray)[0];
//             peoplePlanned = getInstancePlannedManPower(p2, time);
//             if (peoplePlanned) {
//               if(peopleDetectedMode>peoplePlanned["planned_manpower"])peopleDetectedMode = peoplePlanned["planned_manpower"];
//               let manpower_Shortage = peoplePlanned["planned_manpower"] - peopleDetectedMode;
//               let deltaT = (p1[i+1]["time"] - p1[i]["time"])/1000;
//               deltaT = Math.min(deltaT,deltaTthreshold);
//               if(deltaT==0)continue;
//               let man_seconds_lost = manpower_Shortage*deltaT;
//
//               let schedule = peoplePlanned["Type"]?"Break":"Work";
//
//               if(previous_msl == 0 && man_seconds_lost != 0){
//                 //span start
//                 tempBlob = {};
//                 tempBlob['startTime'] = p1[i]["time"];
//                 tempBlob['avg_manpower_shortage'] = 0;
//                 span_man_seconds_lost = man_seconds_lost;
//                 counter_1 = 0;
//               }else if(previous_msl != 0 && man_seconds_lost == 0){
//                 //span end
//                 tempBlob['endTime'] = p1[i]["time"]
//                 tempBlob['totalPlannedManSecLoss'] = span_man_seconds_lost;
//                 finalReport.push(tempBlob);
//               }else if(previous_msl == 0 && man_seconds_lost == 0){
//
//               }else if(i == p1.length-2){
//                 tempBlob['endTime'] = p1[i]["time"]
//                 tempBlob['totalPlannedManSecLoss'] = span_man_seconds_lost;
//                 finalReport.push(tempBlob);
//               }else{
//                 span_man_seconds_lost = span_man_seconds_lost + man_seconds_lost;
//                 tempBlob['avg_manpower_shortage'] = (tempBlob['avg_manpower_shortage']*counter_1 + manpower_Shortage)/(counter_1+1);
//                 counter_1++;
//               }
//
//               previous_msl = man_seconds_lost;
//             }
//         }
//     }
//     //console.log('finalReport',finalReport);
//     finalReport.sort(function(a, b) {
//             var keyA = new Date(a.totalPlannedManSecLoss),
//                 keyB = new Date(b.totalPlannedManSecLoss);
//             // Compare the 2 dates
//             if (keyA < keyB) return 1;
//             if (keyA > keyB) return -1;
//             return 0;
//         });
//     return finalReport;
// }
//
// function calcEfficiencySpan(p1,p2){
//   let peopleDetected = 0;
//   let peoplePlanned = 0;
//   let peopleDetectedMode = 0;
//   let time;
//   let avgEffi = 0;
//   let avgEffi_mode = 0;
//   let count = 0;
//   let modeArray = [0];
//   for(let i = 0;i<p1.length;i++){
//       if(p1[i]["bboxes"] == undefined){
//         p1[i]["bboxes"] = [];
//       };
//       if(p1[i]["bboxes"] && p1[i]["time"] ){
//         time = p1[i]["time"];
//         peopleDetected = p1[i]["bboxes"].length;
//         modeArray.push(peopleDetected);
//         if (modeArray.length > 12) {
//             modeArray.shift();
//         }
//         peopleDetectedMode = mathJS.mode(modeArray)[0];
//         peoplePlanned = getInstancePlannedManPower(p2,time);
//         if(peoplePlanned){
//           if(peoplePlanned["Type"] == 0 && peoplePlanned["planned_manpower"] != 0){
//             avgEffi = (count*avgEffi + peopleDetected/peoplePlanned["planned_manpower"])/(count + 1);
//             avgEffi_mode = (count*avgEffi_mode + peopleDetectedMode/peoplePlanned["planned_manpower"])/(count + 1);
//             count++;
//           }else{
//             continue;
//           }
//         }
//       }
//   }
//   avgEffi = Math.min(avgEffi,1);
//   avgEffi_mode = Math.min(avgEffi_mode,1);
//   return {avgEffi,count,avgEffi_mode}
// }
//
// export function getInstancePlannedManPower(plannedManPower,timeStamp){
//   let plannedManPowerDay = undefined;
//   for(let i = 0;i<plannedManPower.length;i++){
//     let t1 = (new Date(plannedManPower[i]["date"])).toISOString();
//     let t2 = (new Date(timeStamp.toISOString().split("T")[0])).toISOString();
//     //console.log(t1,t2);
//     if(t1 == t2){
//       //console.log("plannedManPower for ",timeStamp," found");
//       plannedManPowerDay = plannedManPower[i]["data"];
//       break;
//     }
//
//   }
//   if(!plannedManPowerDay){
//     return;
//   }
//
//   let plannedManPowerInstance = getInsPLM(plannedManPowerDay,timeStamp);
//   return plannedManPowerInstance;
// }
//
// export function getInsPLM(plannedManPowerDay,timeStamp){
//   let plannedManPowerInstance = undefined;
//   if(plannedManPowerDay == undefined || timeStamp == undefined)return;
//   for(let i = 0;i<plannedManPowerDay.length;i++){
//     let startTime = plannedManPowerDay[i]["start_time"];
//     let endTime = plannedManPowerDay[i]["end_time"];
//     if(startTime < timeStamp && endTime >timeStamp){
//       plannedManPowerInstance = plannedManPowerDay[i];
//       break;
//     }
//   }
//   return plannedManPowerInstance;
// }
//
// export function sampleTimeStamps(startTime, endTime, plant_id) {
//     let sampleTimeStampsArray_A = [];
//     let sampleTimeStampsArray_C = [];
//     let count = 0;
//
//     //Shift A
//     let p = new Promise(function(resolve,reject){
//     for (let i = 0; i < 24; i++) {
//         let tempBlob = {};
//         //tempBlob.endTime = pDates.generateRandomTimeStampsAtDate(dateISOt);
//         //tempBlob.endTime = pDates.generateRandomTimeStampsInBet('2019-05-08T07:00:00.000Z','2019-05-08T19:00:00.000Z');
//         tempBlob.endTime = pDates.generateRandomTimeStampsInBet(startTime,endTime);
//         tempBlob.startTime = (new Date(new Date(tempBlob.endTime) - 300000)).toISOString();
//         tempBlob.totalPersonsFound = 0;
//
//         Request.get("http://localhost:8080/planned/processed?start=" + tempBlob.startTime + "&end=" + tempBlob.endTime + "&plant=" + plant_id, (error, response, body) => {
//             if(error) {
//                 return console.dir(response);
//             }
//             //console.log("yad ",tempBlob.srno," karke = ",(JSON.parse(body)).length);
//             tempBlob.totalPersonsFound = countPeople(JSON.parse(body));
//             //console.log("nmn - ",tempBlob.totalPersonsFound);
//             count++;
//             if(count == 24){
//               //console.log("resolved ",count);
//               resolve();
//             }
//         });
//
//         sampleTimeStampsArray_A.push(tempBlob);
//     }});
//
//     return p.then(function() {
//         //console.log(asd);
//         sampleTimeStampsArray_A.sort(function(a, b) {
//                 var keyA = new Date(a.totalPersonsFound),
//                     keyB = new Date(b.totalPersonsFound);
//                 // Compare the 2 dates
//                 if (keyA < keyB) return 1;
//                 if (keyA > keyB) return -1;
//                 return 0;
//             });
//         //console.log("sampleTimeStampsArray_A = ", sampleTimeStampsArray_A);
//         let count = 1;
//         for(let i = 0;i<sampleTimeStampsArray_A.length-1;i++){
//           let difference = sampleTimeStampsArray_A[i]['totalPersonsFound'] - sampleTimeStampsArray_A[i+1]['totalPersonsFound'];
//           if(difference>5){
//             break;
//           }else{
//             count++;
//           }
//         }
//         sampleTimeStampsArray_A = sampleTimeStampsArray_A.slice(0,count);
//         let avg = 0;
//         for(let i = 0;i<sampleTimeStampsArray_A.length;i++){
//           avg = (avg*(i) + sampleTimeStampsArray_A[i]['totalPersonsFound'])/(i+1);
//         };
//         return Math.ceil(avg);
//     })
// }
//
// function countPeople(data){
//   let memspc = {}
//   for(let i = 0;i<data.length;i++){
//     //console.log(data[i]);
//     if(memspc[data[i]["camId"]] == undefined){
//        memspc[data[i]["camId"]] = [];//people_detected
//        memspc[data[i]["camId"]].push(data[i]["people_detected"]);
//     }else{
//       memspc[data[i]["camId"]].push(data[i]["people_detected"]);
//     }
//   }
//   //console.log(memspc);
//   let count = 0;
//   for(let key in memspc){
//     if(memspc[key].length != 0){
//       memspc[key] = mathJS.mode(memspc[key])[0];
//       count = count + memspc[key];
//     }else{
//       memspc[key] = 'NA'
//     }
//   }
//   return count;
// }
