var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

var socket = io(serviceUrl, {
  path: '/kafkamachine/socket'
});

$("#machineRecord").html("")

// var socket = io(serviceUrl);

socket.on('connect', () => {
  console.log("Connected to backend socket")
});

var dataString = ""

socket.on('hello', function(data) {
  // console.log("Listening...", data);
  dataString = data + "<br><br>" + dataString;
  let tempData = JSON.parse(data)
  for (var key in tempData) {
    // check if the property/key is defined in the object itself, not in parent
    if (tempData.hasOwnProperty(key)) {
      $("#" + key).html(tempData[key])
      $("#machineRecord").html(dataString)
    }
  }
})
