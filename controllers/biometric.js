const excelToJson = require('convert-excel-to-json');
const fs = require('fs')
const pathModule = require('path')


function countOfPeople (data, dateReq) {
  data = data['Sheet1'];
  tempEmpArray = []
  let count = 0;
  try {
    // console.log(data)
    for (var cIndex = 0; cIndex < data.length; cIndex++) {
      if(data[cIndex]['F'] && data[cIndex]['H']) {
        var regex1 = RegExp('^ *$');
        if(!regex1.test(data[cIndex]['F']) || !regex1.test(data[cIndex]['H'])) {
          let tempEmpObject = {
            empId : data[cIndex]['B'],
            empName : data[cIndex]['C'],
            entryTime : new Date(dateReq + "T" + data[cIndex]['F'].toISOString().split("T")[1]),
            exitTime : new Date(dateReq + "T" + data[cIndex]['H'].toISOString().split("T")[1])
          }
          // console.log(data[cIndex])
          // console.log(data[cIndex]['C'], "--", data[cIndex]['F'] ,data[cIndex]['F'].length, data[cIndex]['H'])
          tempEmpArray.push(tempEmpObject)
          count++;
        }
      }
    }
  } catch(err) {
    console.log("Error in Parsing Excel", err)
  }
  return {count, tempEmpArray};
}

exports.dataInfo = (req, res) => {
  let plantId = req.query.plantId
  let companyId = req.query.companyId

  let pathOfFrGroup = undefined
  if(req.query.frGroupName) {
    pathOfFrGroup = req.query.frGroup + "/" + req.query.frGroupName
  } else {
    pathOfFrGroup = plantId
  }
  let path = pathModule.dirname(__dirname) + '/uploads/biometricAttendance/'+ companyId + "/" + pathOfFrGroup + "/" +req.query.startDate.split("T")[0] +'.xls';
  console.log(path)
  try {
    if (fs.existsSync(path)) {
      console.log("here", path)
      //file exists
      const result = excelToJson({
        sourceFile: path,
        header:{
            rows: 9
        }
      });
      let dateReq = req.query.startDate.split("T")[0];
      let countOfPeopleResult = countOfPeople(result, dateReq);
      return res.json({
        countPresent : countOfPeopleResult.count,
        empArray : countOfPeopleResult.tempEmpArray
      })
    } else {
      return res.json({
        countPresent : null,
        empArray : []
      })
    }
  } catch(err) {
    console.error(err)
  }
  // let aggPipeline = []
  //
  // var query = Frame.aggregate(aggPipeline).allowDiskUse(true).exec();
  // query.then(function(doc) {
  //   return res.json(doc)
  // }).catch(err => {
  //   console.log("unable to save to database", err);
  // });
}
