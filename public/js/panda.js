let localAttendance = {
  biometric: {},
  facialRecog: {},
  empDatabase: {}
}

let trendVariables = {
  start: 7,
  end: 0
}

let selected_frGroup = {
  name: undefined,
  type: "frAttendance"
}

let globalDateObject = {
  startDate: undefined,
  endDate: undefined
}

let comparisonChart = {
  chart: {
    type: 'column'
  },
  title: {
    text: 'Per day comparison'
  },
  subtitle: {
    text: 'Source: Starlink & FR System'
  },
  xAxis: {
    categories: [
      ''
    ],
    crosshair: true
  },
  yAxis: {
    min: 0,
    title: {
      text: 'Count'
    }
  },
  // tooltip: {
  //   headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
  //   pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
  //     '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
  //   footerFormat: '</table>',
  //   shared: true,
  //   useHTML: true
  // },
  plotOptions: {
    column: {
      pointPadding: 0.2,
      borderWidth: 0
    }
  },
  series: [{
    name: 'Biometric',
    data: [49.9]

  }, {
    name: 'Facial Recognition',
    data: [83.6]
  }]
}

let vennChart = {
  series: [{
    type: 'venn',
    name: 'Analytics',
    data: []
  }],
  title: {
    text: 'Venn Diagram for Facial Recognition / Biometric / DB'
  }
}

let trendChart = {
  chart: {
    type: 'area'
  },
  title: {
    text: 'Comparison Trend *'
  },
  // subtitle: {
  //   text: '* Jane\'s banana consumption is unknown',
  //   align: 'right',
  //   verticalAlign: 'bottom'
  // },
  // legend: {
  //   layout: 'vertical',
  //   align: 'right',
  //   verticalAlign: 'top',
  //   x: -100,
  //   y: 50,
  //   floating: true,
  //   borderWidth: 1,
  //   backgroundColor:
  //     Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
  // },
  xAxis: {
    categories: [],
    reversed: true
  },
  yAxis: {
    title: {
      text: 'Count'
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
    name: 'Biometrics',
    data: []
  }, {
    name: 'Facial Recognition',
    data: []
  }]
}

let tempObject = {}

var selected_Plant_ID = '';
var companyId = '';

var allCamsList = {}

$(window).on('load', async function() {
  if (getUrlParameter('companyId') == undefined) {
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

  let groupsListData = await groupsList({
    companyId: companyId,
    type: "frAttendance",
  });
  fillGroupsSelectTag(groupsListData);

  getCamerasPlantWise().then(function(d) {

    selected_frGroup["name"] = $('#slectFrGroupInComparison').val();
    companyId = getUrlParameter('companyId');
    // makeSideMenuActive('jbmHomeItem');
    let yesterday = getdateISOString(0);
    let yesterdayEnd = getdateISOString(0).split("T")[0] + "T23:59:59.999Z";

    getBiometricComparison({
      start: yesterday,
      end: yesterdayEnd,
      plant: selected_Plant_ID,
      companyId: companyId,
      changeComparisonTable: true,
      changeComparisonAnalytics: true,
      frGroupName: selected_frGroup["name"],
      frGroup: selected_frGroup["type"],
    })

    getTrendData({
      start: 0,
      end: -7,
      companyId: companyId,
      plant: selected_Plant_ID,
      frGroupName: selected_frGroup["name"],
      frGroup: selected_frGroup["type"],
    });
  })

});

function fillGroupsSelectTag(data) {
  let tempText = ""
  for (var gIndex = 0; gIndex < data.length; gIndex++) {
    tempText = tempText + "<option value='" + data[gIndex]['groupName'] + "'>" + data[gIndex]['groupName'] + "</option>"
  }
  $("#frGroupIdForBiometricUpload").html(tempText);
  $("#slectFrGroupInComparison").html(tempText);
  $(".select2able").select2();
}

$(document).on('change', '#biometricUploadType', function() {
  let currVal = $(this).val();
  switch (currVal) {
    case "plantWise": {
      $("#plantIdForBiometricUpload").show()
      $("#frGroupIdForBiometricUpload").hide()
      break;
    }
    case "frAttendanceGroupWise": {
      $("#plantIdForBiometricUpload").hide()
      $("#frGroupIdForBiometricUpload").show()
      break;
    }
    default: {

    }
  }
})

function getCamerasPlantWise() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: serviceUrl + "face/allCamsList",
      type: "GET",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      success: function(res, output, xhr) {
        allCamsList = res
        resolve()
      },
      error: function(err) {
        toastr["error"]("Logout Failed")
      }
    })
  })
}

$(document).on('click', '#prevMonthTrend', function() {
  trendVariables.start = trendVariables.start - 7
  trendVariables.end = trendVariables.end - 7

  getTrendData({
    start: trendVariables.start,
    end: trendVariables.end,
    companyId: companyId,
    plant: selected_Plant_ID,
    frGroupName: selected_frGroup["name"],
    frGroup: selected_frGroup["type"],
  });
})

$(document).on('click', '#nextMonthTrend', function() {
  trendVariables.start = trendVariables.start + 7
  trendVariables.end = trendVariables.end + 7

  getTrendData({
    start: trendVariables.start,
    end: trendVariables.end,
    companyId: companyId,
    plant: selected_Plant_ID,
    frGroupName: selected_frGroup["name"],
    frGroup: selected_frGroup["type"],
  });
})

$(document).on('click', '#recalculateTrendButton', function() {
  getTrendData({
    start: 0,
    end: -7,
    companyId: companyId,
    plant: selected_Plant_ID,
    frGroupName: selected_frGroup["name"],
    frGroup: selected_frGroup["type"],
  });
})

// https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop/40329190
function getTrendData(data) {
  let dateArray = []
  let dataArray = []

  trendChart['series'][0]['data'] = []
  trendChart['series'][1]['data'] = []
  trendChart['xAxis']['categories'] = []

  for (var i = data.start; i > data.end; i--) {
    dateArray.push(getdateISOString(i))
  }

  // let requests = dateArray.reduce((promiseChain, item) => {
  //     return promiseChain.then(() => new Promise((resolve) => {
  //       console.log(item)
  //       tempObject[item] = {}
  //       resolve({
  //         a : getBiometricInfo({
  //           start : item
  //         }).then((res) => {
  //           tempObject[item]['bio'] = parseInt(res.countPresent)
  //         }),
  //         b : getFaceInfo({
  //           start : item,
  //           end : item.split("T")[0] + "T23:59:59.999Z"
  //         }).then((res) => {
  //           tempObject[item]['fr'] = res.length
  //         })
  //       })
  //     }));
  // }, Promise.resolve());
  //
  // requests.then((values) => console.log('Done', tempObject))

  let trendChartHighchartGraph = Highcharts.chart('trendChart', trendChart);
  trendChartHighchartGraph.showLoading();

  $("#progressBarChartData").addClass("active")
  $("#progressBarChartData").css('width', 0+'%').attr('aria-valuenow', 0);
  const someProcedure = async n => {
    for (let i = 0; i < n; i++) {
      const bio = await getBiometricInfo({
        start: dateArray[i],
        companyId: companyId,
        plant: selected_Plant_ID,
        frGroupName: selected_frGroup["name"],
        frGroup: selected_frGroup["type"],

      })
      const fr = await getFaceInfo({
        start: dateArray[i],
        end: dateArray[i].split("T")[0] + "T23:59:59.999Z",
        companyId: companyId,
        plant: selected_Plant_ID,
        frGroupName: selected_frGroup["name"],
        frGroup: selected_frGroup["type"],
      })
      trendChart['title']['text'] = "Comparison Data for " + data.frGroupName
      trendChart['series'][0]['data'].push(parseInt(bio.countPresent))
      trendChart['series'][1]['data'].push(parseInt(fr.length))
      trendChart['xAxis']['categories'].push(dateArray[i].split("T")[0])

      let percCount = Math.abs(i/data.end * 100)
      $("#progressBarChartData").css('width', percCount+'%').attr('aria-valuenow', percCount);
      // console.log (bio, fr)
    }
    $("#progressBarChartData").css('width', 100+'%').attr('aria-valuenow', 100);
    $("#progressBarChartData").removeClass("active")
    return 'done'
  }

  someProcedure(dateArray.length).then(x => {
    // console.log(x)
    Highcharts.chart('trendChart', trendChart);
  })

  // let requests = dateArray.map((item) => {
  //     return new Promise((resolve) => {
  //       resolve({
  //         a : getBiometricInfo({
  //           start : item
  //         }),
  //         b : getFaceInfo({
  //           start : item,
  //           end : item.split("T")[0] + "T23:59:59.999Z"
  //         }),
  //         date : item
  //       })
  //     });
  // })
  //
  // Promise.all(requests).then((value) => {
  //   for (var i = 0; i < value.length; i++) {
  //     let tempDate = value[i]['date'].split("T")[0]
  //     let a = value[i]['a']
  //     let b = value[i]['b']
  //     Promise.all([a,b]).then(function (values) {
  //       let fr = values[1]
  //       let bio = values[0]
  //       trendChart['series'][0]['data'].push(parseInt(bio.countPresent))
  //       trendChart['series'][1]['data'].push(parseInt(fr.length))
  //       trendChart['xAxis']['categories'].push(tempDate)
  //     })
  //   }
  //   console.log(trendChart)
  //   Highcharts.chart('trendChart', trendChart);
  // });
}

$('#uploadForm').submit(function() {
  $("#status").empty().text("File is uploading...");
  $(this).ajaxSubmit({

    error: function(xhr) {
      status('Error: ' + xhr.status);
    },

    success: function(response) {
      if (response.status == 1) {
        toastr["success"]("Data successfully uploaded")
      } else {
        toastr["error"]("Data successfully fetched")
      }
    }
  });
  return false;
});

$(document).on('change', '#slectFrGroupInComparison', function() {
  selected_frGroup["name"] = $('#slectFrGroupInComparison').val();
  getBiometricComparison({
    start: localDateObject['start'],
    end: localDateObject['end'],
    plant: selected_Plant_ID,
    companyId: companyId,
    changeComparisonTable: true,
    changeComparisonAnalytics: true,
    frGroupName: selected_frGroup["name"],
    frGroup: selected_frGroup["type"],
  })

  getTrendData({
    start: 0,
    end: -7,
    companyId: companyId,
    plant: selected_Plant_ID,
    frGroupName: selected_frGroup["name"],
    frGroup: selected_frGroup["type"],
  });
})

$("#submitPm").click(function(event) {
  //disable the default form submission
  if ($.cookie("uId") != undefined) {
    event.preventDefault();
    //grab all form data
    var form = $('#uploadForm')[0];
    var data = new FormData(form);
    let file = $('#selectFilePlm')[0].files[0];
    let fileName = file.name.split(".")[0];
    var regex1 = RegExp(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/gm);
    var frGroupIdForBiometricUpload = $('#frGroupIdForBiometricUpload').val()
    let biometricUploadType = $('#biometricUploadType').val()

    let tempURL = serviceUrl + 'face/pmUpload?uId=' + $.cookie("uId") + '&fName=' + fileName + "&companyId=" + companyId;
    tempURL = tempURL + '&frGroupName=' + frGroupIdForBiometricUpload;
    tempURL = tempURL + '&frGroup=' + biometricUploadType;

    // if(regex1.test(fileName)){
    $.ajax({
      url: tempURL,
      type: 'POST',
      data: data,
      async: false,
      cache: false,
      contentType: false,
      processData: false,
      success: function(res) {
        if (res.status == 1) {
          $('#myModal').modal('toggle');
          toastr["success"]("Uploaded Biometric Attendance")
        } else {
          toastr["error"]("Uploading Biometric Attendance Failed")
        }
      },
      error: function() {
        toastr["error"]("error in ajax form submission for Biometric Attendance")
      }
    });
    // } else {
    //   toastr["error"]("Please correct the file name as YYYY-MM-DD")
    // }
    return false;
  } else {
    toastr["error"]("Please sign in again")
  }
});

function spearateEmpIdFromName(data) {
  const map1 = data.map(x => ({
    _id: parseInt(x._id.split("_")[1]),
    timeInfo: x.timeInfo
  }));
  return map1;
}

function spearateAllDBEmpIdFromName(data) {
  const map1 = data.map(x => ({
    _id: parseInt(x.empId.split("_")[1])
  }));
  return map1;
}

function convertempIdToId(data) {
  const map1 = data.map(x => ({
    _id: x.empId
  }));
  return map1;
}

function compareAllAttendanceRecords() {
  var props = ['_id'];

  let differenceInAttendance = {}

  differenceInAttendance['extraBiometricInCompFR'] = localAttendance['biometric'].filter(function(o1) {
    // filter out (!) items in result2
    return !localAttendance['facialRecog'].some(function(o2) {
      return o1._id === o2._id; // assumes unique id
    });
  }).map(function(o) {
    // use reduce to make objects with only the required properties
    // and map to apply this to the filtered array as a whole
    return props.reduce(function(newo, name) {
      newo[name] = o[name];
      return newo;
    }, {});
  });

  differenceInAttendance['extraBiometricInCompEmpDB'] = localAttendance['biometric'].filter(function(o1) {
    // filter out (!) items in result2
    return !localAttendance['empDatabase'].some(function(o2) {
      return o1._id === o2._id; // assumes unique id
    });
  }).map(function(o) {
    // use reduce to make objects with only the required properties
    // and map to apply this to the filtered array as a whole
    return props.reduce(function(newo, name) {
      newo[name] = o[name];
      return newo;
    }, {});
  });

  differenceInAttendance['missInDBandFRCount'] = differenceInAttendance['extraBiometricInCompFR'].filter(function(o1) {
    // filter out (!) items in result2
    return differenceInAttendance['extraBiometricInCompEmpDB'].some(function(o2) {
      return o1._id === o2._id; // assumes unique id
    });
  }).map(function(o) {
    // use reduce to make objects with only the required properties
    // and map to apply this to the filtered array as a whole
    return props.reduce(function(newo, name) {
      newo[name] = o[name];
      return newo;
    }, {});
  });

  let biometricArr = localAttendance['biometric'].map(function(el) {
    return el._id;
  });
  let facialArr = localAttendance['facialRecog'].map(function(el) {
    return el._id;
  });
  let dbArr = localAttendance['empDatabase'].map(function(el) {
    return el._id;
  });

  differenceInAttendance['commonFD'] = $.grep(facialArr, function(element) {
    return $.inArray(element, dbArr) !== -1;
  });

  differenceInAttendance['commonBD'] = $.grep(biometricArr, function(element) {
    return $.inArray(element, dbArr) !== -1;
  });

  differenceInAttendance['commonFB'] = $.grep(facialArr, function(element) {
    return $.inArray(element, biometricArr) !== -1;
  });

  differenceInAttendance['commonAll'] = $.grep(differenceInAttendance['commonFD'], function(element) {
    return $.inArray(element, differenceInAttendance['commonBD']) !== -1;
  });

  console.log(differenceInAttendance)
  return (differenceInAttendance)
}

function getFaceInfo(data) {
  return new Promise(function(resolve, reject) {
    let tempURL = serviceUrl + "face/getFaceInfo?" + "startDate=" + data.start + "&endDate=" + data.end + "&companyId=" + data.companyId;
    if (data.frGroupName) {
      tempURL = tempURL + '&frGroupName=' + data.frGroupName;
      tempURL = tempURL + '&frGroup=' + data.frGroup;
    } else {
      if (data.plant) {
        tempURL = tempURL + '&plantId=' + data.plant;
      }
      if (data.camId) {
        tempURL = tempURL + '&camId=' + data.camId;
      }
    }

    $.ajax({
      url: tempURL,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      success: function(res, output, xhr) {
        resolve(res)
      },
      error: function(err) {
        toastr["error"]("Getting Faces Info Failed")
      }
    });
  });
}

function getBiometricInfo(data) {
  return new Promise(function(resolve, reject) {
    let tempURL = serviceUrl + "face/biometric/dataInfo?startDate=" + data.start + "&companyId=" + data.companyId;
    if (data.frGroupName) {
      tempURL = tempURL + '&frGroupName=' + data.frGroupName;
      tempURL = tempURL + '&frGroup=' + data.frGroup;
    } else {
      if (data.plant) {
        tempURL = tempURL + '&plantId=' + data.plant;
      }
      if (data.camId) {
        tempURL = tempURL + '&camId=' + data.camId;
      }
    }

    $.ajax({
      url: serviceUrl + "face/biometric/dataInfo?startDate=" + data.start + "&companyId=" + data.companyId,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      success: function(res, output, xhr) {
        resolve(res)
      },
      error: function(err) {
        toastr["error"]("Getting Camera Info Failed")
      }
    });
  });
}

function getEmpInfoDB(data) {
  return new Promise(function(resolve, reject) {
    let tempURL = serviceUrl + "face/getEmpInfo?companyId=" + data.companyId ;
    if (data.frGroupName) {
      tempURL = tempURL + '&frGroupName=' + data.frGroupName;
      tempURL = tempURL + '&frGroup=' + data.frGroup;
    } else {
      if (data.plant) {
        tempURL = tempURL + '&plantId=' + data.plant;
      }
      if (data.camId) {
        tempURL = tempURL + '&camId=' + data.camId;
      }
    }
    $.ajax({
      url: tempURL,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      success: function(res, output, xhr) {
        resolve(res)
      },
      error: function(err) {
        toastr["error"]("Getting Faces Info Failed")
      }
    });
  });
}

function fillComparisonTable(data) {
  console.log("Comparison data", data)
  let frData = data.frData;
  let biometricData = data.biometricData;

  let tempComparisonObject = {}
  for (var fIndex = 0; fIndex < frData.length; fIndex++) {
    tempComparisonObject[frData[fIndex]._id.split("_")[1]] = tempComparisonObject[frData[fIndex]._id.split("_")[1]] || {};
    tempComparisonObject[frData[fIndex]._id.split("_")[1]]['empName'] = frData[fIndex]._id.split("_")[0]
    tempComparisonObject[frData[fIndex]._id.split("_")[1]]['date'] = frData[fIndex].timeInfo[0]['time'].split("T")[0]
    tempComparisonObject[frData[fIndex]._id.split("_")[1]]['frEntry'] = frData[fIndex].timeInfo[0]['time'].split("T")[1].split(".")[0]
    tempComparisonObject[frData[fIndex]._id.split("_")[1]]['frExit'] = frData[fIndex].timeInfo[frData[fIndex].timeInfo.length - 1]['time'].split("T")[1].split(".")[0]
  }
  for (var bIndex = 0; bIndex < biometricData.empArray.length; bIndex++) {
    tempComparisonObject[biometricData.empArray[bIndex].empId] = tempComparisonObject[biometricData.empArray[bIndex].empId] || {}
    tempComparisonObject[biometricData.empArray[bIndex].empId]['date'] = biometricData.empArray[bIndex].entryTime.split("T")[0]
    tempComparisonObject[biometricData.empArray[bIndex].empId]['biometricEntry'] = biometricData.empArray[bIndex].entryTime.split("T")[1].split(".")[0]
    tempComparisonObject[biometricData.empArray[bIndex].empId]['biometricExit'] = biometricData.empArray[bIndex].exitTime.split("T")[1].split(".")[0]
  }

  let tempRow = "";
  let count = 0;
  for (var empProp in tempComparisonObject) {
    tempRow += "<tr>";
    tempRow += "<td>" + ++count + "</td>"
    tempRow += "<td>" + empProp + "</td>"
    tempRow += "<td>" + selected_frGroup['name'] + "</td>"
    tempRow += "<td>" + (tempComparisonObject[empProp]['date'] ? tempComparisonObject[empProp]['date'] : "-") + "</td>"
    tempRow += "<td>" + (tempComparisonObject[empProp]['biometricEntry'] ? tempComparisonObject[empProp]['biometricEntry'] : "-") + "</td>"
    tempRow += "<td>" + (tempComparisonObject[empProp]['frEntry'] ? tempComparisonObject[empProp]['frEntry'] : "-") + "</td>"
    tempRow += "<td>" + (tempComparisonObject[empProp]['biometricExit'] ? tempComparisonObject[empProp]['biometricExit'] : "-") + "</td>"
    tempRow += "<td>" + (tempComparisonObject[empProp]['frExit'] ? tempComparisonObject[empProp]['frExit'] : "-") + "</td>"

    //https://stackoverflow.com/questions/13802587/how-to-convert-a-hhmmss-string-to-to-a-javascript-date-object
    let d1 = new Date();
    let d2 = new Date();
    let d3 = new Date();
    let d4 = new Date();

    if (tempComparisonObject[empProp]['biometricEntry'] && tempComparisonObject[empProp]['biometricExit']) {
      let [hoursBioEntry, minutesBioEntry] = tempComparisonObject[empProp]['biometricEntry'].split(':');
      d3.setHours(+hoursBioEntry);
      d3.setMinutes(minutesBioEntry);

      let [hoursBioExit, minutesBioExit] = tempComparisonObject[empProp]['biometricExit'].split(':');
      d4.setHours(+hoursBioExit);
      d4.setMinutes(minutesBioExit);
      diffMs = (d4 - d3);
      diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
      diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
      tempRow += "<td>" + diffHrs + "Hrs  " + diffMins + "Mins" + "</td>"
    } else {
      tempRow += "<td>" + "-" + "</td>"
    }

    if (tempComparisonObject[empProp]['frEntry'] && tempComparisonObject[empProp]['frExit']) {
      let [hoursFrEntry, minutesFrEntry, secondsFrEntry] = tempComparisonObject[empProp]['frEntry'].split(':');
      d1.setHours(+hoursFrEntry);
      d1.setMinutes(minutesFrEntry);
      d1.setSeconds(secondsFrEntry);

      let [hoursFrExit, minutesFrExit, secondsFrExit] = tempComparisonObject[empProp]['frExit'].split(':');
      d2.setHours(+hoursFrExit);
      d2.setMinutes(minutesFrExit);
      d2.setSeconds(secondsFrExit);

      var diffMs = (d2 - d1);
      var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
      var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

      tempRow += "<td>" + diffHrs + "Hrs  " + diffMins + "Mins" + "</td>"
    } else {
      tempRow += "<td>" + "-" + "</td>"
    }

    tempRow += "</tr>";
  }

  let comparisonTableDiv = '';
  comparisonTableDiv += '<table id="comparisonAnalyticsTable" class="display">' +
    '<thead>' +
    '<tr>' +
    '<th>#</th>' +
    '<th>Employee ID</th>' +
    '<th>Plant</th>' +
    '<th>Date</th>' +
    '<th>Biometric Entry</th>' +
    '<th>FR Entry</th>' +
    '<th>Biometric Exit</th>' +
    '<th>FR Exit</th>' +
    '<th>Biometric Time</th>' +
    '<th>FR Time</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody id="comparisonAnalyticsTableBody">' +
    tempRow +
    '</tbody>' +
    '</table>';

  $("#comparisonTableDiv").html(comparisonTableDiv);

  $('#comparisonAnalyticsTable').DataTable({
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

let localDateObject = {}

function getBiometricComparison(data) {

  let a = getFaceInfo(data)
  let b = getBiometricInfo(data)
  let c = getEmpInfoDB(data)

  Promise.all([a, b, c]).then(function(values) {

    let getFaceInfo = values[0]
    let getBiometricInfo = values[1]
    let getEmpInfoDB = values[2]

    if (data.changeComparisonAnalytics) {
      $('#biometricCount').html(getBiometricInfo['countPresent'])
      localAttendance['biometric'] = convertempIdToId(getBiometricInfo['empArray'])
      comparisonChart['series'][0]['data'] = []
      comparisonChart['series'][0]['data'] = [getBiometricInfo['countPresent']]

      $('#frCount').html(getFaceInfo.length);
      localAttendance['facialRecog'] = spearateEmpIdFromName(getFaceInfo);
      comparisonChart['series'][1]['data'] = []
      comparisonChart['series'][1]['data'] = [getFaceInfo.length]

      $('#dbCount').html(getEmpInfoDB.employeeInfo.length);
      localAttendance['empDatabase'] = spearateAllDBEmpIdFromName(getEmpInfoDB.employeeInfo);

      Highcharts.chart('comparisonChart', comparisonChart);
      let tempComparison = compareAllAttendanceRecords();
      $('#missInFRCount').html(tempComparison['extraBiometricInCompFR'].length);
      $('#missInDBCount').html(tempComparison['extraBiometricInCompEmpDB'].length);
      // $('#missInDBandFRCount').html(tempComparison['missInDBandFRCount'].length);
      vennChart.series.data = []
      vennChart.series[0].data.push({
        sets: ['F'],
        value: parseInt($('#frCount').text()),
        name: 'Facial Recognition'
      }, {
        sets: ['B'],
        value: parseInt($('#biometricCount').text()),
        name: 'Biometrics'
      }, {
        sets: ['D'],
        value: parseInt($('#dbCount').text()),
        name: 'Database'
      }, {
        sets: ['F', 'B'],
        value: tempComparison['commonFB'].length,
        name: 'Facial and Biometric'
      }, {
        sets: ['B', 'D'],
        value: tempComparison['commonBD'].length,
        name: 'Biometric and Database'
      }, {
        sets: ['F', 'D'],
        value: tempComparison['commonFD'].length,
        name: 'Facial and Database'
      }, {
        sets: ['F', 'B', 'D'],
        value: tempComparison['commonAll'].length,
        name: 'All common'
      })
      Highcharts.chart('vennChart', vennChart);
    }

    if (data.changeComparisonTable) {
      fillComparisonTable({
        frData: getFaceInfo,
        biometricData: getBiometricInfo
      });
    }
  })

}

$(function() {
  $('#datePickerPandaComparison').daterangepicker({
    singleDatePicker: true,
    timeZone: 'Asia/Kolkata',
    showDropdowns: true,
    opens: 'left',
    minYear: 2019,
    maxYear: parseInt(moment().format('YYYY'), 10),
    maxDate: moment()
  }, function(start, end, label) {
    let startDate = getIndianTimeISOStringVerified(start);
    let endDate = getIndianTimeISOStringVerified(end);

    localDateObject['start'] = startDate;
    localDateObject['end'] = endDate;

    getBiometricComparison({
      start: startDate,
      end: endDate,
      plant: selected_Plant_ID,
      companyId: companyId,
      changeComparisonTable: true,
      changeComparisonAnalytics: true,
      frGroupName: selected_frGroup["name"],
      frGroup: selected_frGroup["type"],
    })

    getTrendData({
      start: 0,
      end: -7,
      companyId: companyId,
      plant: selected_Plant_ID,
      frGroupName: selected_frGroup["name"],
      frGroup: selected_frGroup["type"],
    });

  });
});
