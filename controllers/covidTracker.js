const Covid = require('../models/Covid');
const Employee = require('../models/Employee');
const Groups = require('../models/Groups');
const ObjectId = (require('mongoose').Types.ObjectId);
var moment = require('moment');
const Frame = require('../models/faceFrame');

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

const request = require('request');
const logSymbols = require('log-symbols');

function compareWithInfectedPersonAPI(data) {
  return new Promise((resolve, reject) => {
    request('https://api.covid19india.org/travel_history.json', { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      travel_history = body.travel_history
      distanceCalculated = []

      for (var i = 0; i < travel_history.length; i++) {
        lat = parseFloat(travel_history[i]['latlong'].split(",")[0])
        long = parseFloat(travel_history[i]['latlong'].split(",")[1])
        // sample Infected = 11.188557, 76.262159
        // sample My Address = 28.359422, 77.187938
        distanceFromCurrent = distance(lat, long, data['lat'], data['long'], data['unit'])
        if(distanceFromCurrent < data['range']) {
          distanceCalculated.push({
            "distanceFromHisCoordinates" : distanceFromCurrent + " Km",
            "address" : travel_history[i]["address"],
            "type" : travel_history[i]["type"],
            "timefrom" : travel_history[i]["timefrom"],
            "timeto" : travel_history[i]["timeto"]
          })
        }
      }

      resolve(distanceCalculated)

    })
  })
}

exports.inspectByAdress = (req, res) => {

  compareWithInfectedPersonAPI({
    lat: parseFloat(req.query.latlong.split(",")[0]),
    long: parseFloat(req.query.latlong.split(",")[1]),
    unit: "K",
    range: parseInt(req.query.range)
  }).then(function(distanceCalculated) {
    if(distanceCalculated.length > 1) {
      console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n")
      console.log(logSymbols.error,logSymbols.error,logSymbols.error,logSymbols.error, "Please Avoid, As you have been suspected to be near infected person",logSymbols.error,logSymbols.error,logSymbols.error,logSymbols.error,"\n")
      console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
      console.log(distanceCalculated)
    } else {
      console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n")
      console.log(logSymbols.success,logSymbols.success,logSymbols.success,logSymbols.success,"Good to Go",logSymbols.success,logSymbols.success,logSymbols.success,logSymbols.success, "\n")
      console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    }
    return res.json(distanceCalculated)
  }).catch(err => {
    console.log("unable to save to database", err);
  });
}

exports.setBodyTemprature = (req,res) => {
	console.log("hereeeeee")
	let bodyTemp = req.body.bodyTemp;
	let empId = req.body.empId;
	let asAppStatus = req.body.asAppStatus;
	let frameId = req.body.frameId;

	console.log(bodyTemp, empId);
	let dataToBeInserted = new Covid ({
			empId: empId,
			bodyTemp: bodyTemp,
			time: new Date(moment().add(5,'hours').add(30,'minutes').toISOString()),
			asAppStatus: asAppStatus,
			frameId: ObjectId(frameId),
			frameIdString: frameId
		})

	dataToBeInserted.save(function(err){
		if(err){
			console.log("unable to save covid data", err);
		}

		try {
	    let matchObject = {
	      _id: ObjectId(frameId)
	    }

	    let updateObject = {}
	    updateObject['autoTemp'] = {
				temp: bodyTemp,
				time: new Date(moment().add(5,'hours').add(30,'minutes').toISOString())
			}
			console.log("ff", updateObject)
	    var query = Frame.updateOne(matchObject, {
	      $set: updateObject
	    }).exec();
	    query.then(function(doc) {
	      console.log("frameupdated", doc)
	      // return res.json(doc)
				return res.json(dataToBeInserted)
	    });

	  } catch (err) {
	    console.log(err)
	  }
	})
}

exports.getTempratureData = (req,res) => {

	let bodyTemp = req.query.bodyTemp;
	let empId = req.query.empId;
	let aggPipeline = []

	if(empId) {
		aggPipeline.push({
			$match: {
				empId: empId
			}
		})
	}

	aggPipeline.push({
		$group : {
			_id: "$empId",
			data: { $push: "$$ROOT" }
		}
	})

	let query = Covid.aggregate(aggPipeline).allowDiskUse(true).exec();

  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to resolve manpower query", err);
  });

}

exports.getGeneralData = async (req,res) => {

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

	let startDate = req.query.startDate;
	let endDate = req.query.endDate;
	let aggPipeline = []

	if(startDate && endDate) {
		aggPipeline.push({
			$match : {
				time: {
		      $gte: new Date(req.query.startDate),
		      $lte: new Date(req.query.endDate)
		    }
			}
		})
	}

	aggPipeline.push({
		$group : {
			_id: "$empId",
			data: { $push: "$$ROOT" }
		}
	})

	aggPipeline.push(
		{
      "$lookup": {
        "from": "employee",
        "localField": "_id",
        "foreignField": "empId",
        "as": "employeeDetails"
      }
    },
		{
      "$unwind": { path: "$employeeDetails", preserveNullAndEmptyArrays: true }
    },
		{
			"$project": {
				_id: 1,
				data: 1,
				companyId: "$employeeDetails.company",
				plantId: "$employeeDetails.plant"
 			}
		}
	)

	if(frGroupMembers != undefined) {
		if(frGroupMembers.length > 0) {
			let tempMatchObject = {
				$match: {
					$or: []
				}
			}
			for (var fIndex = 0; fIndex < frGroupMembers.length; fIndex++) {
				tempMatchObject["$match"]["$or"].push({
					plantId : frGroupMembers[fIndex]
				})
				console.log(tempMatchObject["$match"]["$or"], frGroupMembers[fIndex])
			}
			aggPipeline.push(tempMatchObject)
		}
	} else {
		if (req.query.plantId) {
			aggPipeline.push({
				"$match": {
					"companyId": req.query.companyId,
					"plantId": req.query.plantId,
				}
			})
		}
	}

	let query = Covid.aggregate(aggPipeline).allowDiskUse(true).exec();

  query.then(function(doc) {
    return res.json(doc)
  }).catch(err => {
    console.log("unable to resolve manpower query", err);
  });
}
