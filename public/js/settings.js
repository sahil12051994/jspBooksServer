var f1;
let allGroupsInfo;


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
    },
    error: function(err) {}
  });

  f1 = getAllCameraDetails({
    type: 'faceRecog'
    // type: 'manpower'
  }).then(function(value) {
  });

  $('#dtool').select2();
});

function updateCamDopdown(data) {
  $('#searchCamSettingSelectTag').html('');
  $('#cameraMaskingSelectTag').html('');

  for (var index = 0; index < data.length; index++) {
    $('#searchCamSettingSelectTag').append('<option value="' + data[index]['camName'] + '" >' + data[index]['location'] + ' ( IP: ' + data[index]['camName'] + ')</option>')
    $('#cameraMaskingSelectTag').append('<option value="' + data[index]['camName'] + '" >' + data[index]['location'] + ' ( IP: ' + data[index]['camName'] + ')</option>')
  }
  $('#searchCamSettingSelectTag').select2();
  $('#cameraMaskingSelectTag').select2();
  $('#selectedCamUsageType').select2();
  document.getElementById("camBackground").src = serviceUrl + 'face/getframe?camId=' + $('#cameraMaskingSelectTag').val() + '&random=1';
}

function getAllCameraDetails(data) {
  return $.ajax({
    url: serviceUrl + "face/caminfo?type=" + data.type,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      updateCamDopdown(res);
      allCamInfo = res;
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
}

$(document).on('change', '#searchCamSettingSelectTag', function() {
  $.ajax({
    url: serviceUrl + "face/caminfo?type=faceRecog" + "&camName=" + $(this).val(),
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      setSingleCamInfoValues(res[0])
    },
    error: function(err) {
      toastr["error"]("Getting Camera Info Failed")
    }
  });
})

function setSingleCamInfoValues(camObj) {
  console.log(camObj.camName)
  $('#selectedCamNameAdd').val(camObj.camName)
  $('#selectedCamLocationAdd').val(camObj.location)
  $('#selectedCamPlantAdd').val(camObj.plant)
  $('#selectedCamIpAdd').val(camObj.hardware.ip)
  $('#selectedCamMakeAdd').val(camObj.hardware.make)
  $('#selectedCamHardNumAdd').val(camObj.hardware.hardwareNumber)
  $('#selectedCamThresholdAdd').val(camObj.aiStats.threshold)
  $('#selectedCamPrecisionAdd').val(camObj.aiStats.precision)
  $('#selectedCamRecallAdd').val(camObj.aiStats.recall)
  $('#selectedCamUsageType').val(camObj.usageType.split("|")).trigger('change');
  $('#selectedCamUsernameAdd').val(camObj.login.username)
  $('#selectedCamPasswordAdd').val(camObj.login.password)
  $('#selectedCamFpsAdd').val(camObj.fps)

  $('#testPingButton').attr('ip', camObj.hardware.ip)
  $('#testPingButton').attr('camId', camObj.location)
  $('#testPingButton').attr('mId', camObj._id)

  for (var i = 0; i < camObj.iotDeviceIds.length; i++) {
    $('#selectedCamIotDeviceIdsAdd').val("" + camObj.iotDeviceIds[i] + ",")
  }

  if(camObj.hasOwnProperty("IoTDevices")) {
    for (var i = 0; i < camObj.IoTDevices.length; i++) {
      if(camObj.IoTDevices[i]['usageType'] == 'accessControl') {
        if(camObj.IoTDevices[i]['ip']) {
          $('#selectedCamIoTIpAdd').val(camObj.IoTDevices[i]['ip'])
          $('#selectedCamIoTIpType').val(camObj.IoTDevices[i]['type'])
        }
      } else if(camObj.IoTDevices[i]['usageType'] == 'tempAutomation') {
        if(camObj.IoTDevices[i]['ip']) {
          $('#selectedCamTempIpAdd').val(camObj.IoTDevices[i]['ip'])
          $('#selectedCamTempType').val(camObj.IoTDevices[i]['type'])
        }
      }
    }
  }
}


$(document).on('click', '#testPingButton', function() {
  let camIp = $(this).attr('ip')
  let camId = $(this).attr('camId')

  if (camId != undefined) {
    ping('https://' + camIp).then(function(delta) {
      // console.log(camId + 'Ping time was ' + String(delta) + ' ms');
      toastr["success"](camId + ' -> Ping time was ' + String(delta) + ' ms')
    }).catch(function(err) {
      console.error('Could not ping remote URL', err);
      toastr["error"]('Could not ping remote URL', err)
    });
  }
})

$(document).on('click', '#updateCamInfoButton', function() {

  let camObj = {}
  camObj['camName'] = $('#selectedCamNameAdd').val()
  camObj['location'] = $('#selectedCamLocationAdd').val()
  camObj['plant'] = $('#selectedCamPlantAdd').val()
  camObj['usageType'] = $('#selectedCamUsageType').val().join("|")
  camObj['fps'] = $('#selectedCamFpsAdd').val()
  camObj['IoTDevices'] = []

  if($('#selectedCamIoTIpType').val() != "noAccessControl") {
    camObj['IoTDevices'].push({
      type: $('#selectedCamIoTIpType').val(),
      ip: $('#selectedCamIoTIpAdd').val(),
      usageType: "accessControl"
    })
  }

  camObj['IoTDevices'].push({
    type: $('#selectedCamTempType').val(),
    ip: $('#selectedCamTempIpAdd').val(),
    usageType: "tempAutomation"
  })

  camObj['hardware'] = {}
  camObj['hardware']['ip'] = $('#selectedCamIpAdd').val()
  camObj['hardware']['make'] = $('#selectedCamMakeAdd').val()
  camObj['aiStats'] = {}
  camObj['aiStats']['threshold'] = $('#selectedCamThresholdAdd').val()
  camObj['aiStats']['precision'] = $('#selectedCamPrecisionAdd').val()
  camObj['aiStats']['recall'] = $('#selectedCamRecallAdd').val()
  camObj['login'] = {}
  camObj['login']['username'] = $('#selectedCamUsernameAdd').val()
  camObj['login']['password'] = $('#selectedCamPasswordAdd').val()

  camObj['iotDeviceIds'] = $('#selectedCamIotDeviceIdsAdd').val().split(",")

  let camId = $('#testPingButton').attr('mId')

  let data = {}
  data['updateInfo'] = camObj;

  console.log(data)

  $.ajax({
    url: serviceUrl + "face/caminfo/" + camId,
    type: "PUT",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    data: JSON.stringify(data),
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
