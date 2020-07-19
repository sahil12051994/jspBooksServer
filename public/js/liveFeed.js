var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

var selected_Plant_ID = 'CORP';
var globalEmployeeGeneralData = {}
var globalCameraDetails = []
var globalCameraDetailsObject = {}
var accessControlImage = 0;
var IoTDeviceIp = undefined;
// for testing over local - cors error
// tempServiceURL = "http://localhost:8085"
tempServiceURL = serviceUrl
var socket = io(tempServiceURL, {
  path: '/kafkaface/socket'
});

var globalRequestTempSent = false;
var globalRequestAuthSent = false;

toastr.options = {
  "preventDuplicates": true,
  "preventOpenDuplicates": true
};

socket.on('connect', () => {
  console.log("Connected to backend socket")
});

socket.on('connect_error', function(err) {
  console.log('Connection Failed', err);
});

var selected_Cam_ID = "cam_1031540_1001"

function isBase64(str) {
  if (str === '' || str.trim() === '') {
    return false;
  }
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}

function getCameraDetails(camId) {
  for (var i = 0; i < globalCameraDetails.length; i++) {
    if (camId == globalCameraDetails[i]['camName']) {
      return globalCameraDetails[i]
    }
  }
}

function setCamera() {
  let camDetails = getCameraDetails(selected_Cam_ID)
  if (camDetails) {
    $('#plantLocationText').html(camDetails['plantLocation']);
    $('#cameraLocationText').html(camDetails['cameraLocation']);
    $('#cameraIpText').html(camDetails['hardware']['ip']);
    $('#cameraMakeText').html(camDetails['hardware']['make']);
  }
  $.ajax({
    url: tempServiceURL + "kafkaface/setCamera?camId=" + selected_Cam_ID,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    success: function(res) {
      console.log(res)
    },
    error: function(err) {}
  });
}

function gistOfEmployeeGeneralData(data) {
  let dataObj = {}
  for (var empIndex = 0; empIndex < data.length; empIndex++) {
    let tempObj = {
      bodyTemp: 0
    }
    for (var dIndex = 0; dIndex < data[empIndex]['data'].length; dIndex++) {
      if (data[empIndex]['data'][dIndex]) {
        tempObj['bodyTemp'] = 1
        break;
      }
    }
    dataObj[data[empIndex]['_id']] = tempObj;
  }
  return dataObj;
}

function cronToRemoveCapturedEmployeeData() {
  for (var key in globalEmployeeGeneralData) {
    // check if the property/key is defined in the object itself, not in parent
    if (globalEmployeeGeneralData.hasOwnProperty(key)) {
      if (globalEmployeeGeneralData[key]['bodyTemp'] = 1) {
        $('#' + key).remove()
      }
    }
  }
}

function updateEmployeeListGeneralParams() {
  let startDate = getdateISOString(0).split("T")[0] + "T00:00:00.000Z";
  let endDate = getdateISOString(0).split("T")[0] + "T23:59:59.999Z";
  $.ajax({
    url: serviceUrl + "face/covid/data?startDate=" + startDate + "&endDate=" + endDate,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      globalEmployeeGeneralData = gistOfEmployeeGeneralData(res);
      cronToRemoveCapturedEmployeeData();
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

// (function(){
//     // do some stuff
//     // updateEmployeeListGeneralParams();
// })();

var uniqueEmployeeArray = []

function addEmployeeToArray(element) {
  // uniqueEmployeeArray.indexOf(newItem) === -1 ? uniqueEmployeeArray.push(newItem) : console.log("This item already exists");
  let found = false;
  for (var i = 0; i < uniqueEmployeeArray.length; i++) {
    if (uniqueEmployeeArray[i]['empId'] == element.empId) {
      found = true;
      uniqueEmployeeArray[i]['asResult'] = element.asResult
      break;
    }
  }
  if (!found) {
    uniqueEmployeeArray.push(element)
  }

  uniqueEmployeeArray.sort(function(a, b) {
    var keyA = new Date(a.time),
      keyB = new Date(b.time);
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  // console.log(uniqueEmployeeArray)
}

//function to avoid employees entring before 1 hour
setInterval(function() {
  for (var eIndex = 0; eIndex < uniqueEmployeeArray.length; eIndex++) {
    let timeDiff = Date.now() - uniqueEmployeeArray[eIndex]['time']
    let timeDiffThreshold = (1000 * 60)
    if (timeDiff > timeDiffThreshold) {
      uniqueEmployeeArray.splice(eIndex, 1)
    }
  }

  $('.alreadyDone').each(function(index) {
    $(this).remove()
  })
}, 10000);

function getEmpInfo(empId) {
  empId = empId.replace("hhyt", "@")
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: serviceUrl + "face/getEmpInfo/" + empId,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      success: function(res) {
        resolve(res)
      },
      error: function(err) {}
    });
  });
}

function changeSocketId() {
  socket.on(selected_Cam_ID, function(data) {
    $('[id]').each(function() {
      $('[id="' + this.id + '"]:gt(0)').remove();
    });

    // console.log("Listening...", data);
    var oneEmployeeDiv = "";
    let tempData = JSON.parse(data)
    if (tempData.camId == selected_Cam_ID) {
      console.log(data)
      // console.log(isBase64(tempData['frame']))
      let imgElem = document.getElementById("liveFeedImage")
      let liveFeedImageDefault = document.getElementById("liveFeedImageDefault")
      if (tempData['_id']) {

        // imgElem.setAttribute('src', "data:image/png;base64," + tempData['frame']);
        $('#liveFeedImage').show()
        imgElem.setAttribute('src', commonFrameLink + 'face/getFrame?fId=' + tempData['_id']);
        $('#liveFeedImageDefault').hide()
      } else {
        $('#liveFeedImage').hide()
        $('#liveFeedImageDefault').show()
      }

      if (tempData.personsDetected.length > 0) {
        let unknownPresent = false;
        for (var i = 0; i < tempData.personsDetected.length; i++) {
          tempData.personsDetected[i].empId = tempData.personsDetected[i].empId.replace("@", "hhyt")
          addEmployeeToArray({
            empId: tempData.personsDetected[i].empId,
            asResult: tempData.asResult,
            frameId: tempData._id,
            time: Date.now(),
            attendance: "started"
          })
          if (tempData.personsDetected[i].empId == 'Unknown') {
            unknownPresent = true;
          }
        }

        if (!unknownPresent) {
          $('#Unknown').remove()
          for (var i = 0; i < uniqueEmployeeArray.length; i++) {
            if (uniqueEmployeeArray[i]['empId'] == 'Unknown') {
              uniqueEmployeeArray.splice(i, 1)
            }
          }
        }

        for (let i = 0; i < uniqueEmployeeArray.length; i++) {
          // console.log("element there?",'#' + uniqueEmployeeArray[i]['empId'] ,$('#' + uniqueEmployeeArray[i]['empId']).length)
          uniqueEmployeeArray[i]['empId'] = uniqueEmployeeArray[i]['empId'].replace("@", "hhyt")
          let asStatus = uniqueEmployeeArray[i]['asResult']
          let frameId = uniqueEmployeeArray[i]['frameId']



          if (uniqueEmployeeArray[i]['attendance'] == "done") {

            oneEmployeeDiv = oneEmployeeDiv + "<div class='row employeeRow alreadyDone' id=" + uniqueEmployeeArray[i]['empId'] + "><div class='col-md-12'><h2>" + uniqueEmployeeArray[i]['empId'].split("_")[0].replace("hhyt", "@") + "</h2><h2>ID: " + uniqueEmployeeArray[i]['empId'].split("_")[1] + "</h2><h1>Already Done</h1></div></div>"
            $("#personInfo").append(oneEmployeeDiv)

          } else {
            {
              if (uniqueEmployeeArray[i]['empId'] == 'Unknown') {

                oneEmployeeDiv = oneEmployeeDiv + "<div class='row employeeRow' id=" + uniqueEmployeeArray[i]['empId'] + "><div class='col-md-12'><h2>" + uniqueEmployeeArray[i]['empId'].split("_")[0].replace("hhyt", "@") + "</h2><h2>ID: " + uniqueEmployeeArray[i]['empId'].split("_")[1] + "</h2></div></div>"
                $("#personInfo").prepend(oneEmployeeDiv)

              } else {

                let selected_Cam_ID_Details = globalCameraDetailsObject[selected_Cam_ID]

                console.log("selected_Cam_ID_Details", selected_Cam_ID_Details)
                if (selected_Cam_ID_Details.hasOwnProperty('usageType')) {

                  // selected_Cam_ID_Details['usageType'] = "fr|accessControl|asApp|tempratureAutomation"
                  // selected_Cam_ID_Details['usageType'] = "fr|asApp|tempratureAutomation"
                  if (selected_Cam_ID_Details['usageType'] == null) {
                    selected_Cam_ID_Details['usageType'] = "fr"
                  }

                  let usageTypes = selected_Cam_ID_Details['usageType'].split("|");

                  let accessControlDiv = "\
                    <div class='col-md-12 rowCheck rowParam accessControlRow'>\
                      <p class='authStatusValue' style='font-size:20px'></p>\
                      <div class='row accessControlInfoRow' style='margin-left: 10px;'>\
                      </div>\
                    </div>"

                  let tempratureDiv = "\
                    <div class='col-md-12 rowCheck rowParam temperatureRow'>\
                      <input type='text' class='bodyTemp' placeholder='Enter Temprature' required='required'>\
                      <button class='btn btn-default thermometerReading'>Thermometer</button>&nbsp;&nbsp;\
                      <button class='btn btn-success submitTemp'>Submit</button>\
                    </div>"

                  let asAppDiv = "\
                    <div class='col-md-12 rowCheck rowParam asAppRow' style='margin-bottom:5px'>\
                      <label for='vehicle1'>App Status ?</label>&nbsp;&nbsp;\
                      <div class='btn-group btn-group-toggle asAppStatus' data-toggle='buttons'>\
                        <label class='btn btn-secondary asAppStatusButton noInput' style='background-color: #E5E7E9;'>\
                          <input type='radio' name='asAppoptions' id='option0' value='noInput'> NO INPUT\
                        </label>\
                        <label class='btn btn-secondary asAppStatusButton asGreen' style='background-color: green;'>\
                          <input type='radio' name='asAppoptions' id='option1' value='green'> Green\
                        </label>\
                        <label class='btn btn-secondary asAppStatusButton asRed' style='background-color: red;'>\
                          <input type='radio' name='asAppoptions' id='option2' value='red'> Red\
                        </label>\
                      </div>\
                      <p class='bigTempValue' style='font-size:20px'>" + asStatus + "</p>\
                    </div>"

                  oneEmployeeDiv += "\
                    <div class='row employeeRow' id=" + uniqueEmployeeArray[i]['empId'].replace("@", "hhyt") + " frameId='" + frameId + "'>\
                      <div class='col-md-12'>\
                        <h2>" + uniqueEmployeeArray[i]['empId'].split("_")[0].replace("hhyt", "@") + "</h2>\
                        <h2>ID: " + uniqueEmployeeArray[i]['empId'].split("_")[1] + "</h2>\
                      </div>\
                      <div class='col-md-12'>\
                        <div class='row'>" +
                    (usageTypes.includes("asApp") ? asAppDiv : "") +
                    (usageTypes.includes("tempratureAutomation") ? tempratureDiv : "") +
                    (usageTypes.includes("accessControl") ? accessControlDiv : "") +
                    "<div class='col-md-12'><button class='btn btn-danger discardButton' style='width: 100%;' timeOfAddition='" + Date.now() + "'><i class='fa fa-close'></i>&nbsp;&nbsp;Discard</button></div>\
                    </div>\
                      </div>\
                    </div>";

                  if ($("#" + uniqueEmployeeArray[i]['empId']).length) {
                    // $('#' + uniqueEmployeeArray[i]).remove()
                  } else {

                    $("#personInfo").prepend(oneEmployeeDiv)
                  }

                  try {
                    const someAsyncProcedure = async data => {

                      let uniqueEmployeeArray = data.uniqueEmployeeArray
                      let authorizedHitLight = true;

                      if (usageTypes.includes("accessControl")) {
                        const empInfo = await getEmpInfo(uniqueEmployeeArray['empId']);
                        let groups = empInfo[0].groups;
                        let cctvArray = []
                        if (groups) {
                          for (var gIndex = 0; gIndex < groups.length; gIndex++) {
                            if (groups[gIndex]['groupType'] == 'accessControl') {
                              for (var cIndex = 0; cIndex < groups[gIndex]['groupMembers'].length; cIndex++) {
                                cctvArray.push(groups[gIndex]['groupMembers'][cIndex])
                              }
                            }
                          }
                        }

                        let elementId = '#' + empInfo[0]['empId'].replace("@", "hhyt")
                        if (cctvArray.includes(selected_Cam_ID)) {

                          authorizedHitLight = authorizedHitLight && true;
                          $(elementId).addClass('accessGrantRow')
                          $(elementId).find('.accessControlInfoRow').addClass('accessControlImageGreen')

                          $(elementId).find('.authStatusValue').html("Authorized")
                          $(elementId).find('.rowParam').each(function(index) {
                            $(this).removeClass('redStatus')
                            $(this).removeClass('greenStatus')
                            if ($(this).hasClass('accessControlRow')) {
                              $(this).addClass('greenStatus')
                            }
                          })
                          $('.accessControlImageGreen').html('<img alt="Vector Approved Grunge Stamp Seal With Tick Inside. Green Approved ..." class="img-responsive n3VNCb" src="https://previews.123rf.com/images/designtools/designtools1812/designtools181201313/127229636-vector-approved-grunge-stamp-seal-with-tick-inside-green-approved-mark-with-grunge-surface-round-rub.jpg" jsname="HiaYvf" jsaction="load:XAeZkd;" data-iml="10797.14999999851" style="width: 200px; height: 200px; margin: 0px;">');
                        } else {

                          authorizedHitLight = authorizedHitLight && false;
                          $(elementId).addClass('accessDenyRow')
                          $(elementId).find('.accessControlInfoRow').addClass('accessControlImageRed')

                          $(elementId).find('.authStatusValue').html("Not Authorized")
                          $(elementId).find('.rowParam').each(function(index) {
                            if ($(this).hasClass('accessControlRow')) {
                              $(this).addClass('redStatus')
                            }
                          })
                          $('.accessControlImageRed').html("<img src='https://sites.google.com/a/prsdnj.org/transportationhomepage/_/rsrc/1462195805914/home/unauthorized-school-bus-entry/Do-Not-Enter-Sign.gif?height=320&amp;width=320' style='width: 200px; height: 200px; margin: 0px;' class='img-responsive'>");
                        }

                        $("#" + uniqueEmployeeArray['empId']).find(".accessControlRow").addClass("goAhead")
                      }

                      if (usageTypes.includes("asApp")) {
                        if (!$("#" + uniqueEmployeeArray['empId']).find(".asAppRow").hasClass("goAhead")) {
                          $('#' + uniqueEmployeeArray['empId']).find('.bigTempValue').html(asStatus)
                          if (asStatus == 'arogya status is red') {
                            authorizedHitLight = authorizedHitLight && false;
                            $('#' + uniqueEmployeeArray['empId']).find('.asAppStatus').find('.asAppStatusButton').each(function(index) {
                              $(this).removeClass('active')
                              if ($(this).hasClass('asRed')) {
                                $(this).addClass('active')
                              }
                            })
                            $('#' + uniqueEmployeeArray['empId']).find('.rowParam').each(function(index) {
                              if ($(this).hasClass('asAppRow')) {
                                $(this).addClass('redStatus')
                              }
                            })
                          } else if (asStatus == 'arogya status is green') {
                            authorizedHitLight = authorizedHitLight && true;
                            $("#" + uniqueEmployeeArray['empId']).find(".asAppRow").addClass("goAhead")

                            $('#' + uniqueEmployeeArray['empId']).find('.asAppStatus').find('.asAppStatusButton').each(function(index) {
                              $(this).removeClass('active')
                              if ($(this).hasClass('asGreen')) {
                                $(this).addClass('active')
                              }
                            })
                            $('#' + uniqueEmployeeArray['empId']).find('.rowParam').each(function(index) {
                              if ($(this).hasClass('asAppRow')) {
                                $(this).addClass('greenStatus')
                              }
                            })
                          } else if (asStatus == 'No cellphone is present on screen') {
                            authorizedHitLight = authorizedHitLight && false;
                            $('#' + uniqueEmployeeArray['empId']).find('.asAppStatus').find('.asAppStatusButton').each(function(index) {
                              $(this).removeClass('active')
                              if ($(this).hasClass('noInput')) {
                                $(this).addClass('active')
                              }
                            })
                          }
                        }
                      }

                      if (usageTypes.includes("tempratureAutomation")) {
                        // if (tempData.tempratureRecorded) {
                        //   tempValuesArr = tempData.tempratureRecorded.split("")
                        //   let tempValue = "";
                        //   for (var i = 0; i < tempValuesArr.length; i++) {
                        //     if (i == tempValuesArr.length - 1) {
                        //       tempValue = tempValue + "."
                        //     }
                        //     tempValue = tempValue + tempValuesArr[i];
                        //   }
                        //   $('#' + uniqueEmployeeArray[i]['empId']).find('.bodyTemp').val(tempValue)
                        // }
                        if (uniqueEmployeeArray['empId'] != "Unknown") {
                          let cronTempVal = false;
                          let maxTries = 0
                          while (!cronTempVal) {

                            cronTempVal = await cronTemp({
                              empId: uniqueEmployeeArray['empId']
                            });
                            // console.log("Temp try for", uniqueEmployeeArray['empId'], cronTempVal)
                            if (cronTempVal) {
                              $("#" + uniqueEmployeeArray['empId']).find(".temperatureRow").addClass("goAhead")
                              break;
                            }

                            if ($('.employeeRow').length > 1) {
                              break
                            }

                            maxTries++
                            if (maxTries > 10) {
                              break
                            }

                          }
                        }
                      }

                      checkIfRowCanRemoved(uniqueEmployeeArray['empId'], {
                        authorizedHitLight: authorizedHitLight
                      })

                      return 'done'
                    }

                    someAsyncProcedure({
                      uniqueEmployeeArray: uniqueEmployeeArray[i]
                    }).then(x => {
                      // console.log(x)
                    }).catch(err => {
                      console.log("Error", err);
                    })

                  } catch (err) {
                    console.log(err)
                  }
                }
              }
            }
          }
        }
        $('[id]').each(function() {
          $('[id="' + this.id + '"]:gt(0)').remove();
        });
      } else {
        $("#personInfo").html("<h1 style='text-align:center;color:white;'>Facial Recognition - JBM AI</h1>")
      }
    }
  })
}

function removeIdFromuniqueEmployeeArray(empId) {
  for (var i = 0; i < uniqueEmployeeArray.length; i++) {
    if (uniqueEmployeeArray[i]['empId'] == empId) {
      uniqueEmployeeArray.splice(i, 1)
    }
  }
}

$(document).on('click', '.discardButton', function() {
  let employeeRow = $(this).parents('.employeeRow')
  employeeRow.remove()
  removeIdFromuniqueEmployeeArray(employeeRow.attr("id"))
})

setInterval(function() {
  $(".discardButton").each(function(index) {
    let timeOfAdd = $(this).attr("timeOfAddition")
    let timeDiff = Date.now() - timeOfAdd
    let timeDiffThreshold = (2000 * 60)
    // console.log("timeDiff", timeDiff/1000)
    if (timeDiff > timeDiffThreshold) {
      $(this).parents(".employeeRow").remove()
      removeIdFromuniqueEmployeeArray($(this).parents(".employeeRow").attr("id"))
    }
  })
}, 10000);

$(document).on('click', '.asAppStatusButton', function() {
  let employeeRow = $(this).parent('.employeeRow')
  employeeRow.find('.asAppStatus').find('.asAppStatusButton').each(function(index) {
    $(this).removeClass('active')
  })
  $(this).addClass('active')
  if ($(this).hasClass('asGreen')) {
    $(this).parents(".asAppRow").addClass("goAhead")
    $(this).parents(".asAppRow").removeClass("redStatus")
    $(this).parents(".asAppRow").addClass("greenStatus")
  } else if ($(this).hasClass('asRed')) {
    $(this).parents(".asAppRow").addClass("goAhead")
    $(this).parents(".asAppRow").removeClass("greenStatus")
    $(this).parents(".asAppRow").addClass("redStatus")
  } else if ($(this).hasClass('noInput')) {
    $(this).parents(".asAppRow").addClass("goAhead")
    $(this).parents(".asAppRow").removeClass("greenStatus")
    $(this).parents(".asAppRow").addClass("redStatus")
  }
  console.log("Added active class")
})

// $(document).on('click', '.asAppStatus', function() {
//   console.log($(this).parents('.employeeRow'))
//   let asAppStatus = $(this).parents('.employeeRow').find("input[name='asAppoptions']:checked").val()
//   console.log("AS APP STATUS BUTTON CLICKED:", asAppStatus)
//   if (asAppStatus == "green") {
//     $(this).parents(".asAppRow").addClass("goAhead")
//     $(this).parents(".asAppRow").removeClass("redStatus")
//     $(this).parents(".asAppRow").addClass("greenStatus")
//   } else {
//     $(this).parents(".asAppRow").addClass("goAhead")
//     $(this).parents(".asAppRow").removeClass("greenStatus")
//     $(this).parents(".asAppRow").addClass("redStatus")
//   }
// })

function checkIfRowCanRemoved(empId, data) {
  flag = true;
  let elementId = '#' + empId.replace("@", "hhyt")
  $(elementId).find('.rowCheck').each(function(index) {
    if (!$(this).hasClass('goAhead')) {
      flag = false;
    }
  })

  if (flag) {

    console.log("goAhead called")
    removeEmployeeRow(empId);

    let selected_Cam_ID_Details = globalCameraDetailsObject[selected_Cam_ID]
    let accessControlIoTDetails = {}
    let hasIoTDevice = false;
    for (var cIndex = 0; cIndex < selected_Cam_ID_Details.IoTDevices.length; cIndex++) {
      if (selected_Cam_ID_Details.IoTDevices[cIndex]['usageType'] == "accessControl") {
        hasIoTDevice = true;
        accessControlIoTDetails = selected_Cam_ID_Details.IoTDevices[cIndex]
        break
      }
    }

    if (hasIoTDevice) {
      if (data.authorizedHitLight) {
        authorizedHit({
          access: 'grant',
          empId: empId,
          ip: accessControlIoTDetails.ip
        }).then(function() {
          console.log("authorizedHit completed")
        })
      }
    }

    return;

  } else {
    setTimeout(function() {
      checkIfRowCanRemoved(empId, data);
    }, 2000)
  }

  // code that you cannot modify

}

function removeEmployeeRow(empId) {
  // console.log("remove for ", empId, "called")
  empId = empId.replace("@", "hhyt")
  setTimeout(function() {
    // for (var i = 0; i < uniqueEmployeeArray.length; i++) {
    //   if (uniqueEmployeeArray[i]['empId'] == empId) {
    //     $('#' + uniqueEmployeeArray[i]['empId']).remove()
    //     // uniqueEmployeeArray.splice(i, 1)
    //   }
    // }

    $('#' + empId).remove()

    addFieldToUniqueEmployeeArray({
      empId: empId,
      field: "attendance",
      value: "done"
    })
  }, 1000);
}

function addFieldToUniqueEmployeeArray(data) {
  // uniqueEmployeeArray.indexOf(newItem) === -1 ? uniqueEmployeeArray.push(newItem) : console.log("This item already exists");
  for (var i = 0; i < uniqueEmployeeArray.length; i++) {
    if (uniqueEmployeeArray[i]['empId'] == data.empId) {
      uniqueEmployeeArray[i][data.field] = data.value
      break;
    }
  }
}

$(window).on('load', function() {

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
    },
    error: function(err) {}
  });

  let companyId = getUrlParameter('companyId')
  f1 = getAllCameraDetails({
    type: 'faceRecog',
    companyId: companyId
    // type: 'manpower'
  }).then(function(value) {});

  $('#dtool').select2();
  setCamera();
  changeSocketId();
  checkServerLoad();
});

// setInterval(function(){
//   cronTemp(selected_Cam_ID);
// }, 2000);

function accessControlDeviceInfo(data) {
  let accessControlTempAuto = {}
  let selected_Cam_ID_Details = getSelectedCamIdDetails(selected_Cam_ID)
  if (selected_Cam_ID_Details.IoTDevices) {
    for (var i = 0; i < selected_Cam_ID_Details.IoTDevices.length; i++) {
      if (selected_Cam_ID_Details.IoTDevices[i]['usageType'] = data.usageType) {
        accessControlTempAuto = selected_Cam_ID_Details.IoTDevices[i]
      }
    }
    return accessControlTempAuto
  } else {
    return false
  }
}

function keepCloning(objectpassed) {
  if (objectpassed === null || typeof objectpassed !== 'object') {
    return objectpassed;
  }
  // give temporary-storage the original obj's constructor
  var temporaryStorage = objectpassed.constructor();
  for (var key in objectpassed) {
    temporaryStorage[key] = keepCloning(objectpassed[key]);
  }
  return temporaryStorage;
}

function getSelectedCamIdDetails(camId) {
  let selected_Cam_ID_Details = undefined;
  for (var i = 0; i < globalCameraDetails.length; i++) {
    if (globalCameraDetails[i]['camName'] == camId) {
      // selected_Cam_ID_Details = JSON.parse(JSON.stringify(globalCameraDetails[i]));
      selected_Cam_ID_Details = (keepCloning(globalCameraDetails[i]));
    }
  }
  return selected_Cam_ID_Details
}

function checkIfCanSubmit(data) {
  let submitTemp = $('#' + data.empId).find('.submitTemp');
  let empRow = $('#' + data.empId);
  submitTemp.trigger('click');
}

function cronTemp(data) {
  return new Promise(function(resolve, reject) {
    let tempInput = $('#' + data.empId).find(".bodyTemp");
    let bigTempValue = $('#' + data.empId).find('.bigTempValue');
    let submitTemp = $('#' + data.empId).find('.submitTemp');
    let empId = data.empId;

    accessControlTempAuto = accessControlDeviceInfo({
      usageType: "tempAutomation"
    })

    if (accessControlTempAuto.type == "manual" || !accessControlTempAuto) {
      resolve({
        empId: empId
      })
    }

    getTempFromLocalServer({
      ip: accessControlTempAuto.ip,
      type: accessControlTempAuto.type,
      empId: empId
    }).then(function(v, err) {
      if (!v) {
        console.log("err", v)
        resolve(false)
      }
      let autoTempSuccess = putAutoTempReading(v, accessControlTempAuto.type, empId)
      if (autoTempSuccess) {
        checkIfCanSubmit({
          empId: empId
        });
        resolve({
          empId: empId
        })
      } else {
        reject()
      }
    }).catch(function(err) {
      console.log("getTempFromLocalServer catch error", err)
      reject()
    });
  })
}

function putAutoTempReading(res, autoTempType, empId) {
  let tempInput = $('#' + empId).find(".bodyTemp")
  let tempInputBigText = $('#' + empId).find('.bigTempValue')
  if (autoTempType == "sensor") {
    if (res['variables']) {
      if (res['variables']['temperatureBef'] == 0) {
        // cronTemp()
        tempInput.val("Stand Near Sensor")
        return false
      } else {
        if (res['variables']['temperatureBef'] && res['variables']['temperatureAf']) {
          let tempString = res['variables']['temperatureBef'].toString() + "." + res['variables']['temperatureAf'].toString()
          tempInput.val(tempString)
          // tempInputBigText.html(tempString)
          return true
        } else {
          return false
        }
      }
    }
  } else if (autoTempType == "webcam") {
    if (res) {
      if (res.includes("recapture")) {
        return false
      } else {
        // if (parseInt(res)) {
        // console.log(parseInt(res))
        tempInput.val(res)
        // tempInputBigText.html(res)
        return true
        // } else {
        //   console.log("aas")
        //   return false
        // }
      }
    } else {
      return false
    }
  } else {
    return false
  }
}

$(document).on('click', '.thermometerReading', function() {
  let tempInput = $(this).parents(".employeeRow").find(".bodyTemp")
  let empId = $(this).parents(".employeeRow").attr("id")

  accessControlTempAuto = accessControlDeviceInfo({
    usageType: "tempAutomation"
  })

  // checkPing(accessControlTempAuto.ip);

  getTempFromLocalServer({
    ip: accessControlTempAuto.ip,
    type: accessControlTempAuto.type,
    empId: empId
  }).then(function(v, err) {
    if (!v) {
      console.log(err)
    } else {
      let autoTempSuccess = putAutoTempReading(v, accessControlTempAuto.type)
      // let submitTemp = $('#' + empId).find('.submitTemp');
      // let empRow = $('#' + empId);
      // submitTemp.trigger('click');
      //
      // removeEmployeeRow(empId);
    }
  }).catch(err => {
    console.log("Error", err);
  });
})

function submitTemperatureAPI(dataToBeSent) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: serviceUrl + "face/covid/temprature",
      type: "POST",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      data: JSON.stringify(dataToBeSent),
      success: function(res, output, xhr) {
        checkIfRowCanRemoved(dataToBeSent.empId, {
          authorizedHitLight: true
        });
        resolve();
      },
      error: function(err) {
        toastr["error"]("Getting Camera Info Failed")
      }
    });
  });
}

$(document).on('click', '.submitTemp', function() {
  let empId = $(this).parents(".employeeRow").attr("id")
  let bodyTemp = $(this).parents(".employeeRow").find(".bodyTemp").val()
  let asAppStatus = $(this).parents(".employeeRow").find(".asAppStatus").find("input[name='asAppoptions']:checked").val()
  let frameId = $(this).parents(".employeeRow").attr("frameId")
  // if (asAppStatus == undefined) {
  //   toastr["error"]("Enter AS App status")
  //   return
  // }
  if (bodyTemp) {
    $("#" + empId).find(".temperatureRow").addClass("goAhead");
    $("#" + empId).find(".temperatureRow").addClass("greenStatus");

    let dataToBeSent = {
      empId: empId.replace("hhyt", "@"),
      bodyTemp: bodyTemp,
      asAppStatus: asAppStatus,
      frameId: frameId
    }

    let temprature = submitTemperatureAPI(dataToBeSent);

  } else {
    toastr["error"]("Please enter both temprature and Arogya setu value")
  }
})

function getTempFromLocalServer(data) {
  // hits a local thermometer server
  // data.ip = "localhost:5000"
  return new Promise(function(resolve, reject) {
    console.log("globalRequestTempSent", globalRequestTempSent)
    if (!globalRequestTempSent) {
      globalRequestTempSent = true;
      $.ajax({
        url: "http://" + data.ip + "/",
        type: "GET",
        crossDomain: true,
        processData: false,
        success: function(res, output, xhr) {
          globalRequestTempSent = false;
          resolve(res)
        },
        error: function(err) {
          toastr["error"]("Getting Temprature Info Failed")
          globalRequestTempSent = false;
          // console.log("getTempFromLocalServer error", err)
          resolve(false)
        }
      });
    } else {
      resolve(false)
    }
  })
}

function authorizedHit(data) {
  // hits a local accessControl server
  return new Promise(function(resolve, reject) {
    if (!globalRequestAuthSent) {
      globalRequestAuthSent = true;
      let empId = data.empId;
      let access = data.access;
      if (data.ip) {
        if (access == 'grant') {
          $.ajax({
            url: "http://" + data.ip + "?param=" + empId.split("_")[0],
            type: "GET",
            crossDomain: true,
            processData: false,
            success: function(res, output, xhr) {
              console.log(res)
              globalRequestAuthSent = false;
              resolve(true)
            },
            error: function(err) {
              toastr["error"]("Getting Temprature Info Failed")
              globalRequestAuthSent = false;
            }
          });
        } else {
          console.log(access)
        }
      } else {
        reject(false)
      }
    } else {
      reject(false)
    }
  })
}

function updateCamDopdown(data) {

  $('#cameraSelectTag').html('<option value="test">Select your CCTV ID</option>');

  for (var index = 0; index < data.length; index++) {
    $('#cameraSelectTag').append('<option value="' + data[index]['camName'] + '" >' + data[index]['location'] + ' ( IP: ' + data[index]['camName'] + ')</option>')
  }
  $('#cameraSelectTag').select2();
}

function getAllCameraDetails(data) {
  return $.ajax({
    url: serviceUrl + "face/caminfo?type=" + data.type + "&companyId=" + data.companyId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      globalCameraDetails = res;
      for (var cIndex = 0; cIndex < res.length; cIndex++) {
        globalCameraDetailsObject[res[cIndex]['camName']] = (keepCloning(res[cIndex]));
      }
      updateCamDopdown(res);
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

function isValidIpv4Addr(ip) {
  return /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/.test(ip);
}

$(document).on('change', '#cameraSelectTag', function() {
  selected_Cam_ID = $(this).val();
  setCamera();
  changeSocketId();

  let selected_Cam_ID_Details = globalCameraDetailsObject[selected_Cam_ID]
  let accessControlIoTDetails = {}
  let hasIoTDevice = false;
  for (var cIndex = 0; cIndex < selected_Cam_ID_Details.IoTDevices.length; cIndex++) {
    if (selected_Cam_ID_Details.IoTDevices[cIndex]['usageType'] == "accessControl") {
      hasIoTDevice = true;
      accessControlIoTDetails = selected_Cam_ID_Details.IoTDevices[cIndex]
      IoTDeviceIp = accessControlIoTDetails.ip
      IoTDeviceIp = IoTDeviceIp.split("/")[0]
      if (isValidIpv4Addr(IoTDeviceIp)) {
        checkAnyIpPing(IoTDeviceIp)
      }
      break
    }
  }
  $("#personInfo").html("<h1 style='text-align:center'>Facial Recognition - JBM AI</h1>")
})

function checkServerLoad() {
  let startDate = getdateISOString(0).split("T")[0] + "T00:00:00.000Z"
  let endDate = getdateISOString(0).split("T")[0] + "T23:59:59.999Z"
  $.ajax({
    url: serviceUrl + "face/getAnalytics/syslogs?startDate=" + startDate + "&endDate=" + endDate + "&latest=10",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let queueSize = []
      for (var i = 0; i < res.length; i++) {
        queueSize.push(res[i]['queueSize'])
      }
      let maxQueueSize = Math.max(...queueSize);
      $('#serverLoadStatus').attr('title', "QueueSize: " + maxQueueSize)
      $('#serverLoadText').html(maxQueueSize)
      if (maxQueueSize < 2) {
        $('#serverLoadStatus').removeClass('led-red')
        $('#serverLoadStatus').removeClass('led-grey')
        $('#serverLoadStatus').removeClass('led-green')
        $('#serverLoadStatus').removeClass('led-yellow')
        $('#serverLoadStatus').addClass('led-green')
      } else if (2 <= maxQueueSize && maxQueueSize <= 10) {
        $('#serverLoadStatus').removeClass('led-red')
        $('#serverLoadStatus').removeClass('led-grey')
        $('#serverLoadStatus').removeClass('led-green')
        $('#serverLoadStatus').removeClass('led-yellow')
        $('#serverLoadStatus').addClass('led-yellow')
      } else {
        $('#serverLoadStatus').removeClass('led-red')
        $('#serverLoadStatus').removeClass('led-grey')
        $('#serverLoadStatus').removeClass('led-green')
        $('#serverLoadStatus').removeClass('led-yellow')
        $('#serverLoadStatus').addClass('led-red')
      }
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

function checkPing(camId) {
  for (var i = 0; i < globalCameraDetails.length; i++) {
    if (globalCameraDetails[i]['camName'] == camId) {
      ping('https://' + globalCameraDetails[i]['hardware']['ip']).then(function(delta) {
        $('#cameraPingText').html(delta + " ms")
        if (delta < 100) {
          $('#cameraPingStatus').removeClass('led-red')
          $('#cameraPingStatus').removeClass('led-grey')
          $('#cameraPingStatus').removeClass('led-green')
          $('#cameraPingStatus').removeClass('led-yellow')
          $('#cameraPingStatus').addClass('led-green')
        } else if (100 < delta && delta < 300) {
          $('#cameraPingStatus').removeClass('led-red')
          $('#cameraPingStatus').removeClass('led-grey')
          $('#cameraPingStatus').removeClass('led-green')
          $('#cameraPingStatus').removeClass('led-yellow')
          $('#cameraPingStatus').addClass('led-yellow')
        }
      }).catch(function(err) {
        $('#cameraPingStatus').removeClass('led-red')
        $('#cameraPingStatus').removeClass('led-grey')
        $('#cameraPingStatus').removeClass('led-green')
        $('#cameraPingStatus').removeClass('led-yellow')
        $('#cameraPingStatus').addClass('led-red')
      });
    }
  }
}

function checkAnyIpPing(ip) {
  ping('http://' + ip).then(function(delta) {
    if (delta < 100) {
      $('#IoTDevicesPing').removeClass('led-red')
      $('#IoTDevicesPing').removeClass('led-grey')
      $('#IoTDevicesPing').removeClass('led-green')
      $('#IoTDevicesPing').removeClass('led-yellow')
      $('#IoTDevicesPing').addClass('led-green')
    } else if (100 < delta && delta < 300) {
      $('#IoTDevicesPing').removeClass('led-red')
      $('#IoTDevicesPing').removeClass('led-grey')
      $('#IoTDevicesPing').removeClass('led-green')
      $('#IoTDevicesPing').removeClass('led-yellow')
      $('#IoTDevicesPing').addClass('led-yellow')
    }
  }).catch(function(err) {
    $('#IoTDevicesPing').removeClass('led-red')
    $('#IoTDevicesPing').removeClass('led-grey')
    $('#IoTDevicesPing').removeClass('led-green')
    $('#IoTDevicesPing').removeClass('led-yellow')
    $('#IoTDevicesPing').addClass('led-red')
  });
}

function checkFramesAnalysed(camId) {
  let startDate = getdateISOString(0).split("T")[0] + "T00:00:00.000Z"
  let endDate = getdateISOString(0).split("T")[0] + "T23:59:59.999Z"
  $.ajax({
    url: serviceUrl + "face/getFaceInfo?startDate=" + startDate + "&endDate=" + endDate + "&companyId=" + getUrlParameter('companyId') + "&latest=" + 1 + "&rawframe=1&camId=" + camId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let timeDff = undefined;
      for (var i = 0; i < res.length; i++) {
        let currentTime = new Date(moment().toISOString());
        let mostRecentFrameTime = new Date(moment(res[0]['time']).subtract(5, 'hours').subtract(30, 'minutes').toISOString())
        timeDff = Math.floor(Math.abs(currentTime - mostRecentFrameTime) / 1000);
        break;
      }

      if (60 < timeDff && timeDff < 120) {
        $('#framesAnalysedStatus').removeClass('led-red')
        $('#framesAnalysedStatus').removeClass('led-grey')
        $('#framesAnalysedStatus').removeClass('led-green')
        $('#framesAnalysedStatus').removeClass('led-yellow')
        $('#framesAnalysedStatus').addClass('led-yellow')
      } else if (timeDff < 60) {
        $('#framesAnalysedStatus').removeClass('led-red')
        $('#framesAnalysedStatus').removeClass('led-grey')
        $('#framesAnalysedStatus').removeClass('led-green')
        $('#framesAnalysedStatus').removeClass('led-yellow')
        $('#framesAnalysedStatus').addClass('led-green')
      } else {
        $('#framesAnalysedStatus').removeClass('led-red')
        $('#framesAnalysedStatus').removeClass('led-grey')
        $('#framesAnalysedStatus').removeClass('led-green')
        $('#framesAnalysedStatus').removeClass('led-yellow')
        $('#framesAnalysedStatus').addClass('led-red')
      }

      $('#cameraLastFrameText').html(timeDff ? (timeDff + "s ago") : "--")
      $('#framesAnalysedStatus').attr('title', "Last Frame: " + (timeDff ? (timeDff + "seconds ago") : "--"))
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

function checkLightingConditions(camId) {
  let startDate = getdateISOString(-1).split("T")[0] + "T00:00:00.000Z"
  let endDate = getdateISOString(0).split("T")[0] + "T23:59:59.999Z"
  $.ajax({
    url: serviceUrl + "face/getAnalytics/lightingConditions?startDate=" + startDate + "&endDate=" + endDate + "&companyId=" + getUrlParameter('companyId') + "&latest=" + 1 + "&rawframe=1&camId=" + camId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      let timeDff = undefined;

      $('#cameraLightingText').html((res['lightingConditions'] != null) ? res['lightingConditions'] : "Not Acceptable")
      if (res['lightingConditions'] == 'Acceptable') {
        $('#lightingConditionStatus').removeClass('led-red')
        $('#lightingConditionStatus').removeClass('led-grey')
        $('#lightingConditionStatus').removeClass('led-green')
        $('#lightingConditionStatus').removeClass('led-yellow')
        $('#lightingConditionStatus').addClass('led-green')
      } else if (res['lightingConditions'] == 'Underexposed') {
        $('#lightingConditionStatus').removeClass('led-red')
        $('#lightingConditionStatus').removeClass('led-grey')
        $('#lightingConditionStatus').removeClass('led-green')
        $('#lightingConditionStatus').removeClass('led-yellow')
        $('#lightingConditionStatus').addClass('led-yellow')
      } else if (res['lightingConditions'] == 'Overexposed') {
        $('#lightingConditionStatus').removeClass('led-red')
        $('#lightingConditionStatus').removeClass('led-grey')
        $('#lightingConditionStatus').removeClass('led-green')
        $('#lightingConditionStatus').removeClass('led-yellow')
        $('#lightingConditionStatus').addClass('led-yellow')
      } else {
        $('#lightingConditionStatus').removeClass('led-red')
        $('#lightingConditionStatus').removeClass('led-grey')
        $('#lightingConditionStatus').removeClass('led-green')
        $('#lightingConditionStatus').removeClass('led-yellow')
        $('#lightingConditionStatus').addClass('led-red')
      }
      $('#lightingConditionStatus').attr('title', "Face : " + (res['lightingConditions'] != null) ? res['lightingConditions'] : "Not Acceptable")

    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

setInterval(function() {
  checkServerLoad();
  MeasureConnectionSpeed();
  checkPing(selected_Cam_ID);
  checkFramesAnalysed(selected_Cam_ID);
  checkLightingConditions(selected_Cam_ID);
  if (IoTDeviceIp) {
    checkPing(IoTDeviceIp);
  }
}, 200000);

setTimeout(function() {
  location.reload();
}, 3600000);

// setTimeout(function() {
//   $('#liveFeedImage').hide()
//   $('#liveFeedImageDefault').show()
// }, 5000);

//JUST AN EXAMPLE, PLEASE USE YOUR OWN PICTURE!
var imageAddr = "http://www.kenrockwell.com/contax/images/g2/examples/31120037-5mb.jpg";
var downloadSize = 4995374; //bytes

function MeasureConnectionSpeed() {
  var startTime, endTime;
  var download = new Image();
  download.onload = function() {
    endTime = (new Date()).getTime();
    showResults();
  }

  // download.onerror = function(err, msg) {
  //   ShowProgressMessage("Invalid image, or error downloading");
  // }

  startTime = (new Date()).getTime();
  var cacheBuster = "?nnn=" + startTime;
  download.src = imageAddr + cacheBuster;

  function showResults() {
    var duration = (endTime - startTime) / 1000;
    var bitsLoaded = downloadSize * 8;
    var speedBps = (bitsLoaded / duration).toFixed(2);
    var speedKbps = (speedBps / 1024).toFixed(2);
    var speedMbps = (speedKbps / 1024).toFixed(2);
    $('#networkSpeedStatus').attr('title', speedMbps.toString() + " Mbps")
    $('#uploadSpeedText').html(speedMbps.toString() + " Mbps")
    if (5 <= speedMbps && speedMbps <= 10) {
      $('#networkSpeedStatus').removeClass('led-red')
      $('#networkSpeedStatus').removeClass('led-grey')
      $('#networkSpeedStatus').removeClass('led-green')
      $('#networkSpeedStatus').removeClass('led-yellow')
      $('#networkSpeedStatus').addClass('led-yellow')
    } else if (speedMbps > 10) {
      $('#networkSpeedStatus').removeClass('led-red')
      $('#networkSpeedStatus').removeClass('led-grey')
      $('#networkSpeedStatus').removeClass('led-green')
      $('#networkSpeedStatus').removeClass('led-yellow')
      $('#networkSpeedStatus').addClass('led-green')
    } else {
      $('#networkSpeedStatus').removeClass('led-red')
      $('#networkSpeedStatus').removeClass('led-grey')
      $('#networkSpeedStatus').removeClass('led-green')
      $('#networkSpeedStatus').removeClass('led-yellow')
      $('#networkSpeedStatus').addClass('led-red')
    }
  }
}
