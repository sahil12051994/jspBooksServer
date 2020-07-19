$(window).on('load', function() {
  $('#plantId').select2();
  $('#typeOfEmployee').select2();
  $("#loader").hide();
  $("#uploaded").hide();
  if(getUrlParameter('companyId') == undefined) {
    window.location.replace(updateQueryStringParameter($(location).attr('href'), "companyId", "JBMGroup"))
  } else {
    $('#companyName').html(getUrlParameter('companyId'))
  }

  if(getUrlParameter('testing') == 1) {
    $('#plantId').html('<option value="test">Test Plant</option>')
  }
});

$(document).on('click', '#submitPm', function() {
	$("#loader").show();
})

$("#submitPm").click(function(event) {
  //disable the default form submission
  event.preventDefault();
  //grab all form data
  var form = $('#uploadForm')[0];
  var data = new FormData(form);
  let file = $('#selectFilePlm')[0].files;

	if ($('#fName').val().trim().toLowerCase().split(" ").length > 1) {
		toastr["error"]("Enter Only First Name");
		$("#loader").hide();
		$("#uploaded").hide();
		return 0
	}

  var reg = new RegExp('^\\d+$');
  if($('#typeOfEmployee').val() == 'contra') {
    console.log("contra Employee")
  } else {
    if(!reg.test($('#empId').val().trim())){
      toastr["error"]("Enter Only Numbers in Employee ID");
      $("#loader").hide();
      $("#uploaded").hide();
      return 0
    }
  }

	if ($('#selectFilePlm')[0].files.length != 4) {
		toastr["error"]("Please select 4 pictures");
		$("#loader").hide();
		$("#uploaded").hide();
		return 0
	}

	let name = ""
  let employmentType = undefined;
	if ($('#typeOfEmployee').val() == 'contra') {
    employmentType = "contractual"
		name = "Contractual@" + $('#fName').val().trim().toLowerCase()
	} else {
    employmentType = "permanent"
		name = $('#fName').val().trim().toLowerCase()
	}

  let companyId = undefined;
  if(getUrlParameter('companyId') == undefined) {
    toastr["error"]("Please check your link with HR, It should have companyId");
    return 0
  } else {
    companyId = getUrlParameter('companyId')
  }

  $.ajax({
    url: '/face/pictureUpload/upload?fName=' + name + '&plantId=' + $("#plantId").val() + '&employmentType='+ employmentType +'&empId=' + $('#empId').val().trim() + '&companyId=' + companyId,
    type: 'POST',
    data: data,
    async: false,
    cache: false,
    contentType: false,
    processData: false,
    success: function(res) {
      if (res.status == 1) {
        $("#loader").hide();
        $("#uploaded").show();
        toastr["success"]("Uploaded")
      } else {
        toastr["error"]("Uploading Planned Manpower Failed");
        $("#uploaded").hide();
      }
    },
    error: function() {
      toastr["error"]("Error")
      $("#uploaded").hide();
    }
  });
  return false;
});
