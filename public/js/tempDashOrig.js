var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

var selected_Plant_ID;
var selected_Cam_ID = '';
//var console = {};
//console.log = function(){};
var workerCountShiftC;
var totalEmployeesPresentInFR;
var globalDateObject = {}
var allEmpInfo;
let attendanceCountHighchart = {
  chart: {
    zoomType: 'x'
  },
  boost: {
    useGPUTranslations: true
  },
  title: {
    text: 'Faces detected over time'
  },
  subtitle: {
    text: document.ontouchstart === undefined ?
      'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: {
      day: '%d %m %Y'
    },
    scrollbar: {
      enabled: true
    }
  },
  yAxis: {
    title: {
      text: 'Person(s)'
    }
  },
  legend: {
    enabled: false
  },
  plotOptions: {
    area: {
      fillColor: {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1
        },
        stops: [
          [0, Highcharts.getOptions().colors[0]],
          [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
        ]
      },
      marker: {
        radius: 2
      },
      lineWidth: 1,
      states: {
        hover: {
          lineWidth: 1
        }
      },
      threshold: null,
      series: {
        turboThreshold: 100000, //larger threshold or set to 0 to disable
      }
    },
    series: {
      cursor: 'pointer',
      point: {
        events: {
          click: function() {
            console.log(this.options)
            getFrameApi(this.options['frameId'])
          }
        }
      }
    }
  },

  series: [{
    type: 'area',
    name: 'People detected',
    // boostThreshold: 1000,
    data: []
  }]
}

let dirIndirChartData = {
  chart: {
    type: 'column'
  },
  title: {
    text: 'Manpower Info'
  },
  subtitle: {
    text: 'Source: Face Recog & Biometric'
  },
  xAxis: {
    categories: [],
    crosshair: true
  },
  yAxis: {
    min: 0,
    title: {
      text: 'Persons'
    }
  },
  tooltip: {
    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
      '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
    footerFormat: '</table>',
    shared: true,
    useHTML: true
  },
  plotOptions: {
    column: {
      pointPadding: 0.2,
      borderWidth: 0
    }
  },
  series: [{
    name: 'Face Recognition',
    data: []

  }, {
    name: 'Biometrics',
    data: []

  }]
}

let realtimeHighChart = {
  chart: {
    type: 'spline',
    animation: Highcharts.svg, // don't animate in old IE
    marginRight: 10,
    events: {
      load: function() {

        // set up the updating of the chart each second
        var series = this.series[0];
        setInterval(function() {
          var x = (new Date()).getTime(), // current time
            y = Math.random();
          series.addPoint([x, y], true, true);
        }, 1000);
      }
    }
  },

  time: {
    useUTC: false
  },

  title: {
    text: 'Live random data'
  },
  xAxis: {
    type: 'datetime',
    tickPixelInterval: 150
  },
  yAxis: {
    title: {
      text: 'Value'
    },
    plotLines: [{
      value: 0,
      width: 1,
      color: '#808080'
    }]
  },
  tooltip: {
    headerFormat: '<b>{series.name}</b><br/>',
    pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
  },
  legend: {
    enabled: false
  },
  exporting: {
    enabled: false
  },
  series: [{
    name: 'Random data',
    data: (function() {
      // generate an array of random data
      var data = [],
        time = (new Date()).getTime(),
        i;

      for (i = -19; i <= 0; i += 1) {
        data.push({
          x: time + i * 1000,
          y: Math.random()
        });
      }
      return data;
    }())
  }]
}

// var socket = io(serviceUrl, {path : '/face/socket.io'});
// // var socket = io(serviceUrl);
// socket.on('increase', function(data) {
//     console.log("Listening...", data);
// })

$(window).on('load', function() {
  let urlUserId = $.cookie("uId") ? $.cookie("uId") : getUrlParameter('usr');
  $.ajax({
    url: serviceUrl + "face/user/" + urlUserId,
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
      currentUser = res;
      $.cookie("uId", res._id)
      if (res.email != 'sashank@gmail.com') {
        $('#maskingMenu').remove()
      }
    },
    error: function(err) {}
  });

  makeSideMenuActive('jbmHomeItem');
  let yesterday = getdateISOString(-1);
  let yesterdayEnd = getdateISOString(-1).split("T")[0] + "T23:59:59.999Z";
  let today = getdateISOString(0);

  let attendanceCountHighchartGraph = Highcharts.chart('container', attendanceCountHighchart);
  attendanceCountHighchartGraph.showLoading();

  let dirIndirChartDataGraph = Highcharts.chart('directIndirectBar', dirIndirChartData);
  dirIndirChartDataGraph.showLoading();

  globalDateObject['start'] = yesterday;
  globalDateObject['end'] = today;

  getAttendanceRecord({
    start: getdateISOString(-1).split("T")[0] + "T00:00:00.000Z",
    end: getdateISOString(-1).split("T")[0] + "T23:59:59.999Z",
    plant: 'N-5'
  });

  //get Biometric data
  getBiometricData(yesterday);
  getPlannedManpowerData(yesterday);

  //get Employee count
  getAllEmpInfo();

  //get Plant wise camera details
  getCamerasPlantWise();
});

function getPlannedManpowerData(day) {
  $.ajax({
    url: "http://103.94.66.107/planned/manpower?startDate=" + day + "&plant=" + "N-5",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    success: function(res) {
      $('#plannedManpowerCount').html(res.total_workers_count)
      if (res.total_planned_data.length > 0) {
        $('#uploadedBySpan').html(res.total_planned_data[0]['upload']['userId']['email'])
      }
    },
    error: function(err) {}
  });
}

function updateCamDopdown(data) {
  $('#searchCamSelectTagAnchorTag').html('<select id="searchCamSelectTag" class="js-example-basic-single" name="state"></select>')
  for (var index = 0; index < data.length; index++) {
    $('#searchCamSelectTag').append('<option value="' + data[index]['camName'] + '" >' + data[index]['location'] + ' ( IP: ' + data[index]['camName'] + ')</option>')
  }
  $('#searchCamSelectTag').select2();
}

function getAllEmpInfo() {
  $.ajax({
    url: serviceUrl + "face/getEmpInfo",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      $('#totalEmployeesInDB').html(res.totalEmployeesInDB);
      allEmpInfo = res.employeeInfo;
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
}

function getFrameApi(frameId) {
  var photo = document.getElementById('processedFrame');
  //let url = "https://jpeg.org/images/jpeg-home.jpg";
  let imgURL = serviceUrl + "face/getFrame?fId=" + frameId;
  photo.setAttribute("src", imgURL);

  let personsDetectedInfo = $('#personsDetectedInfo');
  $.ajax({
    url: serviceUrl + "face/getFrame?fId=" + frameId + "&onlyData=1",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      calcBlurInImage(frameId)
      $('#processedFrame').attr('mId', frameId)
      $('#frameTime').html(moment(res[0].time).toDate().toUTCString().split("GMT")[0])
      $('#numberOfPersons').html(res[0].personsDetected.length)
      let personsDiv = ''
      let empDetectedInFrameTable = $('#empDetectedInFrameTable');
      $('#pDetectedInFrame').val(res[0].personsDetected.length)
      let empNameSelectTag = '<option value="none">None</option>';

      for (var fIndex = 0; fIndex < res[0].personsDetected.length; fIndex++) {
        let imageText = ''
        for (var eIndex = 0; eIndex < allEmpInfo.length; eIndex++) {
          empNameSelectTag += '<option value="' + allEmpInfo[eIndex].empId + '">' + allEmpInfo[eIndex].empId + '</option>'
          if(allEmpInfo[eIndex].empId == res[0].personsDetected[fIndex]['empId']) {
            for (var tIndex = 0; tIndex < allEmpInfo[eIndex].trainingImages.length; tIndex++) {
              //style="transform: rotate(90deg);" .split(".jpg")[0] + ".webp"
              imageText += '<img id="processedFrame" src="http://'+commonFrameLink+'/face/getImage?path='+ allEmpInfo[eIndex].trainingImages[tIndex] +'" width="100" height="100" ondblclick="window.open(this.src)">'
            }
          }
        }

        personsDiv = personsDiv + '<tr empId="' + res[0].personsDetected[fIndex]['empId'] + '" data-bbox="' + res[0].personsDetected[fIndex]['bbox'] + '" confScore="'+res[0].personsDetected[fIndex]['confScore']+'"><td style="text-align: left;vertical-align: middle;">' + toTitleCase(res[0].personsDetected[fIndex]['empId'].split("_")[0]) + '</td>\
        <td style="vertical-align: middle;">\
        ' + Math.round(res[0].personsDetected[fIndex]['confScore'] * 10) / 10 + '\
        </td><td style="vertical-align: middle;">\
        <div class="checkbox" style="margin:0px!important">\
          <label><input type="checkbox" value="" checked>Correctly Classified</label>\
        </div>\
        </td>\
        <td style="vertical-align: middle;"><select class="empNameSelectTag" style="width:100%">' + empNameSelectTag + '</select></td>\
        <td>' + imageText + '</td></tr>'
      }
      empDetectedInFrameTable.html(personsDiv)
      $('.empNameSelectTag').select2();
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
}

function getBiometricData(date, plant = 'CORP') {

  if(plant == 'N-5') {
    $.ajax({
      url: "http://103.94.66.107/chartserver/getBiometricData?date=" + date + '&' + 'plantID=' + plant,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      success: function(res) {
        $('#biometricCount').html("A- " + res.value.numWorkerA + " C- " + res.value.numWorkerC)
        $('#biometricPlant').html(plant)
        directIndirectBar['xAxis']['categories'] = [
          'Shift A',
          'Shift C',
        ]
        dirIndirChartData['series'][0]['data'] = [0, workerCountShiftC]
        dirIndirChartData['series'][1]['data'] = [res.value.numWorkerA, res.value.numWorkerC]
        Highcharts.chart('directIndirectBar', dirIndirChartData);
      },
      error: function(err) {}
    });
  } else if(plant == 'CORP') {
    $.ajax({
      url: serviceUrl + "face/biometric/dataInfo?startDate=" + date,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      success: function(res, output, xhr) {
        $('#biometricCount').html(res.countPresent)
        $('#biometricPlant').html(plant)
        dirIndirChartData['xAxis']['categories'] = [
          'Day Shift'
        ]
        dirIndirChartData['series'][0]['data'] = [totalEmployeesPresentInFR]
        dirIndirChartData['series'][1]['data'] = [res.countPresent]
        Highcharts.chart('directIndirectBar', dirIndirChartData);
      },
      error: function(err) {
        toastr["error"]("Getting Camera Info Failed")
      }
    });
  }
}

$(function() {
  $('#datePickerMain').daterangepicker({
    // singleDatePicker: true,
    timeZone: 'Asia/Kolkata',
    showDropdowns: true,
    opens: 'left',
    minYear: 2019,
    timePicker: true,
    maxYear: parseInt(moment().format('YYYY'), 10),
    maxDate: moment()
  }, function(start, end, label) {
    let startDate = getIndianTimeISOStringVerified(start);
    let endDate = getIndianTimeISOStringVerified(end);

    globalDateObject['start'] = startDate;
    globalDateObject['end'] = endDate;

    getAttendanceRecord({
      start: startDate,
      end: endDate,
      camId: selected_Cam_ID
    });
    getBiometricData(startDate);
    getPlannedManpowerData(startDate);
  });
});

$(function() {
  $('#datePickerMainSingleDate').daterangepicker({
    singleDatePicker: true,
    timeZone: 'Asia/Kolkata',
    showDropdowns: true,
    opens: 'left',
    minYear: 2019,
    maxYear: parseInt(moment().format('YYYY'), 10),
    maxDate: moment()
  }, function(start, end, label) {
    let startDate = getIndianTimeISOStringVerified(start);
    // let startDateForAtendance = getIndianTimeISOStringVerified(start.subtract('days', 1).set('hour', 18))
    let endDate = getIndianTimeISOStringVerified(end);

    globalDateObject['start'] = startDate;
    globalDateObject['end'] = endDate;

    getAttendanceRecord({
      start: startDate,
      end: endDate,
      camId: selected_Cam_ID
    });
    getBiometricData(startDate);
    getPlannedManpowerData(startDate);
  });
});

function removeNoise(empData) {
  if (empData.length > 0) {
    //loop to remove invalid employees-------go to each employee
    for (let index = 0; index < empData.length; index++) {

      let timeInfoLength = empData[index]['timeInfo'].length;

      //if any employee has 1 or less timestamps ---- delete the employee
      if (timeInfoLength <= 1) {
        empData.splice(index, 1);
        index--;
        timeInfoLength = empData[index]['timeInfo'].length;
        continue;
      } else {

        //loop to remove invalid timestamps------go to each timestamp of the employee
        for (let timestamp = 0; timestamp < timeInfoLength - 1; timestamp++) {

          let curEmp = new Date(empData[index]['timeInfo'][timestamp]);
          let nextEmp = new Date(empData[index]['timeInfo'][timestamp + 1]);
          let diffMilliseconds = nextEmp.getTime() - curEmp.getTime();

          //if diff. b/w a timestamp and timestamp+1 is more than 5s then---------
          if (diffMilliseconds > 5000) {

            //if it's the 1st timestamp it should be removed
            if (timestamp == 0) {
              empData[index]['timeInfo'].splice(timestamp, 1);
              timestamp--;
              timeInfoLength = empData[index]['timeInfo'].length;
            }

            //if timestamp+1 is the last last timestamp, then timestamp+1 should be removed
            else if ((timestamp + 2) == timeInfoLength) {
              empData[index]['timeInfo'].splice(timestamp + 1, 1);
              timestamp -= 2;
              timeInfoLength = empData[index]['timeInfo'].length;
            }

            //else the timestamps are somewhere in b/w so find timestamp+2
            else {
              let nextNextEmp = new Date(empData[index]['timeInfo'][timestamp + 2]);
              let diffNextMilliseconds = nextNextEmp.getTime() - nextEmp.getTime();

              //now if diff. b/w timestamp+1 and timestamp+2 is also>5s then delete timestamp+1
              if (diffNextMilliseconds > 5000) {
                empData[index]['timeInfo'].splice(timestamp + 1, 1);
                timestamp -= 2;
                timeInfoLength = empData[index]['timeInfo'].length;
              }
            }
          }
        }
      }

      //after some of the timestamps of an employee are deleted then check if employee is remaining
      //with only one timestamp delete the employee
      if (timeInfoLength <= 1) {
        empData.splice(index, 1);
        index--;
        timeInfoLength = empData[index]['timeInfo'].length;
      }
    }
  }
  console.log("EmpData: ", empData);
  return empData;
}

function generateAttendanceTable(empData, date) {
  // Inserting data in table-----------------------------------------------------------------------------
  let outerDiv = $('#empRecord');
  let numEmp = 0;
  outerDiv.html('');
  $('#dateSelectedByPicker').html(date.end.split("T")[0])
  outerDiv.append('\
    <table class="table table-striped table-bordered" id="empTable">\
      <thead>\
        <tr>\
          <th>#</th>\
          <th>Emp ID</th>\
          <th>Emp Name</th>\
          <th>Entry Time</th>\
          <th>Exit Time</th>\
          <th>Shift</th>\
          <th>Actions</th>\
        </tr>\
      </thead>\
      <tbody id="empTableBody">\
      </tbody>\
    </table>\
    ')

  let tbody = ''
  empData = getEntryExitTimes(empData, date);
  for (let index = 0; index < empData.length; index++) {
    let tempTime = empData[index]['timeInfo']['time']
    let timeInfoLength = empData[index]['timeInfo'].length;
    // console.log("timeInfoLength= ",timeInfoLength);

    //sudo ifconfig enp0s31f6 192.168.13
    if (empData[index]['_id'].split("_")[0] != 'Unknown') {
      //loop to get a valid entryDate
      let entryTime = (empData[index]['entry'] != undefined) ? moment(empData[index]['entry']).toDate().toUTCString().split("GMT")[0] : "-"
      let exitTime = (empData[index]['exit'] != undefined) ? moment(empData[index]['exit']).toDate().toUTCString().split("GMT")[0] : "-"
      let totalTime = empData[index]['totalTime']
      let shiftTime = (entryTime != "-") ? ((moment(entryTime).hour() < 12) ? "Shift A" : "Shift C") : ((moment(exitTime).hour() < 12) ? "Shift C" : "Shift A")

      let actionsRow = '\
      <td>\
      <i class="fa fa-file-image-o actionsRowFafaIcons getFramesOfEmployee" aria-hidden="true" title="Frames"></i>&nbsp;&nbsp;&nbsp;&nbsp;\
      <i class="fa fa-user actionsRowFafaIcons empInfoIcon" aria-hidden="true" title="Information" data-toggle="modal" data-target="#empInfoModal"></i>&nbsp;&nbsp;&nbsp;&nbsp;\
      <i class="fa fa-bar-chart actionsRowFafaIcons empAnalyticsIcon" aria-hidden="true" title="Analytics" data-toggle="modal" data-target="#empAnalyticsModal"></i>\
      </td>\
      ';

      tbody = tbody + '<tr empId="' + empData[index]['_id'] + '"><td>' + (numEmp + 1) + '</td><td>' + empData[index]['_id'].split("_")[1] + '</td><td style="text-align: left;">' + toTitleCase(empData[index]['_id'].split("_")[0]) + '</td><td>' + entryTime + '</td><td>' + exitTime + '</td><td>' + shiftTime + '</td>' + actionsRow + '</tr>'
      numEmp++;
    }
  }
  document.getElementById("camera_count").innerHTML = numEmp;

  $('#empTableBody').html(tbody);
  $('#empTable').DataTable({
    dom: "Blfrtip",
    buttons: [{
        extend: "copy",
        className: "btn-sm"
      },
      {
        extend: "csv",
        className: "btn-sm"
      },
      {
        extend: "excel",
        className: "btn-sm"
      },
      {
        extend: "pdfHtml5",
        className: "btn-sm"
      },
      {
        extend: "print",
        className: "btn-sm"
      },
    ],
    responsive: true
  });
}

function getEntryExitTimes(empData, date) {
  // console.log("emp data length:", empData.length)
  for (var eIndex = 0; eIndex < empData.length; eIndex++) {
    // console.log("index", eIndex, empData[eIndex]['timeInfo'])
    let entryTimes = []
    let exitTimes = []
    for (var tIndex = 0; tIndex < empData[eIndex]['timeInfo'].length; tIndex++) {
      empData[eIndex]['timeInfo'][tIndex]['time'] = moment(empData[eIndex]['timeInfo'][tIndex]['time'])
      if (empData[eIndex]['timeInfo'][tIndex]['camType'].includes(0)) {
        exitTimes.push(empData[eIndex]['timeInfo'][tIndex]['time'])
      }
      if (empData[eIndex]['timeInfo'][tIndex]['camType'].includes(1)) {
        entryTimes.push(empData[eIndex]['timeInfo'][tIndex]['time'])
      }
    }
    let maxExitDate = (exitTimes.length > 0) ? _.max(exitTimes) : undefined;
    let minEntryDate;
    empData[eIndex]['exit'] = maxExitDate
    // console.log("entryTimes", entryTimes, "exitTimes", exitTimes, entryTimes.length)
    if (entryTimes.length > 0) {
      // console.log(maxExitDate, moment(date.end.split("T")[0] + "T12:00:00.000Z"))
      if (maxExitDate) {
        if (maxExitDate < moment(date.end.split("T")[0] + "T12:00:00.000Z")) {
          // console.log("1")
          minEntryDate = _.min(entryTimes);
          empData[eIndex]['entry'] = minEntryDate
        } else if (maxExitDate >= moment(date.end.split("T")[0] + "T12:00:00.000Z")) {
          // console.log("raw", entryTimes)
          // console.log(date.end.split("T")[0] + "T00:00:00.000Z")
          var filterEntryTimes = entryTimes.filter(function(entryTime) {
            return entryTime >= moment(date.end.split("T")[0] + "T00:00:00.000Z");
          });
          // console.log("filtered", filterEntryTimes)
          minEntryDate = _.min(filterEntryTimes);
          empData[eIndex]['entry'] = minEntryDate
        }
      } else {
        empData[eIndex]['entry'] = _.min(entryTimes);
      }
    } else {
      // console.log("No entrey data")
      minEntryDate = undefined;
    }
    empData[eIndex]['totalTime'] = maxExitDate - minEntryDate;
  }
  return empData;
}

$(document).on('click', '.empInfoIcon', function() {
  let empId = $(this).closest('tr').attr('empId')
  $('#empNameInInfoModal').html(toTitleCase(empId.split("_")[0]));

  $.ajax({
    url: serviceUrl + "face/getEmpInfo/" + empId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      console.log(res[0])
      let empData = res[0]
      $('#empIdInInfoModal').html(empData.empId)
      $('#empPlantInInfoModal').html(empData.plant)
      $('#empDesgnInInfoModal').html(empData.designation)
      $('#imagesViewTraining').html('')
      for (var index = 0; index < empData.trainingImages.length; index++) {
        // .split(".jpg")[0] + ".webp"
        $('#imagesViewTraining').append('<img id="processedFrame" src="http://'+ commonFrameLink +'/face/getImage/?path=' + empData.trainingImages[index] + '" width="200" height="200" ondblclick="window.open(this.src)" style="transform: rotate(90deg);">')
      }
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
})

var data2 = [3.5, 3, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4, 3, 3, 4, 4.4, 3.9, 3.5, 3.8, 3.8, 3.4, 3.7, 3.6, 3.3, 3.4, 3, 3.4, 3.5, 3.4, 3.2, 3.1, 3.4, 4.1, 4.2, 3.1, 3.2, 3.5, 3.6, 3, 3.4, 3.5, 2.3, 3.2, 3.5, 3.8, 3, 3.8, 3.2, 3.7, 3.3, 3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2, 3, 2.2, 2.9, 2.9, 3.1, 3, 2.7, 2.2, 2.5, 3.2, 2.8, 2.5, 2.8, 2.9, 3, 2.8, 3, 2.9, 2.6, 2.4, 2.4, 2.7, 2.7, 3, 3.4, 3.1, 2.3, 3, 2.5, 2.6, 3, 2.6, 2.3, 2.7, 3, 2.9, 2.9, 2.5, 2.8, 3.3, 2.7, 3, 2.9, 3, 3, 2.5, 2.9, 2.5, 3.6, 3.2, 2.7, 3, 2.5, 2.8, 3.2, 3, 3.8, 2.6, 2.2, 3.2, 2.8, 2.8, 2.7, 3.3, 3.2, 2.8, 3, 2.8, 3, 2.8, 3.8, 2.8, 2.8, 2.6, 3, 3.4, 3.1, 3, 3.1, 3.1, 3.1, 2.7, 3.2, 3.3, 3, 2.5, 3, 3.4, 3];

let scatterPlotGraph = {
  title: {
    text: 'Confidence Score Histogram'
  },
  xAxis: [{
    title: {
      text: '#Frame Number'
    },
    alignTicks: false
  }, {
    title: {
      text: 'Histogram Range'
    },
    alignTicks: false,
    opposite: true
  }],

  yAxis: [{
    title: {
      text: 'Conf. Score'
    }
  }, {
    title: {
      text: 'Histogram Value'
    },
    opposite: true
  }],

  series: [{
    name: 'Histogram',
    type: 'histogram',
    xAxis: 1,
    yAxis: 1,
    baseSeries: 's1',
    zIndex: -1
  }, {
    name: 'Conf. Scores',
    type: 'scatter',
    data: data2,
    id: 's1',
    marker: {
      radius: 1.5
    }
  }]
}

let empTimeDurationTrend = {

    chart: {
        type: 'columnrange',
        inverted: true
    },
    colors: ['#f7a35c', '#90ee7e', '#aaeeee'],
    title: {
        text: 'Timing Variation'
    },

    subtitle: {
        text: 'Total time in ofice'
    },

    xAxis: {
      categories: []
    },

    yAxis: {
        // type: 'datetime',
        // dateTimeLabelFormats: {
        //   day: '%d %m %Y'
        // },
        title: {
            text: 'Time'
        }
    },

    tooltip: {
        valueSuffix: 'hours'
    },

    plotOptions: {
        columnrange: {
            dataLabels: {
                enabled: true,
                format: '{y}'
            }
        }
    },

    legend: {
        enabled: false
    },

    series: [{
        name: 'Timings',
        data: [
            [-9.9, 10.3],
            [-8.6, 8.5],
            [-10.2, 11.8],
            [-1.7, 12.2],
            [-0.6, 23.1],
            [3.7, 25.4],
            [6.0, 26.2],
            [6.7, 21.4],
            [3.5, 19.5],
            [-1.3, 16.0],
            [-8.7, 9.4],
            [-9.0, 8.6]
        ]
    }]

}

function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

$(document).on('click', '.empAnalyticsIcon', function() {
  let empId = $(this).closest('tr').attr('empId')
  $('#empNameInAnalyticsModal').html(toTitleCase(empId.split("_")[0]))

  $.ajax({
    url: serviceUrl + "face/getEmpAnalytics/" + empId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let empData = res[0];
      let confScoresArray = []
      for (var index = 0; index < empData['confScores'].length; index++) {
        confScoresArray.push(empData['confScores'][index])
      }
      // scatterPlotGraph['series'][0]['name'] = toTitleCase(empId.split("_")[0]);
      scatterPlotGraph['series'][1]['data'] = confScoresArray;
      Highcharts.chart('empConfInAnalyticsModal', scatterPlotGraph);
      $('#empNumFramesInInfoModal').html(empData['timeInfo'].length)
      if (empData['confScores'].length != 0) {
        $('#avgConfScore').html(math.mean(empData['confScores']))
      } else if (empData['confScores'].length == 0) {
        $('#avgConfScore').html("No Data")
      }

      let groupByDate = groupEntryByDates(empData['timeInfo'])
      console.log("grouping : ",groupByDate)

      let empHistoryInInfoModalTable = '<table class="table table-fixed table-bordered"><thead><tr><th>Recent History</th></tr></thead><tbody>'
      empTimeDurationTrend['series'][0]['data'] = []
      empTimeDurationTrend['xAxis']['categories'] = groupByDate.map(function(value) {
        return value.date;
      });
      // console.log(empTimeDurationTrend['xAxis']['categories'])
      for (var tIndex = 0; tIndex < groupByDate.length; tIndex++) {
        // empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr><td>' + moment(empData['timeInfo'][tIndex]['time']).toDate().toUTCString().split("GMT")[0] + '</td></tr>'
        let lengthFramesOfDate = groupByDate[tIndex]['empData'].length
        let startTime  = new Date(groupByDate[tIndex]['empData'][0]['time']).getUTCHours() + (((new Date(groupByDate[tIndex]['empData'][0]['time']).getUTCMinutes() - 0) / (60 - 0) ))
        let endTime = new Date(groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['time']).getUTCHours() + (((new Date(groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['time']).getUTCMinutes() - 0) / (60 - 0) ))
        empTimeDurationTrend['series'][0]['data'].push([
            round(startTime, 1),
            round(endTime, 1)
        ])
        console.log(empTimeDurationTrend['series'][0]['data'])
        // empTimeDurationTrend['series'][0]['data'].push([-9.9, 10.3])
        empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
        <td>\
          <span>' + moment(groupByDate[tIndex]['empData'][0]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
          <a href="http://'+ commonFrameLink +'/face/getframe?camId=' + groupByDate[tIndex]['empData'][0]['camId'] + '&time=' + groupByDate[tIndex]['empData'][0]['time'] + '" target="_blank" camId="' + groupByDate[tIndex]['empData'][0]['camId'] + '" time="' + groupByDate[tIndex]['empData'][0]['time'] + '" style="float:right;">View Frame</a>\
        </td>\
        </tr>';
        empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
        <td>\
          <span>' + moment(groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
          <a href="http://'+ commonFrameLink +'/face/getframe?camId=' + groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['camId'] + '&time=' + groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['time'] + '" target="_blank" camId="' + groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['camId'] + '" time="' + groupByDate[tIndex]['empData'][lengthFramesOfDate -1]['time'] + '" style="float:right;">View Frame</a>\
        </td>\
        </tr>';
      }

      // for (var tIndex = 0; tIndex < empData['timeInfo'].length; tIndex++) {
      //   // empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr><td>' + moment(empData['timeInfo'][tIndex]['time']).toDate().toUTCString().split("GMT")[0] + '</td></tr>'
      //   empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
      //   <td>\
      //     <span>' + moment(empData['timeInfo'][tIndex]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
      //     <a href="http://'+ commonFrameLink +'/face/getframe?camId=' + empData['timeInfo'][tIndex]['camId'] + '&time=' + empData['timeInfo'][tIndex]['time'] + '" target="_blank" camId="' + empData['timeInfo'][tIndex]['camId'] + '" time="' + empData['timeInfo'][tIndex]['time'] + '" style="float:right;">View Frame</a>\
      //   </td>\
      //   </tr>';
      // }
      empHistoryInInfoModalTable = empHistoryInInfoModalTable + '</tbody></table>'
      $('#empHistoryInInfoModal').html(empHistoryInInfoModalTable)

      Highcharts.chart('empTimeDurationTrend', empTimeDurationTrend);
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
})

function groupEntryByDates(empData) {

  // this gives an object with dates as keys
  const groups = empData.reduce((groups, data) => {
    const date = data.time.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(data);
    return groups;
  }, {});

  // Edit: to add it in the array format instead
  const groupArrays = Object.keys(groups).map((date) => {
    return {
      date,
      empData: groups[date]
    };
  });

  return(groupArrays);
}

$(document).on('click', '.getFramesOfEmployee', function() {
  let empId = $(this).closest('tr').attr('empId')

  $.ajax({
    url: serviceUrl + "face/getAttendance?empId=" + empId + "&startDate=" + globalDateObject.start + "&endDate=" + globalDateObject.end,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      generateAttendanceCountGraph(res)
      $("html, body").animate({
        scrollTop: $("#empFrameGraphInfoDiv").offset().top
      }, "slow");
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
})

function getAttendanceRecord(date) {
  $.ajax({
    url: serviceUrl + "face/getFaceInfo?" + "startDate=" + date.start + "&endDate=" + date.end,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      document.getElementById("camera_count").innerHTML = res.length;
      // res = removeNoise(res);
      generateAttendanceTable(res, date)
      totalEmployeesPresentInFR = res.length
      workerCountShiftC = res.length
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
  generateGraph(date);
}

function generateGraph(data) {
  let urlFormed = serviceUrl + "face/getAttendance?" + "startDate=" + data.start + "&endDate=" + data.end;
  if (data['camId']) {
    urlFormed += '&camId=' + data.camId
  }
  if (data['plantId']) {
    urlFormed += '&plantId=' + data.plantId
  }
  $.ajax({
    url: urlFormed,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      generateAttendanceCountGraph(res)
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
}

function generateAttendanceCountGraph(data) {
  attendanceCountHighchart['series'][0]['data'] = []
  for (var index = 0; index < data.length; index++) {
    attendanceCountHighchart['series'][0]['data'].push({
      x: Date.UTC(
        new Date(data[index]['time']).getUTCFullYear(),
        new Date(data[index]['time']).getUTCMonth(),
        new Date(data[index]['time']).getUTCDate(),
        new Date(data[index]['time']).getUTCHours(),
        new Date(data[index]['time']).getUTCMinutes(),
        new Date(data[index]['time']).getUTCSeconds(),
        new Date(data[index]['time']).getUTCMilliseconds()
      ),
      y: data[index]['personsDetected'],
      frameId: data[index]['_id']
    })
    // attendanceCountHighchart['series'][0]['data'].push([
    //   Date.UTC(
    //     new Date(data[index]['time']).getUTCFullYear(),
    //     new Date(data[index]['time']).getUTCMonth(),
    //     new Date(data[index]['time']).getUTCDate(),
    //     new Date(data[index]['time']).getUTCHours(),
    //     new Date(data[index]['time']).getUTCMinutes(),
    //     new Date(data[index]['time']).getUTCSeconds(),
    //     new Date(data[index]['time']).getUTCMilliseconds()
    //   ),
    //   data[index]['personsDetected']
    // ])
  }
  console.log(attendanceCountHighchart['series'][0]['data'])
  Highcharts.chart('container', attendanceCountHighchart);
}

$(document).on('click', '#realTimeTab', function() {
  Highcharts.chart('container', realtimeHighChart);
})

$(document).on('click', '#morningShiftTab', function() {
  let startDate = getdateISOString(-1).split("T")[0] + "T05:00:00.000Z";
  let endDate = getdateISOString(-1).split("T")[0] + "T12:00:00.000Z";;

  // attendanceCountHighchartGraph.showLoading();
  // dirIndirChartDataGraph.showLoading();

  getAttendanceRecord({
    start: startDate,
    end: endDate,
    camId: selected_Cam_ID
  });
  getBiometricData(getdateISOString(-1));
  getPlannedManpowerData(getdateISOString(-1));
})

$(document).on('click', '#eveningShiftTab', function() {
  let startDate = getdateISOString(-1).split("T")[0] + "T17:00:00.000Z";
  let endDate = getdateISOString(-1).split("T")[0] + "T23:00:00.000Z";;

  // attendanceCountHighchartGraph.showLoading();
  // dirIndirChartDataGraph.showLoading();

  getAttendanceRecord({
    start: startDate,
    end: endDate,
    camId: selected_Cam_ID
  });
  getBiometricData(getdateISOString(-1));
  getPlannedManpowerData(getdateISOString(-1));
})

$(document).on('click', '#twentyFourShiftTab', function() {})
$(document).on('click', '#yesterdayShiftTab', function() {})
$(document).on('click', '#customShiftTab', function() {})

$(document).on('click', '#updateFrameInfoButton', function() {
  let dataToSend = {}
  dataToSend['aiInfo'] = {
    actualPersons: /^\d*$/.test($('#actualPersonFrameMetrics').val()) ? parseInt($('#actualPersonFrameMetrics').val()) : '',
    falseDetections: /^\d*$/.test($('#falseDetectionFrameMetrics').val()) ? parseInt($('#falseDetectionFrameMetrics').val()) : '',
    misDetections: /^\d*$/.test($('#misDetectionFrameMetrics').val()) ? parseInt($('#misDetectionFrameMetrics').val()) : '',
    // fitForTagging: $('#fitForTagging').is(":checked") ? 1 : 0
  }
  let mId = $('#processedFrame').attr('mId');
  let tempPersonsDetected = []
  $("#empDetectedInFrameTable tr").each(function() {
      tempPersonsDetected.push({
        bbox : $(this).data("bbox").split(","),
        empId: $(this).attr("empid"),
        confScore: $(this).attr("confScore"),
        trueFace: $(this).find('.empNameSelectTag').val()
      })
  });
  console.log(tempPersonsDetected)
  dataToSend['personsDetected'] = tempPersonsDetected;
  // console.log($('#processedFrame').attr('mid'), dataToSend)
  $.ajax({
    url: serviceUrl + "face/getframe/" + mId,
    type: "PUT",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    data: JSON.stringify(dataToSend),
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      toastr["success"]("Updated successfully")
    },
    error: function(err) {
      toastr["error"]("Updation Failed")
    }
  });
})
// $(document).on('click', '#calcBlurInImage', function() {
//   calcBlurInImage(frameId);
// })

function calcBlurInImage(frameId) {
  $.ajax({
    url: serviceUrl + "face/getFrame/blur/" + frameId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let blurText = ''
      let value = parseFloat(res[0])
      if (value < 1500) {
        percBlur = (1500 - value)
        percBlur = percBlur / 1500
        percBlur = percBlur * 100
        blurText = 'Blur ' + Math.round(percBlur * 10) / 10 + " %"
      } else if (value > 1500) {
        percBlur = (value - 1500)
        percBlur = percBlur / 1500
        percBlur = percBlur * 100
        blurText = 'Sharp ' + Math.round(percBlur * 10) / 10 + " %"
      }
      $('#blurInImageValue').html(blurText)
    },
    error: function(err) {
      $('#blurInImageValue').html("--")
      toastr["error"]("Getting Blur Info Failed")
    }
  });
}

function getCamerasPlantWise() {
  $.ajax({
    url: serviceUrl + "face/allCamsList",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      fillCameraUnderPlantsMenu(res);
    },
    error: function(err) {
      toastr["error"]("Logout Failed")
    }
  }).done(function(data) {

  });
}

function fillCameraUnderPlantsMenu(camData) {
  htmlContent = '';
  $('#plantWiseCameras').html('');
  $('#numOfCam').html(camData[0].cameras.length)
  console.log(camData)
  for (var pIndex = 0; pIndex < camData.length; pIndex++) {
    htmlContent += `<li class="plant_level active" plantid="${camData[pIndex]['_id']}"><a><span class="plantNameInSideMenu">${camData[pIndex]['_id']}</span><span class="fa fa-chevron-down"></span></a><ul class="nav child_menu" style="display: block;"><li class="cam_status_level active" value="entry"><a><i class="fa fa-camera"></i> Entry</a><ul class="nav child_menu" style="display: block;">`
    for (var cIndex = 0; cIndex < camData[pIndex]['cameras'].length; cIndex++) {
      if (camData[pIndex]['cameras'][cIndex]['usageType'].includes(1)) {
        htmlContent += `<li value="${camData[pIndex]['cameras'][cIndex]['camId']}" class="camera_list camera_level" title="${camData[pIndex]['cameras'][cIndex]['camLoc']}"><a>${camData[pIndex]['cameras'][cIndex]['camLoc']}</a></li>`
      }
    }
    htmlContent += '</ul></li>' + '<li class="cam_status_level active" value="exit"><a><i class="fa fa-camera"></i> Exit</a><ul class="nav child_menu" style="display: block;">';
    for (var cIndex = 0; cIndex < camData[pIndex]['cameras'].length; cIndex++) {
      if (camData[pIndex]['cameras'][cIndex]['usageType'].includes(0)) {
        htmlContent += `<li value="${camData[pIndex]['cameras'][cIndex]['camId']}" class="camera_list camera_level" title="${camData[pIndex]['cameras'][cIndex]['camLoc']}"><a>${camData[pIndex]['cameras'][cIndex]['camLoc']}</a></li>`
      }
    }
    htmlContent += '</ul></li>';
    htmlContent += '</ul></li>';
  }
  $('#plantWiseCameras').html(htmlContent);
}

$(document).on('click', '.camera_level', function() {
  selected_Cam_ID = $(this).attr('value');
  $("html, body").animate({
    scrollTop: $("#empFrameGraphInfoDiv").offset().top
  }, "slow");
  generateGraph({
    start: globalDateObject['start'],
    end: globalDateObject['end'],
    camId: selected_Cam_ID
  })
})

$(document).on('click', "#logout_button", function() {

  $.ajax({
    url: serviceUrl + "face/logout",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      if (res.redirect) {
        // console.log("logout")
        window.location.href = serviceUrl + res.redirect
      }
    },
    error: function(err) {
      toastr["error"]("Logout Failed")
    }
  }).done(function(data) {

  });
  return false;
});

function searchInArrayOfObjects(value, keyName, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    //////////
    if (value.split("_").length == 2) {
      if (myArray[i][keyName].split("_")[0] + "_" + myArray[i][keyName].split("_")[1] == value) {
        return myArray[i];
      }
    } else if (value.split("_").length == 3) {
      if (myArray[i][keyName] == value) {
        return myArray[i];
      }
    }
    /////////
  }
}

function getCamNameFromKafkaId(kId) {
  let object = searchInArrayOfObjects(kId, 'camName', allCamInfo);
  if (object) {
    if (object.location) {
      return object.location;
    } else {
      return kId;
    }
  } else {
    return kId;
  }
}

function getKeyFromKafkaId(kId, key) {
  let object = searchInArrayOfObjects(kId, 'camName', allCamInfo);
  if (object) {
    return object[key];;
  } else {
    return kId;
  }
}

function getShortNameForCamera(camName, numChars) {
  var camNameString = camName;
  return camNameString.slice(0, numChars) + ".."
}

let plantWiseCamerasObject = {}

function findLengthOfObjectOfArraysInKeys(ob) {
  let lengthTotal = 0;
  for (key in ob) {
    lengthTotal = lengthTotal + ob[key].length;
  }
  return lengthTotal;
}

function seeActiveCameras(data) {
  let lengthCam = undefined;
  console.log("5 data in ", data, plantWiseCamerasObject)

  if (data.type == 'plant_level') {
    let activecams = findLengthOfObjectOfArraysInKeys(plantWiseCamerasObject[data.value]["active"])
    let inactivecams = findLengthOfObjectOfArraysInKeys(plantWiseCamerasObject[data.value]["inactive"])
    let inprogresscams = findLengthOfObjectOfArraysInKeys(plantWiseCamerasObject[data.value]["inprogress"])
    lengthCam = activecams + inactivecams + inprogresscams;
  } else if (data.type == 'group_level') {
    let activecams = plantWiseCamerasObject[data.value][data.subtype][data.group].length
    lengthCam = activecams;
  }
  if (lengthCam != undefined) {
    $('#camera_count').html(lengthCam);
  }
}

function updateCamStats() {
  return new Promise((resolve, reject) => {
    let f1 = getAllCameraDetails();
    let f2 = getGroupsData({
      type: "line"
    });
    Promise.all([f1, f2]).then(function(values) {
      console.log("2")
      var flags = [],
        output = [],
        l = allCamInfo.length,
        i;
      for (let i = 0; i < l; i++) {
        if (flags[allCamInfo[i].plant]) continue;
        flags[allCamInfo[i].plant] = true;
        output.push(allCamInfo[i].plant);
      }
      // let plantWiseCamerasObject = {}
      let groups = values[1];
      plantWiseCamerasObject = {}
      console.log("3")
      for (let plantNum = 0; plantNum < output.length; plantNum++) {
        if (!(output[plantNum] in plantWiseCamerasObject)) {
          plantWiseCamerasObject[output[plantNum]] = {}
          plantWiseCamerasObject[output[plantNum]]["active"] = []
          plantWiseCamerasObject[output[plantNum]]["inactive"] = []
          plantWiseCamerasObject[output[plantNum]]["inprogress"] = []
        }
        for (let cameraNum = 0; cameraNum < allCamInfo.length; cameraNum++) {
          if (allCamInfo[cameraNum].plant == output[plantNum]) {
            let camData = {
              camId: allCamInfo[cameraNum].camName
            }

            if (groups.length > 0) {
              for (let gIndex = 0; gIndex < groups.length; gIndex++) {
                if ((groups[gIndex]['groupType'] == 'line') && (allCamInfo[cameraNum].plant == groups[gIndex]['groupIdentifier']['value']) && (groups[gIndex]['groupMembers'].includes(allCamInfo[cameraNum].camName))) {
                  camData['group'] = groups[gIndex]['groupName']
                }
              }
            }

            if (allCamInfo[cameraNum].status == 1) {
              plantWiseCamerasObject[output[plantNum]]['active'].push(camData)
            } else if (allCamInfo[cameraNum].status == 0) {
              plantWiseCamerasObject[output[plantNum]]['inactive'].push(camData)
            } else if (allCamInfo[cameraNum].status == 2) {
              plantWiseCamerasObject[output[plantNum]]['inprogress'].push(camData)
            }
          }
        }

        for (var key in plantWiseCamerasObject[output[plantNum]]) {
          for (var cIndex = 0; cIndex < plantWiseCamerasObject[output[plantNum]][key].length; cIndex++) {
            groupedResult = plantWiseCamerasObject[output[plantNum]][key].reduce(function(r, a) {
              r[a.group] = r[a.group] || [];
              r[a.group].push(a);
              return r;
            }, Object.create(null));

            plantWiseCamerasObject[output[plantNum]][key] = groupedResult
          }
        }

      }

      let divFormation = '';
      for (var plant in plantWiseCamerasObject) {
        // console.log("aaaaaaaaaaaaaa",plantWiseCamerasObject[plant])
        if (plantWiseCamerasObject.hasOwnProperty(plant)) {
          divFormation = divFormation + '<li class="plant_level" plantid="' + plant + '"><a><span class="plantNameInSideMenu">' + plant + '</span><span class="fa fa-chevron-down"></span></a><ul class="nav child_menu">' +
            '<li class="cam_status_level" value="inactive"><a href="#level2_1"><i class="fa fa-camera"></i> Inactive Cameras</a><ul class="nav child_menu">';
          for (var groupName in plantWiseCamerasObject[plant]["inactive"]) {
            if (groupName == 'undefined') {
              for (let index = 0; index < plantWiseCamerasObject[plant]["inactive"][groupName].length; index++) {
                divFormation = divFormation + '<li value="' + plantWiseCamerasObject[plant]["inactive"][groupName][index]['camId'] + '" class="camera_list camera_level" title="' + getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inactive"][groupName][index]['camId']) + '"><a>' + getShortNameForCamera(getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inactive"][groupName][index]['camId']), 10) + '</a></li>'
              }
            } else {
              divFormation = divFormation + '<li class="group_level"><a><i class="fa fa-cubes"></i><span class="groupName">' + groupName + '</span></a><ul class="nav child_menu">';
              for (let index = 0; index < plantWiseCamerasObject[plant]["inactive"][groupName].length; index++) {
                divFormation = divFormation + '<li value="' + plantWiseCamerasObject[plant]["inactive"][groupName][index]['camId'] + '" class="camera_list camera_level" title="' + getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inactive"][groupName][index]['camId']) + '"><a>' + getShortNameForCamera(getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inactive"][groupName][index]['camId']), 10) + '</a></li>'
              }
              divFormation = divFormation + '</ul></li>';
            }
          }

          divFormation = divFormation + '</ul></li><li class="cam_status_level" value="active"><a><i class="fa fa-camera"></i> Active Camera</a><ul class="nav child_menu">';
          for (groupName in plantWiseCamerasObject[plant]["active"]) {
            if (groupName == 'undefined') {
              for (let index = 0; index < plantWiseCamerasObject[plant]["active"][groupName].length; index++) {
                divFormation = divFormation + '<li value="' + plantWiseCamerasObject[plant]["active"][groupName][index]['camId'] + '" class="camera_list camera_level" title="' + getCamNameFromKafkaId(plantWiseCamerasObject[plant]["active"][groupName][index]['camId']) + '"><a>' + getShortNameForCamera(getCamNameFromKafkaId(plantWiseCamerasObject[plant]["active"][groupName][index]['camId']), 10) + '</a></li>'
              }
            } else {
              divFormation = divFormation + '<li class="group_level"><a><i class="fa fa-cubes"></i><span class="groupName">' + groupName + '</span></a><ul class="nav child_menu">';
              for (let index = 0; index < plantWiseCamerasObject[plant]["active"][groupName].length; index++) {
                divFormation = divFormation + '<li value="' + plantWiseCamerasObject[plant]["active"][groupName][index]['camId'] + '" class="camera_list camera_level" title="' + getCamNameFromKafkaId(plantWiseCamerasObject[plant]["active"][groupName][index]['camId']) + '"><a>' + getShortNameForCamera(getCamNameFromKafkaId(plantWiseCamerasObject[plant]["active"][groupName][index]['camId']), 10) + '</a></li>'
              }
              divFormation = divFormation + '</ul></li>';
            }
          }

          divFormation = divFormation + '</ul></li><li class="cam_status_level" value="inprogress"><a><i class="fa fa-camera"></i> In Progress</a><ul class="nav child_menu">';
          for (groupName in plantWiseCamerasObject[plant]["inprogress"]) {
            if (groupName == 'undefined') {
              for (let index = 0; index < plantWiseCamerasObject[plant]["inprogress"][groupName].length; index++) {
                divFormation = divFormation + '<li value="' + plantWiseCamerasObject[plant]["inprogress"][groupName][index]['camId'] + '" class="camera_list camera_level" title="' + getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inprogress"][groupName][index]['camId']) + '"><a>' + getShortNameForCamera(getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inprogress"][groupName][index]['camId']), 10) + '</a></li>'
              }
            } else {
              divFormation = divFormation + '<li class="group_level"><a><i class="fa fa-cubes"></i><span class="groupName">' + groupName + '</span></a><ul class="nav child_menu">';
              for (let index = 0; index < plantWiseCamerasObject[plant]["inprogress"][groupName].length; index++) {
                divFormation = divFormation + '<li value="' + plantWiseCamerasObject[plant]["inprogress"][groupName][index]['camId'] + '" class="camera_list camera_level" title="' + getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inprogress"][groupName][index]['camId']) + '"><a>' + getShortNameForCamera(getCamNameFromKafkaId(plantWiseCamerasObject[plant]["inprogress"][groupName][index]['camId']), 10) + '</a></li>'
              }
              divFormation = divFormation + '</ul></li>';
            }
          }
          divFormation = divFormation + '</ul></li></ul></li>';
        }
      }
      $('#plantWiseCameras').html(divFormation)
      seeActiveCameras({
        type: 'plant_level',
        value: 'N-5'
      })
      resolve()
    })
    //====================camera list update===============================================
  });
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

function getIndianTimeISOString(d, offset = 5.5) {
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
