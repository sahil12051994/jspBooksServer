var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

let plant_level_element;
let camera_level_element;
var selected_Plant_ID;
//var console = {};
//console.log = function(){};
Highcharts.setOptions({
  global: {
    useUTC: false
  }
});

function getFrameFunction(timestamp, id) {
   let date = new Date(timestamp).toISOString();
   let photo = document.getElementById('processedFrame');
   let imgURL = serviceUrl + "getframe?time=" + date + "Z&camId=" + id;
   photo.setAttribute("src", imgURL);
}

let chartObject = {
  chart: {
    type: 'spline',
    zoomType: 'xy'
  },
  title: {
    text: 'People Count Graph of video (data)'
  },
  subtitle: {
    text: 'Manpower detected count during the video uploaded, Select area to zoom'
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { // don't display the dummy year
    second: '%H:%M:%S',
    minute: '%H:%M',
    hour: '%H:%M',
    day: '%e. %b',
    week: '%e. %b',
    month: '%b \'%y',
    year: '%Y'
    },
    title: {
      text: 'Date'
    }
  },
  yAxis: {
    title: {
      text: 'People Counted'
    },
    min: 0
  },
  tooltip: {
    headerFormat: '<b>{series.name}</b><br>',
    pointFormat: '{point.x:%e. %b}: {point.y}'
  },
  plotOptions: {
    spline: {
      marker: {
        enabled: true
      }
    },
    series: {
        cursor: 'pointer',
        point: {
            events: {
                click: function () {
                    // console.log('Category: ' + JSON.stringify(this, getCircularReplacer()) + ', value: ' + this.y);
                    // alert('Category: ' + new Date(this.category).toISOString() + ', value: ' + this.y);

                    // getFrameFunction(this.category,vId);
                    let photo = document.getElementById('processedFrame');
                    let imgURL = serviceUrl + "getframe?time=" + new Date(this.category).toISOString() + "&camId=" + activeVideoId;
                    console.log(imgURL)
                    photo.setAttribute("src", imgURL);
                }
            }
        }
    }
  },

  colors: ['#6CF', '#39F', '#06C', '#036', '#000'],

  // Define the data points. All series have a dummy year
  // of 1970/71 in order to be compared on the same x axis. Note
  // that in JavaScript, months start at 0 for January, 1 for February etc.
  series: [{
    name: "Model Detected People",
    data: [
      [Date.UTC(1970, 10, 25), 0],
      [Date.UTC(1970, 11, 6), 1],
      [Date.UTC(1970, 11, 20), 1],
      [Date.UTC(1970, 11, 25), 2],
      [Date.UTC(1971, 0, 4), 2],
      [Date.UTC(1971, 0, 17), 2],
      [Date.UTC(1971, 0, 24), 2],
      [Date.UTC(1971, 1, 4), 2],
      [Date.UTC(1971, 1, 14), 1],
      [Date.UTC(1971, 2, 6), 1],
      [Date.UTC(1971, 2, 14), 1],
      [Date.UTC(1971, 2, 24), 1],
      [Date.UTC(1971, 3, 1), 1],
      [Date.UTC(1971, 3, 11), 1],
      [Date.UTC(1971, 3, 27), 1],
      [Date.UTC(1971, 4, 4), 3],
      [Date.UTC(1971, 4, 9), 3],
      [Date.UTC(1971, 4, 14), 3],
      [Date.UTC(1971, 4, 19), 3],
      [Date.UTC(1971, 5, 4), 3],
      [Date.UTC(1971, 5, 9), 3],
      [Date.UTC(1971, 5, 14), 3],
      [Date.UTC(1971, 5, 19), 3],
      [Date.UTC(1971, 5, 24), 3],
      [Date.UTC(1971, 5, 29), 3],
      [Date.UTC(1971, 6, 3), 3],
      [Date.UTC(1971, 6, 4), 3]
    ]
  },{
    name: "Detected People Mode",
    data: [
      [Date.UTC(1970, 10, 25), 1],
      [Date.UTC(1970, 11, 6), 1],
      [Date.UTC(1970, 11, 20), 1],
      [Date.UTC(1970, 11, 25), 1],
      [Date.UTC(1971, 0, 4), 1],
      [Date.UTC(1971, 0, 17), 1],
      [Date.UTC(1971, 0, 24), 2],
      [Date.UTC(1971, 1, 4), 2],
      [Date.UTC(1971, 1, 14), 2],
      [Date.UTC(1971, 2, 6), 2],
      [Date.UTC(1971, 2, 14), 2],
      [Date.UTC(1971, 2, 24), 2],
      [Date.UTC(1971, 3, 1), 2],
      [Date.UTC(1971, 3, 11), 2],
      [Date.UTC(1971, 3, 27), 2],
      [Date.UTC(1971, 4, 4), 2],
      [Date.UTC(1971, 4, 9), 2],
      [Date.UTC(1971, 4, 14), 2],
      [Date.UTC(1971, 4, 19), 2],
      [Date.UTC(1971, 5, 4), 2],
      [Date.UTC(1971, 5, 9), 3],
      [Date.UTC(1971, 5, 14), 3],
      [Date.UTC(1971, 5, 19), 3],
      [Date.UTC(1971, 5, 24), 3],
      [Date.UTC(1971, 5, 29), 3],
      [Date.UTC(1971, 6, 3), 3],
      [Date.UTC(1971, 6, 4), 3]
    ]
  }]
}

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
      currentUser = res;
      $.cookie("uId", res._id)
    },
    error: function(err) {}
  });

  Highcharts.chart('container', chartObject);

  $.ajax({
    url: serviceUrl + "logistics/user/" + urlUserId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      $('.video_list').html("")
      for(index=0; index < res.length; index++) {
        $('.video_list').append("<button type='button' class='btn btn-default vidUploadedButton' vId='"+res[index]._id+"'>" + res[index]._id + "</button>")
      }
    },
    error: function(err) {}
  });

});

let activeVideoId = undefined;

$(document).on('click', '.vidUploadedButton', function(){
  let vId = $(this).attr("vId");
  activeVideoId = vId;
  $.ajax({
    url: serviceUrl + "logistics/get/" + vId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      chartObject['series'] = []
      let dataPointObject = {}
      dataPointObject['name'] = "Model Detected People";
      dataPointObject["data"] = [];
      for (var index = 0; index < res.length; index++) {
        let date = res[index].time.split("T")[0]
        let time = res[index].time.split("T")[1]
        dataPointObject['data'].push([Date.parse(res[index].time),res[index].people_detected])
      }
      chartObject['series'].push(dataPointObject)
      Highcharts.chart('container', chartObject);
    },
    error: function(err) {}
  });
})

$("#submitVideo").click(function(event) {
  //disable the default form submission
  event.preventDefault();
  //grab all form data
   var form = $('#uploadVideo')[0];
   var data = new FormData(form);
   let file = $('#selectFileVideo')[0].files[0];
   let fileName = file.name.split(".")[0];
   let extension = file.name.split(".")[1]
   var regex1 = RegExp(/(?<!\S)[A-Za-z]+(?!\S)/gm);
   // if(regex1.test(fileName)){
     $.ajax({
       url: '/logistics/vidupload?fName=' + fileName + '&ext=' + extension + '&uId=' + $.cookie("uId"),
       type: 'POST',
       data: data,
       async: false,
       cache: false,
       contentType: false,
       processData: false,
       success: function(res) {
         if(res.status == 1){
           // $('#myModal').modal('toggle');
           toastr["success"]("Uploaded Video")
         } else {
           toastr["error"]("Uploading Video Failed")
         }
       },
       error: function() {
         toastr["error"]("error in ajax form submission for planned manpower")
       }
     });
   // } else {
   //   toastr["error"]("Please correct the file name as only letters")
   // }
  return false;
});

(function localFileVideoPlayer() {
	'use strict'
  var URL = window.URL || window.webkitURL
  var displayMessage = function (message, isError) {
    var element = document.querySelector('#message')
    element.innerHTML = message
    element.className = isError ? 'error' : 'info'
  }
  var playSelectedFile = function (event) {
    var file = this.files[0]
    var type = file.type
    var videoNode = document.querySelector('video')
    var canPlay = videoNode.canPlayType(type)
    if (canPlay === '') canPlay = 'no'
    var message = 'Can play type "' + type + '": ' + canPlay
    var isError = canPlay === 'no'
    displayMessage(message, isError)

    if (isError) {
      return
    }

    var fileURL = URL.createObjectURL(file)
    videoNode.src = fileURL
  }
  var inputNode = document.querySelector('input')
  inputNode.addEventListener('change', playSelectedFile, false)
})()
