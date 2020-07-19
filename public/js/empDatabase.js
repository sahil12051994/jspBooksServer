var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

var selected_Plant_ID;
var allGroupsInfo = [];
//var console = {};
//console.log = function(){};
var workerCountShiftC;

var globalDateObject = {}

var empReportingStructure = {

  chart: {
    height: 600,
    inverted: true
  },

  title: {
    text: 'Reporting Structure (Dummy Data)'
  },

  series: [{
    type: 'organization',
    name: 'JBM Group',
    keys: ['from', 'to'],
    data: [
      ['Shareholders', 'Board'],
      ['Board', 'CEO'],
      ['CEO', 'CTO'],
      ['CEO', 'CPO'],
      ['CEO', 'CSO'],
      ['CEO', 'CMO'],
      ['CEO', 'HR'],
      ['CTO', 'Product'],
      ['CTO', 'Web'],
      ['CSO', 'Sales'],
      ['CMO', 'Market']
    ],
    levels: [{
      level: 0,
      color: 'silver',
      dataLabels: {
        color: 'black'
      },
      height: 25
    }, {
      level: 1,
      color: 'silver',
      dataLabels: {
        color: 'black'
      },
      height: 25
    }, {
      level: 2,
      color: '#980104'
    }, {
      level: 4,
      color: '#359154'
    }],
    nodes: [{
      id: 'Shareholders'
    }, {
      id: 'Board'
    }, {
      id: 'CEO',
      title: 'CEO',
      name: 'SK Arya'
    }, {
      id: 'HR',
      title: 'HR/CFO',
      name: 'Rajiv Sehdev',
      color: '#007ad0',
      column: 3,
      offset: '75%'
    }, {
      id: 'CTO',
      title: 'CTO',
      name: 'Christer Vasseng',
      column: 4,
      layout: 'hanging'
    }, {
      id: 'CPO',
      title: 'CPO',
      name: 'Torstein Hønsi',
      column: 4,
    }, {
      id: 'CSO',
      title: 'CSO',
      name: 'Anita Nesse',
      column: 4,
      layout: 'hanging'
    }, {
      id: 'CMO',
      title: 'CMO',
      name: 'Vidar Brekke',
      column: 4,
      layout: 'hanging'
    }, {
      id: 'Product',
      name: 'Product developers'
    }, {
      id: 'Web',
      name: 'General tech',
      description: 'Web developers, sys admin'
    }, {
      id: 'Sales',
      name: 'Sales team'
    }, {
      id: 'Market',
      name: 'Marketing team'
    }],
    colorByPoint: false,
    color: '#007ad0',
    dataLabels: {
      color: 'white'
    },
    borderColor: 'white',
    nodeWidth: 65
  }],
  tooltip: {
    outside: true
  },
  exporting: {
    allowHTML: true,
    sourceWidth: 800,
    sourceHeight: 600
  }

}

var empTimeDurationTrend = {

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
    },
    scrollbar: {
      enabled: true,
      showFull: false
    },
    // max: 5
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

var empyTimingTrendLineChart = {
  chart: {
    type: 'line'
  },
  title: {
    text: 'Logged Hours Trend'
  },
  subtitle: {
    text: 'Source: Facial Recognition'
  },
  xAxis: {
    categories: []
  },
  yAxis: {
    title: {
      text: 'Logged Hours'
    }
  },
  plotOptions: {
    line: {
      dataLabels: {
        enabled: true
      },
      enableMouseTracking: false
    }
  },
  series: [{
    name: 'Total Logged Hours',
    data: []
  }]
}

$(window).on('load', function() {
  if(getUrlParameter('companyId') == undefined) {
    window.location.replace(updateQueryStringParameter($(location).attr('href'), "companyId", "JBMGroup"))
  }
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

  let searchParams = new URLSearchParams(window.location.search)
  let empId = searchParams.get('empId')
  if(empId) {
    getEmpAllDetails(empId)
    $("html, body").animate({
      scrollTop: $("#empDetailsOuterDiv").offset().top
    }, "slow");
  }

  makeSideMenuActive('empDatabaseItem');
  let companyId = getUrlParameter('companyId')
  getAllEmpInfo(companyId);

  let f1 = getAllCameraDetails();
  $.when(f1).done(function(v1) {
    updateCamDopdown(v1);
  });

  Highcharts.chart('empReportingStructure', empReportingStructure);

  getAllGroupsInfo();
});

function getAllGroupsInfo() {
  $.ajax({
    url: serviceUrl + "face/groups/getinfo",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      allGroupsInfo = res;
      $('.multipleGroupsSelect').html()
      let tempGroupsSelectTag = ""
      for (var gIndex = 0; gIndex < allGroupsInfo.length; gIndex++) {
        allGroupsInfo[gIndex]
        tempGroupsSelectTag += '<option value="'+allGroupsInfo[gIndex]['groupName']+'">'+allGroupsInfo[gIndex]['groupName']+'</option>'
      }
      $('.multipleGroupsSelect').html(tempGroupsSelectTag);
      $('.multipleGroupsSelect').select2();
    },
    error: function(err) {
      toastr["error"]("Getting Groups Info Failed")
    }
  });
}

function getAllCameraDetails() {
  return $.ajax({
    url: serviceUrl + "face/caminfo/",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      allCamInfo = res;
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

function updateCamDopdown(data) {
  $('#empCamLocationInInfoModal').html('');
  for (var index = 0; index < data.length; index++) {
    $('#empCamLocationInInfoModal').append('<option value="' + data[index]['camName'] + '" >' + data[index]['location'] + ' ( IP: ' + data[index]['camName'] + ')</option>')
  }
  $('#empCamLocationInInfoModal').select2()
}

function getAllEmpInfo(companyId) {
  $.ajax({
    url: serviceUrl + "face/getEmpInfo?companyId=" + companyId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      $('#totalEmployeesInDB').html(res.totalEmployeesInDB);
      generateAttendanceTable(res.employeeInfo)
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
}

function generateAttendanceTable(empData) {
  // Inserting data in table-----------------------------------------------------------------------------
  let outerDiv = $('#empRecord');
  outerDiv.html('');
  outerDiv.append('<h3>Employee Record</h3> \
  <span style="font-size:2em; color:#A9DFBF">&#9632;&nbsp;</span><span style="font-size:1.5em;">Good Data</span>&nbsp;&nbsp;\
  <span style="font-size:2em; color:#EDBB99">&#9632;&nbsp;</span><span style="font-size:1.5em;">Average Data</span>&nbsp;&nbsp;\
  <span style="font-size:2em; color:#5DADE2">&#9632;&nbsp;</span><span style="font-size:1.5em;">Needs Improvement</span>&nbsp;&nbsp;\
  <span style="font-size:2em; color:#A93226">&#9632;&nbsp;</span><span style="font-size:1.5em;">No Encoding Formed</span>\
  </br>')
  outerDiv.append('\
    <table class="table table-striped table-bordered" id="empTable">\
      <thead>\
        <tr>\
          <th>#</th>\
          <th>Emp ID</th>\
          <th>Emp Name</th>\
          <th>Designation</th>\
          <th>Plant</th>\
          <th>Area</th>\
          <th>Actions</th>\
        </tr>\
      </thead>\
      <tbody id="empTableBody">\
      </tbody>\
    </table>\
    ')

  let tbody = ''
  for (let index = 0; index < empData.length; index++) {
    // <i class="fa fa-info-circle actionsRowFafaIcons empInfoIcon" aria-hidden="true" title="Information" data-toggle="modal" data-target="#empInfoModal"></i>&nbsp;&nbsp;&nbsp;&nbsp;\
    let actionsRow = '\
    <td>\
    <i class="fa fa-area-chart actionsRowFafaIcons empAnalyticsIcon" aria-hidden="true" title="Analytics" data-toggle="modal" data-target="#empAnalyticsModal"></i>&nbsp;&nbsp;&nbsp;&nbsp;\
    <i class="fa fa-pencil-square-o actionsRowFafaIcons empDetailsIcon" aria-hidden="true" title="Edit"></i>&nbsp;&nbsp;&nbsp;&nbsp;\
    <i class="fa fa-trash actionsRowFafaIcons empDeleteIcon" aria-hidden="true" title="Delete Employee"></i>\
    </td>\
    ';

    let bgColor = '';
    let aiSize = 0;
    if (empData[index]['aiData']) {
      bgColor = '#C7EDD7'
      for (var i = 0; i < empData[index]['aiData']['encodingData'].length; i++) {
        if (empData[index]['aiData']['encodingData'][i]['path'].includes("face_encodings.data")) {
          aiSize = empData[index]['aiData']['encodingData'][i]['size'];
          // console.log(empData[index]['aiData']['encodingData'][i]['size'])
          if (empData[index]['aiData']['encodingData'][i]['size'] < 7000) {
            bgColor = '#5DADE2'
          } else if (7000 < empData[index]['aiData']['encodingData'][i]['size'] < 9000) {
            bgColor = '#EDBB99'
          } else {
            bgColor = '#A9DFBF'
          }
        }
      }
    } else {
      bgColor = '#A93226'
    }

    tbody = tbody + '<tr empId="' + empData[index]['empId'] + '" mId="' + empData[index]['_id'] + '" style="background-color:' + bgColor + '!important;" aiSize="'+ aiSize +'">\
    <td>' + (index + 1) + '</td>\
    <td>' + empData[index]['empId'].split("_")[1] + '</td>\
    <td style="text-align: left;">' + toTitleCase(empData[index]['empId'].split("_")[0]) + '</td>\
    <td>' + empData[index]['designation'] + '</td>\
    <td>' + empData[index]['plant'] + '</td>\
    <td>' + empData[index]['workDetails']['areaAssigned']['camId'] + '</td>\
    ' + actionsRow + '</tr>'
  }

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

$(document).on('click', '.empDetailsIcon', function() {
  let empId = $(this).closest('tr').attr('empId')
  getEmpAllDetails(empId)
  $("html, body").animate({
    scrollTop: $("#empDetailsOuterDiv").offset().top
  }, "slow");
})

$(document).on('click', '.empDeleteIcon', function() {
  let empId = $(this).closest('tr').attr('empId')
  swal({
      title: "Want to delete "+ empId +" ?",
      text: "Employee will be permanently deleted, and can not be recovered",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        deleteEmployee(empId)
      } else {
        return;
      }
    });
})

function deleteEmployee(empId) {
  $.ajax({
    url: serviceUrl + "face/getEmpInfo/" + empId,
    type: "DELETE",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      if(res['status'] == 1) {
        toastr["success"]("Employee Deleted")
        $('tr[empid="'+ empId +'"]').remove();
      }
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
}

function getEmpAllDetails(empId) {
  let outerDiv = $('#empDetails');
  $('#empInfoUpdate').attr('empName', toTitleCase(empId.split("_")[0]));
  $('#empInfoUpdate').attr('empId', empId);
  outerDiv.find('.empNameToBeShown').html(empId);
  $.ajax({
    url: serviceUrl + "face/getEmpInfo/" + empId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      // console.log(res[0])
      let empData = res[0]
      $('#empIdInInfoModal').val(empData.empId)
      $('#empPlantInInfoModal').val(empData.plant)
      $('#empDesgnInInfoModal').val(empData.designation)
      $('#empNameInInfoModal').val(empData.empName)
      $('#empCamLocationInInfoModal').val(empData.workDetails.areaAssigned.camId)
      $('#empCamLocationInInfoModal').val(empData.workDetails.areaAssigned.camId)
      $('#empLocationTypeInInfoModal').val(empData.workDetails.areaAssigned.type)

      let groupsArr = []
      for (var i = 0; i < empData.groups.length; i++) {
        groupsArr.push(empData.groups[i]['groupName'])
      }
      console.log(groupsArr)
      $('.multipleGroupsSelect').val(groupsArr)
      $('.multipleGroupsSelect').trigger('change');

      $('#empInfoModal').attr('mId', empData._id)
      if (empData.aiData) {
        if(empData.aiData.encodingData) {
          if( empData.aiData.encodingData[1]) {
            // $('#encodingSizeInInfoModal').val(bytesToSize(empData.aiData.encodingData[1]['size']))
            $('#encodingSizeInInfoModal').val(empData.aiData.encodingData[1]['size'])
          }
        }
      }
      $('#imagesViewTraining').html('')
      for (var index = 0; index < empData.trainingImages.length; index++) {
        //style="transform: rotate(90deg);" .split(".jpg")[0] + ".webp"
        $('#imagesViewTraining').append('<img id="processedFrame" src="' + commonFrameLink + 'face/getImage?path=' + empData.trainingImages[index] + '" width="200" height="200" ondblclick="window.open(this.src)">')
      }
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });

  $.ajax({
    url: serviceUrl + "face/getEmpAnalytics/" + empId + "?startDate=" + getdateISOString(-7) + "&endDate=" + getdateISOString(0),
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let empData = (res.length > 0) ? res[0] : [];

      let groupByDate = groupEntryByDates(empData['timeInfo'])
      let empHistoryInInfoModalTable = '<table class="table table-fixed table-bordered"><thead><tr><th>Recent History</th></tr></thead><tbody>'
      empTimeDurationTrend['series'][0]['data'] = []
      empyTimingTrendLineChart['series'][0]['data'] = []
      empTimeDurationTrend['xAxis']['categories'] = []
      empTimeDurationTrend['xAxis']['categories'] = groupByDate.map(function(value) {
        return value.date;
      });
      empyTimingTrendLineChart['xAxis']['categories'] = []
      empyTimingTrendLineChart['xAxis']['categories'] = empTimeDurationTrend['xAxis']['categories'];
      for (var tIndex = 0; tIndex < groupByDate.length; tIndex++) {
        let lengthFramesOfDate = groupByDate[tIndex]['empData'].length
        let startTime = new Date(groupByDate[tIndex]['empData'][0]['time']).getUTCHours() + (((new Date(groupByDate[tIndex]['empData'][0]['time']).getUTCMinutes() - 0) / (60 - 0)))
        let endTime = new Date(groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time']).getUTCHours() + (((new Date(groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time']).getUTCMinutes() - 0) / (60 - 0)))
        empTimeDurationTrend['series'][0]['data'].push([
          round(startTime, 1),
          round(endTime, 1)
        ])
        empyTimingTrendLineChart['series'][0]['data'].push(round(round(endTime, 1) - round(startTime, 1), 0))
        empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
        <td>\
          <span>' + moment(groupByDate[tIndex]['empData'][0]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
          <a href="' + commonFrameLink + 'face/getframe?camId=' + groupByDate[tIndex]['empData'][0]['camId'] + '&time=' + groupByDate[tIndex]['empData'][0]['time'] + '" target="_blank" camId="' + groupByDate[tIndex]['empData'][0]['camId'] + '" time="' + groupByDate[tIndex]['empData'][0]['time'] + '" style="float:right;">View Frame</a>\
        </td>\
        </tr>';
        empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
        <td>\
          <span>' + moment(groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
          <a href="' + commonFrameLink + 'face/getframe?camId=' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['camId'] + '&time=' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time'] + '" target="_blank" camId="' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['camId'] + '" time="' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time'] + '" style="float:right;">View Frame</a>\
        </td>\
        </tr>';
      }

      empHistoryInInfoModalTable = empHistoryInInfoModalTable + '</tbody></table>';
      $('#employeeTimingTable').html(empHistoryInInfoModalTable);
      empTimeDurationTrend['series'][0]['data'] = empTimeDurationTrend['series'][0]['data'].slice(empTimeDurationTrend['series'][0]['data'].length - 7, empTimeDurationTrend['series'][0]['data'].length);
      empTimeDurationTrend['xAxis']['categories'] = empTimeDurationTrend['xAxis']['categories'].slice(empTimeDurationTrend['xAxis']['categories'].length - 7, empTimeDurationTrend['xAxis']['categories'].length);
      console.log(empTimeDurationTrend)
      Highcharts.chart('empTimeDurationTrend', empTimeDurationTrend);
      Highcharts.chart('empyTimingTrendLineChart', empyTimingTrendLineChart);
    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
}

$(document).on('click', '.empInfoIcon', function() {
  let empId = $(this).closest('tr').attr('empId')
  $('#empNameInInfoModal').html(toTitleCase(empId.split("_")[0]));
  $('#empInfoUpdate').attr('empName', toTitleCase(empId.split("_")[0]));

  $.ajax({
    url: serviceUrl + "face/getEmpInfo/" + empId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      // console.log(res[0])
      let empData = res[0]
      $('#empIdInInfoModal').val(empData.empId)
      $('#empPlantInInfoModal').val(empData.plant)
      $('#empDesgnInInfoModal').val(empData.designation)
      $('#empCamLocationInInfoModal').val(empData.workDetails.areaAssigned.camId)
      $('#empCamLocationInInfoModal').val(empData.workDetails.areaAssigned.camId)
      $('#empLocationTypeInInfoModal').val(empData.workDetails.areaAssigned.type)

      let groupsArr = []
      for (var i = 0; i < empData.groups.length; i++) {
        groupsArr.push(empData.groups[i]['groupName'])
      }
      console.log(groupsArr)
      $('.multipleGroupsSelect').val(groupsArr)
      $('.multipleGroupsSelect').trigger('change');

      $('#empInfoModal').attr('mId', empData._id)
      $('#imagesViewTraining').html('')
      for (var index = 0; index < empData.trainingImages.length; index++) {
        //style="transform: rotate(90deg);"
        $('#imagesViewTraining').append('<img id="processedFrame" src="' + commonFrameLink + 'face/getImage?path=' + empData.trainingImages[index] + '" width="200" height="200" ondblclick="window.open(this.src)">')
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

$(document).on('click', '#empInfoUpdate', function() {
  let dataOut = {}
  let empId = $('#empInfoUpdate').attr('empId');
  let empData = {}
  empData['empId'] = $('#empIdInInfoModal').val()
  empData['empName'] = $('#empNameInInfoModal').val()
  empData['plant'] = $('#empPlantInInfoModal').val()
  empData['designation'] = $('#empDesgnInInfoModal').val()
  empData['workDetails'] = {}
  empData['workDetails']['areaAssigned'] = {}
  empData['workDetails']['areaAssigned']['camId'] = $('#empCamLocationInInfoModal').val()
  // empData['workDetails']['areaAssigned']['type'] = $('#empLocationTypeInInfoModal').val()
  empData['workDetails']['areaAssigned']['department'] = $('#empDepartmentInInfoModal').val()
  empData['workDetails']['areaAssigned']['subDepartment'] = $('#empSubDepartmentInInfoModal').val()
  empData['workDetails']['operatorZone'] = {}
  empData['workDetails']['operatorZone']['operatorZoneId'] = $('#empOpZoneIdInInfoModal').val()
  empData['workDetails']['operatorZone']['operatorZoneType'] = $('#empOpZoneTypeInInfoModal').val()
  empData['groups'] = $('.multipleGroupsSelect').val()

  console.log(empData)
  dataOut['empInfo'] = empData

  swal({
      title: "Are you sure?",
      text: "The info of " + $('#empInfoUpdate').attr('empName') + " will be updated in Database\nAnd will be logged for account that has changed it.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        $.ajax({
          url: serviceUrl + "face/getEmpInfo/" + empId,
          type: "PUT",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          crossDomain: true,
          data: JSON.stringify(dataOut),
          beforeSend: function(request) {
            request.setRequestHeader('Authorization', authToken);
            request.setRequestHeader("Access-Control-Allow-Origin", "*");
          },
          success: function(res) {
            toastr["success"]("Employee data has been updated")
          },
          error: function(err) {}
        });
      } else {
        return;
      }
    });
})

function groupEntryByDates(empData) {
  if(empData) {
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

    return (groupArrays);
  }
  else {
    return([])
  }
}

$(document).on('click', '.empAnalyticsIcon', function() {
  let empId = $(this).closest('tr').attr('empId')
  $('#empNameInAnalyticsModal').html(toTitleCase(empId.split("_")[0]))

  $.ajax({
    url: serviceUrl + "face/getEmpAnalytics/" + empId  + "?startDate=" + getdateISOString(-7) + "&endDate=" + getdateISOString(0),
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let empData = (res.length > 0) ? res[0] : [];
      let confScoresArray = []
      for (var index = 0; index < empData['confScores'].length; index++) {
        confScoresArray.push(empData['confScores'][index])
      }
      // scatterPlotGraph['series'][0]['name'] = toTitleCase(empId.split("_")[0]);
      // console.log(scatterPlotGraph['series'][1]['data'])
      scatterPlotGraph['series'][1]['data'] = empData['confScores'];
      Highcharts.chart('empConfInAnalyticsModal', scatterPlotGraph);
      $('#empNumFramesInInfoModal').html(empData['timeInfo'].length)
      if (empData['confScores'].length != 0) {
        $('#avgConfScore').html(math.mean(empData['confScores']))
      } else if (empData['confScores'].length == 0) {
        $('#avgConfScore').html("No Data")
      }

      let groupByDate = groupEntryByDates(empData['timeInfo'])
      let empHistoryInInfoModalTable = '<table class="table table-fixed table-bordered"><thead><tr><th>Recent History</th></tr></thead><tbody>'

      for (var tIndex = 0; tIndex < groupByDate.length; tIndex++) {
        // empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr><td>' + moment(empData['timeInfo'][tIndex]['time']).toDate().toUTCString().split("GMT")[0] + '</td></tr>'
        let lengthFramesOfDate = groupByDate[tIndex]['empData'].length
        let startTime = new Date(groupByDate[tIndex]['empData'][0]['time']).getUTCHours() + (((new Date(groupByDate[tIndex]['empData'][0]['time']).getUTCMinutes() - 0) / (60 - 0)))
        let endTime = new Date(groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time']).getUTCHours() + (((new Date(groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time']).getUTCMinutes() - 0) / (60 - 0)))

        empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
        <td>\
          <span>' + moment(groupByDate[tIndex]['empData'][0]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
          <a href="' + commonFrameLink + 'face/getframe?camId=' + groupByDate[tIndex]['empData'][0]['camId'] + '&time=' + groupByDate[tIndex]['empData'][0]['time'] + '" target="_blank" camId="' + groupByDate[tIndex]['empData'][0]['camId'] + '" time="' + groupByDate[tIndex]['empData'][0]['time'] + '" style="float:right;">View Frame</a>\
        </td>\
        </tr>';
        empHistoryInInfoModalTable = empHistoryInInfoModalTable + '<tr>\
        <td>\
          <span>' + moment(groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time']).toDate().toUTCString().split("GMT")[0] + '</span>\
          <a href="' + commonFrameLink + 'face/getframe?camId=' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['camId'] + '&time=' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time'] + '" target="_blank" camId="' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['camId'] + '" time="' + groupByDate[tIndex]['empData'][lengthFramesOfDate - 1]['time'] + '" style="float:right;">View Frame</a>\
        </td>\
        </tr>';
      }
      empHistoryInInfoModalTable = empHistoryInInfoModalTable + '</tbody></table>';
      $('#empHistoryInInfoModal').html(empHistoryInInfoModalTable);

    },
    error: function(err) {
      toastr["error"]("Getting Faces Info Failed")
    }
  });
})
