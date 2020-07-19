$(document).on('click', '#checkPerson', function() {
  $.ajax({
    url: serviceUrl + "face/covid/inspect?latlong=" + $('#latLongValue').val() + "&range=" + $('#rangeOfPersonTested').val(),
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    dataType: "json",
    success: function(res, output, xhr) {
      console.log(res)
      $('#infectedPersonsText').html()
      if(res.length > 0) {
        $('#divForInputsAddress').removeClass('greenBackgroud')
        $('#divForInputsAddress').addClass('redBackgroud')
        let tempText= ''
        for (var i = 0; i < res.length; i++) {
          tempText = tempText + '<hr><p>'+res[i]['address'] +'<br>'+ res[i]['distanceFromHisCoordinates']+'<br>'+res[i]['timefrom']+'<br>'+res[i]['timeto']+'</p>'
        }
        $('#infectedPersonsText').html(tempText)
      } else {
        $('#divForInputsAddress').addClass('greenBackgroud')
        $('#divForInputsAddress').removeClass('redBackgroud')
      }
    },
    error: function(err) {

    }
  });
})
