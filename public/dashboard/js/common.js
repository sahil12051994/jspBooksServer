function getServiceURL() {
  var url = document.URL;
  var arr = url.split('/');
  url = arr[0] + '//' + arr[2] + '/';
  // alert(url)
  return url;
}

var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jsp');

text_truncate = function(str, length, ending) {
  if (length == null) {
    length = 100;
  }
  if (ending == null) {
    ending = '...';
  }
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  } else {
    return str;
  }
};

$(document).on('click', "#logout_button", function() {
  $.ajax({
    url: serviceUrl + "jsp/logout",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      if (res.redirect) {
        // console.log("logout")
        $.removeCookie('uId', null);
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

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
};
