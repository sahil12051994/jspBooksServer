var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

let plant_level_element;
let camera_level_element;
var selected_Plant_ID;
var plannedManPowerTemp;
var totalPlannedObject;
var companyId = undefined;
var globalDateObject = {}
var globalCameraObject = []
var plantList = []
//var console = {};
//console.log = function(){};

var frUsageTrendChart = {
  chart: {
    type: 'area'
  },
  title: {
    text: 'FR Employee Load'
  },
  subtitle: {
    text: 'Trend of Employee Load on FR System',
    align: 'right',
    verticalAlign: 'bottom'
  },
  // legend: {
  //   layout: 'vertical',
  //   align: 'left',
  //   verticalAlign: 'top',
  //   x: 100,
  //   y: 70,
  //   floating: true,
  //   borderWidth: 1,
  //   backgroundColor: '#FFFFFF'
  // },
  xAxis: {
    categories: []
  },
  yAxis: {
    title: {
      text: 'Y-Axis'
    }
  },
  plotOptions: {
    area: {
      fillOpacity: 0.5
    }
  },
  credits: {
    enabled: false
  },
  series: [{
    name: 'Unique Employees ID',
    data: []
  }, {
    name: 'Frames Processed',
    data: [],
    visible: false
  }, {
    name: 'Camera Active',
    data: []
  }]
}

function updateCamDopdown(data) {
  $('#allCamDropdown').html('<option value="test">Select your CCTV ID</option>');
  for (var index = 0; index < data.length; index++) {
    $('#allCamDropdown').append('<option value="' + data[index]['camName'] + '" >' + data[index]['location'] + ' ( IP: ' + data[index]['camName'] + ')</option>')
  }
  $('#allCamDropdown').select2();
}

function updatePlantDopdown() {
  $('#allPlantDropdown').html('<option value="test">Select your Plant ID</option>');
  for (var index = 0; index < plantList.length; index++) {
    $('#allPlantDropdown').append('<option value="' + plantList[index] + '" >' + plantList[index] + '</option>')
  }
  $('#allPlantDropdown').select2();
}

function getAllCameraDetails(data) {
  $.ajax({
    url: serviceUrl + "face/caminfo?type=" + data.type + "&companyId=" + data.companyId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      updateCamDopdown(res);
      globalCameraObject = res;
      for (var i = 0; i < globalCameraObject.length; i++) {
        if (!plantList.includes(globalCameraObject[i]['plant'])) {
          plantList.push(globalCameraObject[i]['plant'])
        }
      }
      updatePlantDopdown();
      $('#camIdFilterDiv').hide()
      $('#plantIdFilterDiv').show()
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

$(window).on('load', function() {
  if (getUrlParameter('companyId') == undefined) {
    window.location.replace(updateQueryStringParameter($(location).attr('href'), "companyId", "JBMGroup"))
  }
  let urlUserId = $.cookie("uId") ? $.cookie("uId") : getUrlParameter('usr');
  $('#allCamDropdown').hide()
  $('.loader').show()
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
      currentUser = res;
      $.cookie("uId", res._id)
      if (res.email != 'sashank@gmail.com') {
        $('#maskingMenu').remove()
      }
    },
    error: function(err) {}
  });

  companyId = getUrlParameter('companyId');
  $('#overAllViewTable').DataTable();
  let yesterday = getdateISOString(-2);
  let today = getdateISOString(0);
  let aggResultOnComments = getCommentsData({
    filterType: "Plant",
    filterCategory: "prAnalytics"
  });

  getAllCameraDetails({
    type: 'faceRecog',
    companyId: companyId
  });

});

function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

$(function() {
  $('#datePickerMain').daterangepicker({
    // singleDatePicker: true,
    timeZone: 'Asia/Kolkata',
    showDropdowns: true,
    opens: 'left',
    minYear: 2019,
    // timePicker: true,
    maxYear: parseInt(moment().format('YYYY'), 10),
    maxDate: moment()
  }, function(start, end, label) {
    let startDate = getIndianTimeISOStringVerified(start);
    let endDate = getIndianTimeISOStringVerified(end);

    globalDateObject['start'] = startDate;
    globalDateObject['end'] = endDate;
  });
});

$(document).on('click', '#submitFilterLogic', function() {
  $('.loader').show()
  let filterDiv = $('#filterLogicDiv');
  let argObject = {
    filterType: filterDiv.find('.filterLogicSelectTag').val(),
    filterCategory: filterDiv.find('.filterCatgSelectTag').val(),
    filterGroupBy: filterDiv.find('.filterCatgSelectGroupType').val(),
  }
  if (filterDiv.find('.filterLogicSelectTag').val() == 'Camera') {
    argObject['filterTypeId'] = $('#allCamDropdown').val()
  } else if (filterDiv.find('.filterLogicSelectTag').val() == 'Plant') {
    argObject['filterTypePlantId'] = $('#allPlantDropdown').val()
  }
  let aggResultOnComments = getCommentsData(argObject);
})

$(document).on('change', '.filterCatgSelectTag', function() {
  if ($(this).val() == "prAnalytics") {
    $('.filterLogicSelectTag').val('Camera')
    $('#allCamDropdown').show()
  }
})

$(document).on('change', '.filterLogicSelectTag', function() {
  if ($(this).val() == "Plant") {
    $('#camIdFilterDiv').hide()
    $('#plantIdFilterDiv').show()
  } else if ($(this).val() == "Camera") {
    $('#camIdFilterDiv').show()
    $('#plantIdFilterDiv').hide()
  } else if ($(this).val() == "Group") {
    $('#camIdFilterDiv').hide()
    $('#plantIdFilterDiv').hide()
  }
})

function getCommentsData(data) {
  // let startDate = getdateISOString(parseInt($("input[name='optradio']:checked").val()));
  switch (data['filterCategory']) {
    case 'prAnalytics': {
      let apiUrl = "face/caminfo/aireports?startDate=" + globalDateObject['start'] + "&group=1"
      if (data['filterTypeId']) {
        if (data['filterTypeId'] != 'allCams') {
          apiUrl = apiUrl + "&camId=" + data['filterTypeId']
        }
      }
      $.ajax({
        url: serviceUrl + apiUrl,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        processData: false,
        dataType: "json",
        success: function(res, output, xhr) {
          formAiReportsCamInfo(res)
          $('.loader').hide()
          return (res)
        },
        error: function(err) {
          toastr["error"]("Acquisition Couldn't Information Refrshed")
        }
      });
      break;
    }

    case 'farAnalytics': {
      let apiUrl = "face/getAnalyticsFAR?startDate=" + globalDateObject['start']
      $.ajax({
        url: serviceUrl + apiUrl,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        processData: false,
        dataType: "json",
        success: function(res, output, xhr) {
          console.log("haha", res)
          formFarFrrReports(res)
          $('.loader').hide()
          return (res)
        },
        error: function(err) {
          toastr["error"]("Acquisition Couldn't Information Refrshed")
        }
      });
      break;
    }

    case 'frSystemAnalytics': {

    }

    case 'frUsageAnalytics': {
      let apiUrl = "face/getAnalytics/getEmpTrendAnalytics?startDate=" + globalDateObject['start'] + "&endDate=" + globalDateObject['end'] + "&groupBy=" + data['filterGroupBy'] + "&companyId=" + companyId
      if (data['filterTypeId']) {
        apiUrl = apiUrl + "&camId=" + data['filterTypeId']
      }
      if(data['filterTypePlantId']) {
        apiUrl = apiUrl + "&camPlantId=" + data['filterTypePlantId']
      }
      $.ajax({
        url: serviceUrl + apiUrl,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        processData: false,
        dataType: "json",
        success: function(res, output, xhr) {
          formTrendForUsage(res)
          $('.loader').hide()
          return (res)
        },
        error: function(err) {
          toastr["error"]("Couldn't Fetch Information")
            ('.loader').hide()
        }
      });
    }
  }
}

function number_format(val, decimals){
    //Parse the value as a float value
    val = parseFloat(val);
    if(isNaN(val)) {
      val = parseFloat(0)
    }
    //Format the value w/ the specified number
    //of decimal places and return it.
    return val.toFixed(decimals);
}

function formTrendForUsage(data) {
  // alert("adadd", data)
  let outerDiv = $('#plantWiseChartComments');
  outerDiv.html('');
  outerDiv.append('<h3>FR Employee Load Analytics</h3></br><div class="row rowTrendAnalytics"><div id="frUsageAnalyticsChart" class="col-md-12"></div><div class="col-md-12" style="margin-top: 20px;"><table id="frUsageAnalyticsTable" class="display" style="width:100%;">\
        <thead>\
            <tr>\
                <th>Date</th>\
                <th>Unique Employee IDs</th>\
                <th>#Cameras</th>\
                <th>#Frames Processed</th>\
                <th>#FR Process Time(sec)</th>\
                <th>#AS App Process Time(sec)</th>\
                <th>#Process completion with Temprature(sec)</th>\
            </tr>\
        </thead>\
        <tbody id="tableBodyFrUsageTrend">\
        </tbody>\
        <tfoot>\
          <tr>\
            <th>Date</th>\
            <th>Unique Employee IDs</th>\
            <th>#Cameras</th>\
            <th>#Frames Processed</th>\
            <th>#FR Process Time(sec)</th>\
            <th>#AS App Process Time(sec)</th>\
            <th>#Process completion with Temprature(sec)</th>\
          </tr>\
        </tfoot>\
        </table>\
        </div>\
        </div>');

  frUsageTrendChart['xAxis']['categories'] = []
  frUsageTrendChart['series'][0]['data'] = []
  frUsageTrendChart['series'][1]['data'] = []
  frUsageTrendChart['series'][2]['data'] = []

  let tempTable = "";
  for (var i = 0; i < data.length; i++) {
    if (data[i]['hour']) {
      frUsageTrendChart['xAxis']['categories'].push(String(data[i]['hour']).padStart(2, '0') + "Hr " + data[i]['day'] + "-" + data[i]['month'] + "-" + data[i]['year'])

      tempTable = tempTable + '<tr><td>' + String(data[i]['hour']).padStart(2, '0') + "Hr " + data[i]['day'] + "-" + data[i]['month'] + "-" + data[i]['year'] + '</td><td>' + data[i]['numberOfUniqueEmpIds'] + '</td><td>' + data[i]['numberOfUniqueCamIds'] + '</td><td>' + data[i]['framesProcessed'] + '</td><td>' + number_format(data[i]['avgFrTime'], 2) + '</td><td>' + number_format(data[i]['avgAsAppTime']*10, 2) + '</td><td>' + number_format(data[i]['avgAutoTempTime']/1000, 2) + '</td></tr>'
    } else {
      frUsageTrendChart['xAxis']['categories'].push(data[i]['day'] + "-" + data[i]['month'] + "-" + data[i]['year'])

      tempTable = tempTable + '<tr><td>' + data[i]['day'] + "-" + data[i]['month'] + "-" + data[i]['year'] + '</td><td>' + data[i]['numberOfUniqueEmpIds'] + '</td><td>' + data[i]['numberOfUniqueCamIds'] + '</td><td>' + data[i]['framesProcessed'] + '</td><td>' + number_format(data[i]['avgFrTime'], 2) + '</td><td>' + number_format(data[i]['avgAsAppTime']*10, 2) + '</td><td>' + number_format(data[i]['avgAutoTempTime']/1000, 2) + '</td></tr>'
    }

    frUsageTrendChart['series'][0]['data'].push(data[i]['numberOfUniqueEmpIds'])
    frUsageTrendChart['series'][1]['data'].push(data[i]['framesProcessed'])
    frUsageTrendChart['series'][2]['data'].push(data[i]['numberOfUniqueCamIds'])

  }

  $('#tableBodyFrUsageTrend').html('');
  console.log("Table", tempTable)
  $('#tableBodyFrUsageTrend').html(tempTable);
  $('#frUsageAnalyticsTable').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ]
    });
  Highcharts.chart('frUsageAnalyticsChart', frUsageTrendChart);
}

function formFarFrrReports(data) {
  let outerDiv = $('#plantWiseChartComments');
  outerDiv.html('');
  outerDiv.append('<h3>False Acceptance/Rejection Rate Analytics</h3></br>\
  <p>The false acceptance rate, or FAR, is the measure of the likelihood that the biometric security system will incorrectly accept an access attempt by an unauthorized user. A systems FAR typically is stated as the ratio of the number of false acceptances divided by the number of identification attempts.</p>\
  <p>The false rejection rate is the measure of the likelihood that the biometric security system will incorrectly reject an access attempt by an authorized user. A systems FRR typically is stated as the ratio of the number of false rejections divided by the number of identification attempts.</p></br>')
  outerDiv.append('\
  <table class="table table-striped table-bordered" id="aiReports">\
    <thead>\
      <tr>\
        <th>Camera</th>\
        <th>FAR</th>\
        <th>FRR</th>\
        <th>Frames Computed</th>\
        <th>Action (With Database)</th>\
      </tr>\
    </thead>\
    <tbody id="prAnalyticsTableBody">\
    </tbody>\
  </table>\
  ')

  let tbody = ''
  for (var index = 0; index < data.length; index++) {
    tbody = tbody + '<tr id="' + data[index]['_id'] + '"><td>' + data[index]['_id'] + '</td>\
    <td class="calcPrecision">' + round(data[index]['totalFalseDetections'] / data[index]['totalPersonsInFrames'], 3) + '</td>\
    <td class="calcRecall">' + round(data[index]['totalMisDetections'] / data[index]['totalPersonsInFrames'], 3) + '</td>\
    <td>' + data[index]['totalFrames'] + '</td>\
    <td></td>\
    </tr>'
  }
  $('#prAnalyticsTableBody').html(tbody);
  $('#aiReports').DataTable();
}

function countOfUniqueElements(arr) {
  var counts = {};
  for (var i = 0; i < arr.length; i++) {
    counts[arr[i]] = 1 + (counts[arr[i]] || 0);
  }
  return counts
}

function formAiReportsCamInfo(data) {
  let outerDiv = $('#plantWiseChartComments');
  outerDiv.html('');
  outerDiv.append('<h3>Precision - Recall Analytics</h3></br>')
  outerDiv.append('\
  <table class="table table-striped table-bordered" id="aiReports">\
    <thead>\
      <tr>\
        <th>Camera</th>\
        <th>Precision</th>\
        <th>Recall</th>\
        <th>Frames Computed</th>\
        <th>Action (With Database)</th>\
      </tr>\
    </thead>\
    <tbody id="prAnalyticsTableBody">\
    </tbody>\
  </table>\
  ')

  let tbody = ''
  for (var index = 0; index < data.length; index++) {
    tbody = tbody + '<tr id="' + data[index]['_id'] + '"><td>' + data[index]['_id'] + '</td>\
    <td class="calcPrecision">' + round(data[index]['precision'], 3) + '</td>\
    <td class="calcRecall">' + round(data[index]['recall'], 3) + '</td>\
    <td>' + data[index]['totalFramesComputed'] + '</td>\
    <td><button type="button" value=' + data[index]['precision'] + ' class="prAnalyticsAction setPrecision btn btn-default">Set Precision</button><button type="button" value=' + data[index]['recall'] + ' class="prAnalyticsAction setRecall btn btn-default">Set Recall</button><button type="button" value=' + data[index]['_id'] + ' class="viewDetails btn btn-default">Details</button></td></tr>'
  }
  $('#prAnalyticsTableBody').html(tbody);
  $('#aiReports').DataTable();
}

$(document).on('click', '.prAnalyticsAction', function() {
  let prObject = {
    text: ($(this).hasClass('setPrecision') ? 'Precision' : ($(this).hasClass('setRecall') ? 'Recall' : '')),
    value: ($(this).hasClass('setPrecision') ? $(this).parents('tr').find('.calcPrecision').text() : ($(this).hasClass('setRecall') ? $(this).parents('tr').find('.calcRecall').text() : ''))
  }

  swal({
      title: "Are you sure?",
      text: "The value of " + prObject['text'] + " will be set in the database as " + prObject['value'],
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {

        swal("Poof! Your imaginary file has been deleted!", {
          icon: "success",
        });
      } else {
        return;
      }
    });
})
