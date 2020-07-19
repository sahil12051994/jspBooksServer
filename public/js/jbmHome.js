var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

let plant_level_element;
let camera_level_element;
var selected_Plant_ID;
let plannedManPowerTemp;
let totalPlannedObject;
let getAdminData = {};
//var console = {};
//console.log = function(){};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(window).on('load', function() {
  let urlUserId = $.cookie("uId") ? $.cookie("uId") : getUrlParameter('usr');
  $.ajax({
    url: serviceUrl + "user/" + urlUserId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      $(".user_name").html(res.profile.name);
      let index=1;
      console.log(res.profile)
      currentUser = res;
      $.cookie("uId", res._id)
      let divForGraphs = $('#divForGraphs');
    },
    error: function(err) {}
  });

  $('#overAllViewTable').DataTable();
  let yesterday = getdateISOString(-2);
  let today = getdateISOString(0);
  let req1 = getAllPlantsData(yesterday)
  let req2 = getPlannedManpower(yesterday)
  Promise.all([req1,req2]).then(function(values) {
    fillOverAllViewTable({
      plannedTotal : totalPlannedObject,
      plannedManpower : plannedManPowerTemp
    })
  })
});



function getAllPlantsData(date_input_string) { //ajax calling request
  //hit api to get all data
  return $.ajax({
    url: serviceUrl + "getMetrics?date=" + date_input_string,
    type: "GET", //using get methid to fetch the data
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken); //authorization
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      if (res.length == 0) { //condition for not fetching data
        toastr["error"]("No data for this date")
      } else {
        toastr["success"]("Camera Data fetched") //for successful fetch of data
      }
      plannedManPowerTemp = res;
    },
    error: function(err) {
      toastr["error"]("Error fetching data")
      console.log("Error in metrics api for all cameras", err)
    }
  });
  //Code to fill table - call function to fill table fillOverAllViewTable(res)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getPlannedManpower(date_input_string) {
  return $.ajax({
    url: serviceUrl + "planned/manpower?startDate=" + date_input_string,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      totalPlannedObject = fillMan(plantgrouping(res.total_planned_data))
      console.log(totalPlannedObject)
    },
    error: function(err) {}
  });
}

//let mdata = [];
//mdata = getPlannedManpower(date_input_string);
//console.log("tub",mdata);

// * Create a constructor for sparklines that takes some sensible defaults and merges in the individual
//* chart options. This function is also available from the jQuery plugin as $(element).highcharts('SparkLine').
//*

function fillMan(data) {
  let plannedObjectPerPlant = {}
  for (var plant in data) {
    console.log(plant, data[plant]);
    let totalPlannedManPerPlant = []
    for (var index = 0; index < data[plant].length; index++) {
      let manpowerPerCam = []
      for (var pIndex = 0; pIndex < data[plant][index]['data'].length; pIndex++) {
        manpowerPerCam.push(data[plant][index]['data'][pIndex]['planned_manpower'])
      }
      totalPlannedManPerPlant.push(math.mode(manpowerPerCam))
    }
    plannedObjectPerPlant[plant] = math.sum(totalPlannedManPerPlant)
  }
  return (plannedObjectPerPlant)
}


function fillOverAllViewTable(inputObj) {
  data = inputObj['plannedManpower']
  totalPlannedCalculated = inputObj['plannedTotal']
  // let manpowergrpdata = fillmanpower(data)
  //  valuemanarray = (math.mode(manarray))
  let groupedData = plantgrouping(data)
  let tefficiency; //table variable for storing overall effciency
  let tBody = ''
  for (var plant in groupedData) {
    console.log(plant, groupedData[plant]);
    let efficiencyArr = []
    for (var index = 0; index < groupedData[plant].length; index++) {
      efficiencyArr.push(groupedData[plant][index]['efficiency']['total'])
    }
    efficiencyArr = efficiencyArr.filter(function(el) {
      return el != null;
    });
    tefficiency = (math.mean(efficiencyArr))
    console.log(math.mean(efficiencyArr));
    tBody = tBody + '<tr>';
    //tBody = tBody + '<td>' + data[index]['camId'] + '</td>';
    tBody = tBody + '<td>' + plant + '</td>'
    tBody = tBody + '<td>' + tefficiency * 100 + '</td>'; //storing overall efficiency for the grouped data of all plants
    tBody = tBody + '<td>' + totalPlannedCalculated[plant] + '</td>';
    tBody = tBody + '<td>' +'<div><button>view</button></div>' + '</td>';
    tBody = tBody + '</tr>';
  }
//code to fill table
  $('#overAllViewTableBody').html(tBody);
}


function plantgrouping(data) {
  //function to group data according to plant name
  result = data.reduce(function(r, a) {
    r[a.plant] = r[a.plant] || [];
    r[a.plant].push(a);
    return r;
  }, Object.create(null));

  return result;
}

function getIndianTimeISOString(d, offset = 5.5) { //getting standard date and time
  //var d = new Date();
  var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  var nd = new Date(utc + (3600000 * offset));
  let year = (nd.getFullYear() < 10) ? "0" + nd.getFullYear() : "" + nd.getFullYear();
  let month = ((nd.getMonth() + 1) < 10) ? "0" + (nd.getMonth() + 1) : "" + (nd.getMonth() + 1);
  let day = (nd.getDate() < 10) ? "0" + nd.getDate() : "" + nd.getDate();
  let hours = (nd.getHours() < 10) ? "0" + nd.getHours() : "" + nd.getHours();
  let minutes = (nd.getMinutes() < 10) ? "0" + nd.getMinutes() : "" + nd.getMinutes();
  let seconds = (nd.getSeconds() < 10) ? "0" + nd.getSeconds() : "" + nd.getSeconds();
  let isoString = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.000Z';
  return isoString;
}

function getdateISOString(n) {
  let t = new Date((new Date()).getTime() + 86400000 * n);
  t = getIndianTimeISOString(t, 5.5);
  t = getMidNightTime(t);
  return t;
}

function getMidNightTime(isoT) {
  isoT = isoT.split("T")[0] + "T00:00:00.000Z";
  return isoT;
}

function getHoursMinutesString(isoT) {
  let t = (isoT.split("T")[1]).split(":");
  t = t[0] + ":" + t[1];
  return t;
}
